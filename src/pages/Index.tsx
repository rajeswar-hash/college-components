import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { CollegeListingsFilterBar } from "@/components/CollegeListingsFilterBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Sparkles, Store, X } from "lucide-react";
import { canonicalInstitutionName, loadInstitutionNames, searchInstitutionNames } from "@/lib/institutions";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ListingRow {
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

const INITIAL_VISIBLE_IMAGE_BATCH = 8;
const MAX_FILTER_PRICE = 10000;
const SELECTED_COLLEGE_STORAGE_KEY = "campuskart-selected-college";
const COLLEGE_REQUEST_COOLDOWN_KEY = "campuskart-college-request-cooldown";
const REQUEST_COOLDOWN_MS = 60 * 1000;

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_FILTER_PRICE]);
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
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const collegeWrapperRef = useRef<HTMLDivElement>(null);
  const collegeInputRef = useRef<HTMLInputElement>(null);

  const fetchListingImages = useCallback(async (listingIds: string[]) => {
    if (listingIds.length === 0) return;

    const { data, error } = await supabase
      .from("listings")
      .select("id, images")
      .in("id", listingIds);

    if (error || !data) return;

    setListings((prev) => {
      const imageMap = new Map(data.map((row) => [row.id, row.images || []]));
      return prev.map((listing) =>
        imageMap.has(listing.id) ? { ...listing, images: imageMap.get(listing.id) } : listing
      );
    });
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
    const savedCollege = localStorage.getItem(SELECTED_COLLEGE_STORAGE_KEY);
    if (savedCollege) {
      setSelectedCollege(savedCollege);
      setCollegeQuery(savedCollege);
    }

    const savedCooldown = Number(localStorage.getItem(COLLEGE_REQUEST_COOLDOWN_KEY) || 0);
    if (savedCooldown > Date.now()) {
      setRequestCooldownUntil(savedCooldown);
    }
  }, []);

  useEffect(() => {
    const idleLoader = window.setTimeout(() => {
      void loadInstitutionNames();
    }, 200);

    return () => window.clearTimeout(idleLoader);
  }, []);

  useEffect(() => {
    if (selectedCollege) {
      localStorage.setItem(SELECTED_COLLEGE_STORAGE_KEY, selectedCollege);
    } else {
      localStorage.removeItem(SELECTED_COLLEGE_STORAGE_KEY);
    }
  }, [selectedCollege]);

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
      return;
    }

    const fetchCollegeListings = async () => {
      setLoading(true);
      setSearch("");
      setSelectedCategory(null);
      setPriceRange([0, MAX_FILTER_PRICE]);

      const canonicalCollege = canonicalInstitutionName(selectedCollege);
      const { data, error } = await supabase
        .from("listings")
        .select("id, title, description, price, category, condition, seller_id, college, sold, likes, created_at")
        .eq("college", canonicalCollege)
        .order("created_at", { ascending: false });

      if (error || !data) {
        setListings([]);
        setLoading(false);
        return;
      }

      const nextListings = data.map((listing) => ({
        ...listing,
        images: [],
        college: canonicalInstitutionName(listing.college),
        seller_name: "",
        seller_phone: "",
      }));

      setListings(nextListings);
      setLoading(false);
      void fetchListingImages(nextListings.slice(0, INITIAL_VISIBLE_IMAGE_BATCH).map((listing) => listing.id));
    };

    fetchCollegeListings();
  }, [fetchListingImages, selectedCollege]);

  useEffect(() => {
    const missingVisibleImages = listings
      .slice(0, INITIAL_VISIBLE_IMAGE_BATCH)
      .filter((listing) => !listing.images || listing.images.length === 0)
      .map((listing) => listing.id);

    if (missingVisibleImages.length > 0) {
      void fetchListingImages(missingVisibleImages);
    }
  }, [fetchListingImages, listings]);

  const filteredListings = useMemo(() => {
    let items = listings;

    if (selectedCategory) {
      items = items.filter((listing) => listing.category === selectedCategory);
    }

    if (priceRange[0] > 0 || priceRange[1] < MAX_FILTER_PRICE) {
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
      if (b.likes !== a.likes) return b.likes - a.likes;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [listings, priceRange, search, selectedCategory]);

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

  const handleCollegeSelect = (college: string) => {
    const canonicalCollege = canonicalInstitutionName(college);
    setSelectedCollege(canonicalCollege);
    setCollegeQuery(canonicalCollege);
    setCollegeDropdownOpen(false);
    setCollegeResults([]);
    setSearch("");
    setSelectedCategory(null);
    setPriceRange([0, MAX_FILTER_PRICE]);
  };

  const handleChangeCollege = () => {
    setSelectedCollege(null);
    setCollegeQuery("");
    setCollegeResults([]);
    setSearch("");
    setSelectedCategory(null);
    setPriceRange([0, MAX_FILTER_PRICE]);
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
      const { error } = await supabase.from("college_requests").insert({
        college_name: requestCollegeName.trim(),
        state: requestState.trim(),
        city: requestCity.trim(),
        requester_name: user?.name || "",
        requester_email: user?.email || "",
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

  const showRequestCollegeButton =
    !selectedCollege && collegeQuery.trim().length >= 2 && !searchingCollege && collegeResults.length === 0;
  const collegeDropdownMaxHeight = Math.max(180, Math.min(320, viewportHeight - 260));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <section className="container mx-auto px-4 py-8 md:py-10">
        {!selectedCollege ? (
          <div className="animate-fade-in">
            <Card className="mx-auto mt-2 max-w-xl border-primary/10 bg-[linear-gradient(180deg,rgba(240,253,250,0.94),rgba(255,255,255,1))] shadow-[0_18px_40px_rgba(20,184,166,0.08)]">
              <CardContent className="space-y-3 px-4 py-5 text-center sm:px-5 sm:py-6">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/80">Select your college</p>
                  <h1 className="font-display text-[1.9rem] font-bold leading-tight text-foreground">Buy &amp; Sell Within Your Campus</h1>
                </div>

                <div ref={collegeWrapperRef} className="mx-auto max-w-xl text-left" style={{ scrollMarginTop: "6rem" }}>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={collegeInputRef}
                      value={collegeQuery}
                      placeholder="Search your college..."
                      className="h-12 rounded-2xl border-border/80 bg-background pl-10 pr-10 text-sm shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition-shadow focus-visible:ring-2 focus-visible:ring-primary/50"
                      onChange={(e) => {
                        const value = e.target.value;
                        setCollegeQuery(value);
                        setCollegeDropdownOpen(true);
                        clearTimeout(debounceRef.current);
                        debounceRef.current = setTimeout(() => runCollegeSearch(value), 80);
                      }}
                      onFocus={handleCollegeInputFocus}
                      autoComplete="off"
                    />
                    {collegeQuery && (
                      <button
                        onClick={() => {
                          setCollegeQuery("");
                          setCollegeResults([]);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      </button>
                    )}
                  </div>

                  {collegeDropdownOpen && (collegeResults.length > 0 || searchingCollege) && (
                    <div className="mt-2 overflow-hidden rounded-2xl border border-border bg-popover shadow-lg">
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
        ) : (
          <div className="animate-fade-in space-y-5">
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
              priceRange={priceRange}
              onPriceRangeChange={setPriceRange}
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

                <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                  {adaptedListings.map((listing, index) => (
                    <div key={listing.id} className="animate-fade-in" style={{ animationDelay: `${index * 35}ms` }}>
                      <ProductCard listing={listing} />
                    </div>
                  ))}
                </div>
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

      <SiteFooter />
    </div>
  );
};

export default Index;
