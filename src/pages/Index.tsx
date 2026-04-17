import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Category, Condition } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { CollegeListingsFilterBar } from "@/components/CollegeListingsFilterBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Search, Store, X, ShieldCheck, MessageCircle, Wallet, ChevronRight } from "lucide-react";
import { canonicalInstitutionName, loadInstitutionNames, normalizeInstitutionKey, searchInstitutionNames } from "@/lib/institutions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { sanitizeSingleLineInput } from "@/lib/inputSecurity";
import { deleteListingImages } from "@/lib/storage";
import { trackHandledError } from "@/lib/errorTracking";
import { LqipImage } from "@/components/LqipImage";
import { heroDesktopPlaceholder, heroMobilePlaceholder } from "@/lib/staticImagePlaceholders";

interface ListingRow {
  moderation_status?: string;
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images?: string[];
  seller_id: string;
  college: string;
  sold: boolean;
  likes: number;
  created_at: string;
  seller_name?: string;
  seller_phone?: string;
}

interface StoredHomeState {
  selectedCollege: string | null;
  collegeQuery: string;
  search: string;
  selectedCategory: Category | null;
  selectedCondition: Condition | null;
  priceRange: [number, number];
  visibleImageCount: number;
  listings: ListingRow[];
}

const INITIAL_VISIBLE_IMAGE_BATCH = 8;
const VISIBLE_IMAGE_BATCH_STEP = 12;
const MIN_FILTER_PRICE = 4;
const MAX_FILTER_PRICE = 40000;
const SELECTED_COLLEGE_STORAGE_KEY = "campuskart-selected-college";
const LISTING_ORDER_SEED_STORAGE_KEY = "campuskart-listing-order-seed";
const COLLEGE_REQUEST_COOLDOWN_KEY = "campuskart-college-request-cooldown";
const REQUEST_COOLDOWN_MS = 60 * 1000;
const PARTNER_ADMIN_EMAIL = "campuskartpartner@gmail.com";

let homeViewStateCache: StoredHomeState | null = null;

function hashListingOrder(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function getPersistentListingOrderSeed() {
  if (typeof window === "undefined") {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  const existingSeed = sessionStorage.getItem(LISTING_ORDER_SEED_STORAGE_KEY);
  const navigationEntry = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
  const isReload = navigationEntry?.type === "reload";

  if (existingSeed && !isReload) {
    return existingSeed;
  }

  const nextSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  sessionStorage.setItem(LISTING_ORDER_SEED_STORAGE_KEY, nextSeed);
  return nextSeed;
}

const Index = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { collegeParam } = useParams<{ collegeParam?: string }>();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedCondition, setSelectedCondition] = useState<Condition | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([MIN_FILTER_PRICE, MAX_FILTER_PRICE]);
  const [collegeQuery, setCollegeQuery] = useState("");
  const [collegeResults, setCollegeResults] = useState<string[]>([]);
  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);
  const [listings, setListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestCollegeName, setRequestCollegeName] = useState("");
  const [requestState, setRequestState] = useState("");
  const [requestCity, setRequestCity] = useState("");
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [searchingCollege, setSearchingCollege] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number>(
    typeof window !== "undefined" ? window.visualViewport?.height || window.innerHeight : 800
  );
  const [requestCooldownUntil, setRequestCooldownUntil] = useState<number>(0);
  const [deletingListingId, setDeletingListingId] = useState<string | null>(null);
  const [visibleImageCount, setVisibleImageCount] = useState(INITIAL_VISIBLE_IMAGE_BATCH);
  const [isDesktopHero, setIsDesktopHero] = useState(
    typeof window !== "undefined" ? window.matchMedia("(min-width: 640px)").matches : false
  );
  const [refreshOrderSeed] = useState(() => getPersistentListingOrderSeed());
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const collegeWrapperRef = useRef<HTMLDivElement>(null);
  const collegeInputRef = useRef<HTMLInputElement>(null);
  const listingsLoadMoreRef = useRef<HTMLDivElement>(null);
  const listingsCacheRef = useRef<Map<string, ListingRow[]>>(new Map());
  const listingFetchPromiseRef = useRef<Map<string, Promise<ListingRow[]>>>(new Map());
  const skipNextCollegeFetchRef = useRef(false);
  const didRestoreInitialCollegeRef = useRef(false);
  const isPartnerModerator = user?.email?.trim().toLowerCase() === PARTNER_ADMIN_EMAIL;
  const canDeleteFromHome = isAdmin && !isPartnerModerator;

  const restoreCollegeView = useCallback((collegeName: string, allowCache = true) => {
    const canonicalCollege = canonicalInstitutionName(collegeName);
    const canRestoreCachedState =
      allowCache &&
      homeViewStateCache?.selectedCollege &&
      normalizeInstitutionKey(homeViewStateCache.selectedCollege) === normalizeInstitutionKey(canonicalCollege);

    if (canRestoreCachedState) {
      const restoredListings = Array.isArray(homeViewStateCache.listings) ? homeViewStateCache.listings : [];

      skipNextCollegeFetchRef.current = restoredListings.length > 0;
      setSelectedCollege(canonicalCollege);
      setCollegeQuery(homeViewStateCache.collegeQuery || canonicalCollege);
      setSearch(homeViewStateCache.search || "");
      setSelectedCategory(homeViewStateCache.selectedCategory || null);
      setSelectedCondition(homeViewStateCache.selectedCondition || null);
      setPriceRange(homeViewStateCache.priceRange || [MIN_FILTER_PRICE, MAX_FILTER_PRICE]);
      setVisibleImageCount(
        Math.max(INITIAL_VISIBLE_IMAGE_BATCH, homeViewStateCache.visibleImageCount || INITIAL_VISIBLE_IMAGE_BATCH)
      );
      setListings(restoredListings);
      listingsCacheRef.current.set(canonicalCollege, restoredListings);
      return;
    }

    setSelectedCollege(canonicalCollege);
    setCollegeQuery(canonicalCollege);
  }, []);

  const fetchListingImages = useCallback(async (listingIds: string[]) => {
    if (listingIds.length === 0) return;

    const { data, error } = await supabase
      .from("listings")
      .select("id, images")
      .in("id", listingIds);

    if (error || !data) return;

    const imageMap = new Map(data.map((row) => [row.id, row.images || []]));

    listingsCacheRef.current.forEach((cachedListings, cacheKey) => {
      let changed = false;
      const nextCachedListings = cachedListings.map((listing) => {
        if (!imageMap.has(listing.id)) return listing;
        changed = true;
        return { ...listing, images: imageMap.get(listing.id) };
      });

      if (changed) {
        listingsCacheRef.current.set(cacheKey, nextCachedListings);
      }
    });

    setListings((prev) => {
      return prev.map((listing) =>
        imageMap.has(listing.id) ? { ...listing, images: imageMap.get(listing.id) } : listing
      );
    });
  }, []);

  const fetchCollegeListingsData = useCallback(async (collegeName: string) => {
    const canonicalCollege = canonicalInstitutionName(collegeName);
    const cached = listingsCacheRef.current.get(canonicalCollege);
    if (cached) return cached;

    const existingPromise = listingFetchPromiseRef.current.get(canonicalCollege);
    if (existingPromise) return existingPromise;

    const fetchPromise = (async () => {
      let data: any[] | null = null;
      let error: any = null;

      const primaryResponse = await supabase
        .from("listings")
        .select("id, title, description, price, category, condition, seller_id, college, sold, likes, created_at, moderation_status, report_count, resource_link, ai_verification_status, images")
        .eq("college", canonicalCollege)
        .order("created_at", { ascending: false });

      data = primaryResponse.data;
      error = primaryResponse.error;

      if (error) {
        const fallbackResponse = await supabase
          .from("listings")
          .select("id, title, description, price, category, condition, seller_id, college, sold, likes, created_at, images")
          .eq("college", canonicalCollege)
          .order("created_at", { ascending: false });
        data = fallbackResponse.data;
        error = fallbackResponse.error;
      }

      if (error || !data) {
        return [];
      }

      const nextListings: ListingRow[] = data
        .filter(
          (listing) =>
            !listing.sold &&
            !["pending_review", "rejected"].includes(listing.moderation_status || "active")
        )
        .map((listing) => ({
        ...listing,
        images: listing.images || [],
        college: canonicalInstitutionName(listing.college),
        seller_name: "",
        seller_phone: "",
        moderation_status: listing.moderation_status ?? "active",
      }));

      listingsCacheRef.current.set(canonicalCollege, nextListings);
      return nextListings;
    })();

    listingFetchPromiseRef.current.set(canonicalCollege, fetchPromise);

    try {
      return await fetchPromise;
    } finally {
      listingFetchPromiseRef.current.delete(canonicalCollege);
    }
  }, []);

  const runCollegeSearch = useCallback(async (query: string) => {
    const cleanedQuery = query.trim();
    if (cleanedQuery.length < 2) {
      setCollegeResults([]);
      return;
    }

    setSearchingCollege(true);
    const matches = await searchInstitutionNames(cleanedQuery, 12);
    setCollegeResults(matches);
    setSearchingCollege(false);
  }, []);

  useEffect(() => {
    if (didRestoreInitialCollegeRef.current) return;
    didRestoreInitialCollegeRef.current = true;

    const requestedCollege = collegeParam ? decodeURIComponent(collegeParam) : null;
    if (requestedCollege) {
      restoreCollegeView(requestedCollege);
    } else {
      const savedCollege = localStorage.getItem(SELECTED_COLLEGE_STORAGE_KEY);
      if (savedCollege) {
        restoreCollegeView(savedCollege, false);
        navigate(`/college/${encodeURIComponent(canonicalInstitutionName(savedCollege))}`, { replace: true });
      }
    }

    const savedCooldown = Number(localStorage.getItem(COLLEGE_REQUEST_COOLDOWN_KEY) || 0);
    if (savedCooldown > Date.now()) {
      setRequestCooldownUntil(savedCooldown);
    }
  }, [collegeParam, navigate, restoreCollegeView]);

  useEffect(() => {
    const warmInstitutions = () => {
      void loadInstitutionNames();
    };

    let timeoutId: number | undefined;
    let idleId: number | undefined;

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => warmInstitutions(), { timeout: 1200 });
    } else {
      timeoutId = window.setTimeout(warmInstitutions, 600);
    }

    return () => {
      if (typeof idleId === "number" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (typeof timeoutId === "number") {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      localStorage.setItem(SELECTED_COLLEGE_STORAGE_KEY, selectedCollege);
    } else {
      localStorage.removeItem(SELECTED_COLLEGE_STORAGE_KEY);
      homeViewStateCache = null;
    }
  }, [selectedCollege]);

  useEffect(() => {
    homeViewStateCache = {
      selectedCollege,
      collegeQuery,
      search,
      selectedCategory,
      selectedCondition,
      priceRange,
      visibleImageCount,
      listings,
    };
  }, [
    collegeQuery,
    listings,
    priceRange,
    search,
    selectedCategory,
    selectedCollege,
    selectedCondition,
    visibleImageCount,
  ]);

  const resetCollegeSelection = useCallback(() => {
    setSelectedCollege(null);
    setCollegeQuery("");
    setCollegeResults([]);
    setSearch("");
    setSelectedCategory(null);
    setSelectedCondition(null);
    setPriceRange([MIN_FILTER_PRICE, MAX_FILTER_PRICE]);
  }, []);

  useEffect(() => {
    const requestedCollege = collegeParam ? decodeURIComponent(collegeParam) : null;
    const canonicalRequestedCollege = requestedCollege ? canonicalInstitutionName(requestedCollege) : null;

    if (canonicalRequestedCollege) {
      if (normalizeInstitutionKey(canonicalRequestedCollege) !== normalizeInstitutionKey(selectedCollege || "")) {
        restoreCollegeView(canonicalRequestedCollege);
      }
      return;
    }

    if (selectedCollege) {
      resetCollegeSelection();
    }
  }, [collegeParam, resetCollegeSelection, restoreCollegeView, selectedCollege]);

  useEffect(() => {
    if (!selectedCollege) return;

    let cancelled = false;

    const validateSelectedCollege = async () => {
      const institutionNames = await loadInstitutionNames();
      if (cancelled) return;

      const selectedKey = normalizeInstitutionKey(selectedCollege);
      const stillAvailable = institutionNames.some(
        (college) => normalizeInstitutionKey(college) === selectedKey
      );

      if (!stillAvailable) {
        resetCollegeSelection();
        toast.info("This college is no longer available, so we returned you to the homepage.");
      }
    };

    void validateSelectedCollege();

    const handleCollegeListUpdated = () => {
      void validateSelectedCollege();
    };

    window.addEventListener("campuskart-colleges-updated", handleCollegeListUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener("campuskart-colleges-updated", handleCollegeListUpdated);
    };
  }, [resetCollegeSelection, selectedCollege]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 640px)");
    const sync = () => setIsDesktopHero(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      setViewportHeight(viewport.height);
    };

    handleResize();
    viewport.addEventListener("resize", handleResize);
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (collegeWrapperRef.current && !collegeWrapperRef.current.contains(e.target as Node)) {
        setCollegeDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!selectedCollege) {
      setListings([]);
      setLoading(false);
      setVisibleImageCount(INITIAL_VISIBLE_IMAGE_BATCH);
      return;
    }

    if (skipNextCollegeFetchRef.current) {
      skipNextCollegeFetchRef.current = false;
      setLoading(false);
      return;
    }

    const fetchCollegeListings = async () => {
      setLoading(true);
      setSearch("");
      setSelectedCategory(null);
      setSelectedCondition(null);
      setPriceRange([MIN_FILTER_PRICE, MAX_FILTER_PRICE]);
      setVisibleImageCount(INITIAL_VISIBLE_IMAGE_BATCH);

      const nextListings = await fetchCollegeListingsData(selectedCollege);
      setListings(nextListings);
      setLoading(false);
    };

    void fetchCollegeListings();
  }, [fetchCollegeListingsData, selectedCollege]);

  useEffect(() => {
    if (collegeResults.length === 0) return;

    const collegesToWarm = collegeResults.slice(0, 4);
    collegesToWarm.forEach((college) => {
      void fetchCollegeListingsData(college).then((warmedListings) => {
        const warmedImageIds = warmedListings
          .slice(0, INITIAL_VISIBLE_IMAGE_BATCH)
          .filter((listing) => !listing.images || listing.images.length === 0)
          .map((listing) => listing.id);

        if (warmedImageIds.length > 0) {
          void fetchListingImages(warmedImageIds);
        }
      });
    });
  }, [collegeResults, fetchCollegeListingsData, fetchListingImages]);

  const filteredListings = useMemo(() => {
    let items = listings;

    if (selectedCategory) {
      items = items.filter((listing) => listing.category === selectedCategory);
    }

    if (selectedCondition) {
      items = items.filter((listing) => listing.condition === selectedCondition);
    }

    if (priceRange[0] > MIN_FILTER_PRICE || priceRange[1] < MAX_FILTER_PRICE) {
      items = items.filter((listing) => listing.price >= priceRange[0] && listing.price <= priceRange[1]);
    }

    if (search) {
      const query = search.toLowerCase();
      items = items.filter(
        (listing) =>
          listing.title.toLowerCase().includes(query) ||
          listing.description.toLowerCase().includes(query) ||
          listing.category.toLowerCase().includes(query)
      );
    }

    return [...items].sort((a, b) => {
      const aScore = hashListingOrder(`${refreshOrderSeed}-${a.id}-${a.created_at}`);
      const bScore = hashListingOrder(`${refreshOrderSeed}-${b.id}-${b.created_at}`);
      if (aScore !== bScore) return bScore - aScore;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [listings, priceRange, refreshOrderSeed, search, selectedCategory, selectedCondition]);

  const adaptedListings = filteredListings.map((listing) => ({
    id: listing.id,
    title: listing.title,
    description: listing.description,
    price: listing.price,
    category: listing.category as Category,
    condition: listing.condition as any,
    images: listing.images || [],
    sellerId: listing.seller_id,
    sellerName: listing.seller_name || "Unknown",
    sellerPhone: listing.seller_phone || "",
    college: listing.college,
    createdAt: listing.created_at,
    sold: listing.sold,
    likes: listing.likes,
  }));
  const visibleListings = adaptedListings.slice(0, visibleImageCount);

  useEffect(() => {
    const missingVisibleImages = filteredListings
      .slice(0, visibleImageCount)
      .filter((listing) => !listing.images || listing.images.length === 0)
      .map((listing) => listing.id);

    if (missingVisibleImages.length > 0) {
      void fetchListingImages(missingVisibleImages);
    }
  }, [fetchListingImages, filteredListings, visibleImageCount]);

  useEffect(() => {
    setVisibleImageCount(INITIAL_VISIBLE_IMAGE_BATCH);
  }, [selectedCollege, search, selectedCategory, selectedCondition, priceRange]);

  useEffect(() => {
    const sentinel = listingsLoadMoreRef.current;
    if (!sentinel || filteredListings.length <= visibleImageCount) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];
        if (!firstEntry?.isIntersecting) return;

        setVisibleImageCount((current) =>
          Math.min(filteredListings.length, current + VISIBLE_IMAGE_BATCH_STEP)
        );
      },
      {
        rootMargin: "320px 0px",
        threshold: 0.01,
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredListings.length, visibleImageCount]);

  const handleCollegeSelect = (college: string) => {
    const canonicalCollege = canonicalInstitutionName(college);
    setSelectedCollege(canonicalCollege);
    setCollegeQuery(canonicalCollege);
    setCollegeDropdownOpen(false);
    setCollegeResults([]);
    setSearch("");
    setSelectedCategory(null);
    setSelectedCondition(null);
    setPriceRange([MIN_FILTER_PRICE, MAX_FILTER_PRICE]);
    navigate(`/college/${encodeURIComponent(canonicalCollege)}`);
  };

  const handleChangeCollege = () => {
    localStorage.removeItem(SELECTED_COLLEGE_STORAGE_KEY);
    homeViewStateCache = null;
    resetCollegeSelection();
    navigate("/", { replace: true });
  };

  const handleCollegeInputFocus = () => {
    setTimeout(() => {
      collegeWrapperRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 180);

    void loadInstitutionNames();

    if (collegeQuery.trim().length >= 2) {
      setCollegeDropdownOpen(true);
      void runCollegeSearch(collegeQuery);
    }
  };

  const handleCollegeInputSubmit = async () => {
    const trimmedQuery = collegeQuery.trim();
    if (trimmedQuery.length < 2) return;

    const liveResults =
      collegeResults.length > 0 ? collegeResults : await searchInstitutionNames(trimmedQuery, 12);

    const exactMatch = liveResults.find(
      (college) => canonicalInstitutionName(college).toLowerCase() === canonicalInstitutionName(trimmedQuery).toLowerCase()
    );

    const bestMatch = exactMatch ?? liveResults[0];
    if (bestMatch) {
      handleCollegeSelect(bestMatch);
    } else {
      setCollegeDropdownOpen(true);
      setCollegeResults([]);
    }
  };

  const handleCollegeSearchButtonClick = async () => {
    collegeInputRef.current?.focus();
    setCollegeDropdownOpen(true);

    if (collegeQuery.trim().length >= 2) {
      await handleCollegeInputSubmit();
    }
  };

  const resetCollegeRequestForm = () => {
    setRequestCollegeName("");
    setRequestState("");
    setRequestCity("");
  };

  const handleCollegeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requestCooldownUntil > Date.now()) {
      toast.error("Please wait a moment before sending another request.");
      return;
    }
    if (!requestCollegeName.trim() || !requestState.trim() || !requestCity.trim()) {
      toast.error("Please fill in college name, state, and city.");
      return;
    }

    setSubmittingRequest(true);
    try {
      const safeCollegeName = sanitizeSingleLineInput(requestCollegeName);
      const safeState = sanitizeSingleLineInput(requestState);
      const safeCity = sanitizeSingleLineInput(requestCity);
      const { error } = await supabase.from("college_requests").insert({
        college_name: safeCollegeName,
        state: safeState,
        city: safeCity,
        requester_name: sanitizeSingleLineInput(user?.name || ""),
        requester_email: sanitizeSingleLineInput(user?.email || "").toLowerCase(),
      });

      if (error) throw error;

      const cooldownUntil = Date.now() + REQUEST_COOLDOWN_MS;
      localStorage.setItem(COLLEGE_REQUEST_COOLDOWN_KEY, String(cooldownUntil));
      setRequestCooldownUntil(cooldownUntil);
      toast.success("Your request has been submitted. The college will be added within 24 hours if valid.");
      setRequestModalOpen(false);
      resetCollegeRequestForm();
    } catch (error: any) {
      toast.error(error.message || "Could not send college request right now.");
    } finally {
      setSubmittingRequest(false);
    }
  };

  const handleAdminDeleteListing = async (listingId: string) => {
    if (!canDeleteFromHome) return;

    const confirmed = window.confirm("Delete this listing from the marketplace?");
    if (!confirmed) return;

    setDeletingListingId(listingId);
    try {
      const targetListing = listings.find((listing) => listing.id === listingId);
      const { error } = await supabase.from("listings").delete().eq("id", listingId);
      if (error) throw error;

      void deleteListingImages(targetListing?.images);
      setListings((prev) => prev.filter((listing) => listing.id !== listingId));
      listingsCacheRef.current.forEach((cachedListings, cacheKey) => {
        listingsCacheRef.current.set(
          cacheKey,
          cachedListings.filter((listing) => listing.id !== listingId)
        );
      });
      toast.success("Listing deleted successfully.");
    } catch (error: any) {
      trackHandledError("home.admin-delete-listing", error, { listingId });
      toast.error(error.message || "Could not delete this listing right now.");
    } finally {
      setDeletingListingId(null);
    }
  };

  const showRequestCollegeButton =
      !selectedCollege && collegeQuery.trim().length >= 2 && !searchingCollege && collegeResults.length === 0;
  const showCollegeDropdown = collegeDropdownOpen && (collegeResults.length > 0 || searchingCollege);
  const collegeDropdownMaxHeight = Math.max(180, Math.min(320, viewportHeight - 260));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container mx-auto px-4 py-0">
        {!selectedCollege ? (
          <div className="animate-fade-in">
            <div className="relative -mx-4 overflow-hidden px-0 py-4 sm:mx-0">
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0">
                <LqipImage
                  src={`${import.meta.env.BASE_URL}${isDesktopHero ? "campus-hero-desktop.jpg" : "campus-hero-mobile.jpg"}`}
                  placeholderSrc={isDesktopHero ? heroDesktopPlaceholder : heroMobilePlaceholder}
                  alt=""
                  className="h-full w-full"
                  imgClassName="h-full w-full object-cover object-top opacity-100"
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="100vw"
                />
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 dark:hidden bg-[linear-gradient(180deg,rgba(240,253,255,0.08),rgba(255,255,255,0.05)_30%,rgba(255,255,255,0.26)_58%,rgba(255,255,255,0.66)_76%,rgba(255,255,255,0.9)_88%,rgb(255,255,255)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 hidden dark:block bg-[linear-gradient(180deg,rgba(2,6,23,0.02),rgba(2,6,23,0.06)_30%,rgba(2,6,23,0.24)_58%,rgba(2,6,23,0.58)_76%,rgba(2,6,23,0.84)_88%,rgb(2,6,23)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 dark:hidden bg-[linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(255,255,255,0.34)_24%,rgba(255,255,255,0.78)_56%,rgba(255,255,255,0.95)_82%,rgb(255,255,255)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-32 dark:block bg-[linear-gradient(180deg,rgba(2,6,23,0)_0%,rgba(2,6,23,0.26)_24%,rgba(2,6,23,0.66)_56%,rgba(2,6,23,0.9)_82%,rgb(2,6,23)_100%)]" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center">
                <div className="h-20 w-[118%] rounded-t-[46px] bg-white/78 blur-[10px] dark:bg-slate-950/88 sm:h-24 sm:w-[108%] sm:rounded-t-[54px]" />
              </div>
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 dark:hidden bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.16),transparent_34%),radial-gradient(circle_at_top_right,rgba(255,255,255,0.14),transparent_28%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 hidden dark:block bg-[radial-gradient(circle_at_top_left,rgba(15,23,42,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(30,41,59,0.2),transparent_28%)]" />
              <div className="pointer-events-none absolute inset-x-0 top-0 bottom-0 opacity-55">
                <div className="absolute -left-10 bottom-10 h-28 w-28 rounded-full bg-primary/10 blur-2xl" />
                <div className="absolute -right-8 top-8 h-28 w-28 rounded-full bg-sky-400/10 blur-2xl" />
              </div>

              <div className={`relative ${showCollegeDropdown ? "min-h-[540px] sm:min-h-[620px]" : "min-h-[380px] sm:min-h-[500px]"}`}>
                  <Card className="relative z-20 mx-auto mt-[62px] max-w-[332px] border-white/90 bg-white shadow-[0_22px_50px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-slate-950/90 dark:shadow-[0_22px_50px_rgba(2,6,23,0.5)] sm:mt-[108px] sm:max-w-[430px]">
                    <CardContent className="space-y-4 px-4 py-5 text-center sm:px-5 sm:py-6">
                      <div className="inline-flex w-full max-w-[292px] items-center justify-center gap-3 rounded-[16px] border border-primary/12 bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(59,130,246,0.10))] px-4 py-2.5 text-left shadow-[0_10px_24px_rgba(20,184,166,0.08)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(20,184,166,0.16),rgba(30,41,59,0.9),rgba(59,130,246,0.2))] dark:shadow-[0_10px_24px_rgba(2,6,23,0.28)] sm:max-w-[346px] sm:justify-center sm:gap-4 sm:px-5">
                        <img
                          src={`${import.meta.env.BASE_URL}college-banner-icon.jpeg`}
                          alt="College icon"
                          loading="eager"
                          decoding="async"
                          fetchPriority="high"
                          className="ml-2 h-9 w-9 shrink-0 rounded-[10px] object-cover sm:ml-0 sm:h-10 sm:w-10"
                        />
                        <p className="flex-1 text-center text-[12px] leading-4 text-foreground/68 dark:text-slate-300/78 sm:flex-none sm:text-center sm:text-[13px] sm:leading-[1.1rem]">
                          <span className="block text-[15px] font-bold uppercase tracking-[0.08em] text-foreground dark:text-slate-50 sm:text-[16px]">SELECT YOUR COLLEGE</span>
                          <span className="mt-0.5 block text-[11.5px] tracking-[0.01em] sm:text-[12.5px]">To See Listings From Your Campus</span>
                        </p>
                      </div>
                      <div ref={collegeWrapperRef} className="mx-auto text-left" style={{ scrollMarginTop: "6rem" }}>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          ref={collegeInputRef}
                          value={collegeQuery}
                          placeholder="Search your college..."
                          className="h-11 rounded-full border-border/60 bg-white pl-10 pr-14 text-sm shadow-[0_8px_20px_rgba(20,184,166,0.10)] transition-shadow focus-visible:ring-2 focus-visible:ring-primary/45 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:shadow-[0_8px_20px_rgba(2,6,23,0.34)] dark:placeholder:text-slate-400"
                          onChange={(e) => {
                            const value = e.target.value;
                            setCollegeQuery(value);
                            setCollegeDropdownOpen(true);
                            clearTimeout(debounceRef.current);
                            debounceRef.current = setTimeout(() => runCollegeSearch(value), 80);
                          }}
                          onFocus={handleCollegeInputFocus}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              void handleCollegeInputSubmit();
                            }
                          }}
                          autoComplete="off"
                        />
                        {collegeQuery ? (
                          <button
                            onClick={() => {
                              setCollegeQuery("");
                            setCollegeResults([]);
                          }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-primary/10 p-1.5"
                          >
                            <X className="h-3.5 w-3.5 text-primary hover:text-primary" />
                          </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void handleCollegeSearchButtonClick()}
                              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full border border-primary/20 bg-primary/10 p-1.5"
                              aria-label="Search college"
                            >
                            <Search className="h-3.5 w-3.5 text-primary" />
                          </button>
                        )}
                      </div>

                      {showCollegeDropdown && (
                        <div className="relative z-30 mt-2 overflow-hidden rounded-2xl border border-border/80 bg-popover shadow-xl dark:border-white/10 dark:bg-slate-950">
                          <div className="overflow-auto py-1" style={{ maxHeight: `${collegeDropdownMaxHeight}px` }}>
                            {searchingCollege ? (
                              <div className="px-4 py-3 text-sm text-muted-foreground">Searching colleges...</div>
                            ) : (
                              collegeResults.map((college) => (
                                <button
                                  key={college}
                                  type="button"
                                  className="block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-accent"
                                  onClick={() => handleCollegeSelect(college)}
                                >
                                  {college}
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}

                      {showRequestCollegeButton && (
                        <div className="mt-2 text-center">
                          <Button
                            variant="ghost"
                            className="h-auto rounded-full px-4 py-2 text-xs font-medium text-primary hover:bg-primary/5 hover:text-primary"
                            disabled={requestCooldownUntil > Date.now()}
                            onClick={() => {
                              setRequestCollegeName(collegeQuery.trim());
                              setRequestModalOpen(true);
                            }}
                          >
                            Can't find it? Request your college
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>

            <div className="-mt-6 mx-auto max-w-5xl space-y-6 px-1 pb-8 sm:-mt-4">
              <div className="relative rounded-[18px] border border-primary/10 bg-[linear-gradient(135deg,rgba(240,253,250,0.9),rgba(255,255,255,0.96),rgba(239,246,255,0.92))] p-5 pt-7 shadow-[0_18px_40px_rgba(20,184,166,0.08)] dark:border-white/10 dark:bg-[linear-gradient(135deg,rgba(15,23,42,0.95),rgba(2,6,23,0.98),rgba(15,23,42,0.94))] dark:shadow-[0_18px_40px_rgba(2,6,23,0.45)]">
                <div className="absolute left-5 top-0 -translate-y-1/2 rounded-[10px] bg-[linear-gradient(135deg,rgba(20,184,166,1),rgba(59,130,246,0.95))] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(20,184,166,0.22)]">
                  Campus Marketplace
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                  <div className="max-w-2xl">
                    <h2 className="mt-1 font-display text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                      A trusted way to buy and sell within your own college
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-[15px]">
                      CampusKart keeps listings focused on real student needs like electronics, gadgets, tools, notes, books, and project gear, with direct contact between buyer and seller.
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/85 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    Pick your college to unlock local listings
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-primary/10 bg-background/80 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">College-only listings</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">Focused on your own campus instead of a random public marketplace.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/10 bg-background/80 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                        <MessageCircle className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Direct seller contact</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">Reach sellers quickly on WhatsApp without middlemen or extra steps.</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-primary/10 bg-background/80 p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
                        <Wallet className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">Better student prices</p>
                        <p className="mt-1 text-xs leading-5 text-muted-foreground">Useful college items move faster when students price them fairly.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">How it works</p>
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        step: "01",
                        title: "Select your college",
                        body: "Start with your campus so every listing stays relevant to your college community.",
                      },
                      {
                        step: "02",
                        title: "Browse local items",
                        body: "Explore notes, components, gadgets, books, tools, and project gear from students around you.",
                      },
                      {
                        step: "03",
                        title: "Contact the seller directly",
                        body: "Use WhatsApp to ask, negotiate, and arrange pickup quickly.",
                      },
                    ].map((item) => (
                      <div key={item.step} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                          {item.step}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.title}</p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Why students use it</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {[
                      "Faster same-campus deals",
                      "No shipping confusion",
                      "Useful for projects and coursework",
                      "Cleaner than public marketplaces",
                    ].map((point) => (
                      <div key={point} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3">
                        <div className="rounded-full bg-primary/10 p-1.5 text-primary">
                          <ChevronRight className="h-3.5 w-3.5" />
                        </div>
                        <p className="text-sm font-medium text-foreground">{point}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-2xl border border-primary/10 bg-[linear-gradient(135deg,rgba(20,184,166,0.08),rgba(59,130,246,0.08))] px-4 py-4">
                    <p className="text-sm font-semibold text-foreground">Built for practical student buying and selling</p>
                    <p className="mt-2 text-xs leading-6 text-muted-foreground">
                      Instead of searching through unrelated public listings, students can open their campus marketplace and find what actually matters faster.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="animate-fade-in space-y-5 pt-4">
            <div className="rounded-3xl border border-primary/10 bg-[linear-gradient(135deg,rgba(20,184,166,0.10),rgba(59,130,246,0.08))] p-4 shadow-[0_18px_50px_rgba(20,184,166,0.10)]">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Viewing</p>
                  <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
                    <MapPin className="h-4 w-4 text-primary" />
                    Viewing: {selectedCollege}
                  </div>
                </div>
                <Button variant="outline" className="rounded-full" onClick={handleChangeCollege}>
                  Change College
                </Button>
              </div>
            </div>

            <CollegeListingsFilterBar
              search={search}
              onSearchChange={setSearch}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedCondition={selectedCondition}
              onConditionChange={setSelectedCondition}
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
              minPrice={MIN_FILTER_PRICE}
              maxPrice={MAX_FILTER_PRICE}
            />

            {loading ? (
              <div className="py-16 text-center">
                <div className="mx-auto max-w-md space-y-3">
                  <div className="mx-auto h-4 w-40 animate-pulse rounded-full bg-muted/80" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="h-40 animate-pulse rounded-2xl bg-muted/70" />
                    <div className="h-40 animate-pulse rounded-2xl bg-muted/70" />
                  </div>
                </div>
              </div>
            ) : filteredListings.length === 0 ? (
              <div className="animate-fade-in rounded-3xl border border-primary/10 bg-[linear-gradient(180deg,rgba(240,253,250,0.85),rgba(255,255,255,1))] px-5 py-14 text-center shadow-[0_18px_40px_rgba(20,184,166,0.08)]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Store className="h-7 w-7" />
                </div>
                <p className="text-2xl font-semibold text-foreground">No items listed yet</p>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Be the first to sell something in your college and help others!
                </p>
                <Button className="mt-6 gradient-bg border-0 text-primary-foreground hover:opacity-90" onClick={() => navigate("/sell")}>
                  Sell First Item
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{filteredListings.length}</span> item{filteredListings.length !== 1 ? "s" : ""} from this college
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
                  {visibleListings.map((listing, index) => (
                    <div key={listing.id} className="animate-fade-in" style={{ animationDelay: `${index * 35}ms` }}>
                      <ProductCard
                        listing={listing}
                        showAdminDelete={canDeleteFromHome}
                        onAdminDelete={handleAdminDeleteListing}
                        deleting={deletingListingId === listing.id}
                        prioritizeImage={index < 4}
                      />
                    </div>
                  ))}
                </div>
                {filteredListings.length > visibleListings.length && (
                  <div ref={listingsLoadMoreRef} className="h-10 w-full" aria-hidden="true" />
                )}
              </>
            )}
          </div>
        )}
      </section>

      <Dialog
        open={requestModalOpen}
        onOpenChange={(open) => {
          setRequestModalOpen(open);
          if (!open && !submittingRequest) {
            resetCollegeRequestForm();
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request to add your college</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCollegeRequest} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">College Name</label>
              <Input
                value={requestCollegeName}
                onChange={(e) => setRequestCollegeName(e.target.value)}
                placeholder="Enter your college name"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">State</label>
              <Input
                value={requestState}
                onChange={(e) => setRequestState(e.target.value)}
                placeholder="Enter state"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">City</label>
              <Input
                value={requestCity}
                onChange={(e) => setRequestCity(e.target.value)}
                placeholder="City as shown on Google Maps"
              />
            </div>
            <Button
              type="submit"
              disabled={submittingRequest || requestCooldownUntil > Date.now()}
              className="w-full gradient-bg border-0 text-primary-foreground hover:opacity-90"
            >
              {submittingRequest ? "Sending..." : "Submit Request"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="-mt-14 sm:-mt-12">
        <SiteFooter hideTopBorder />
      </div>
    </div>
  );
};

export default Index;
