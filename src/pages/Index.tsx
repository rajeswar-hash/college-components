import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { FilterBar } from "@/components/FilterBar";
import { ProductCard } from "@/components/ProductCard";
import { Cpu, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { canonicalInstitutionName, normalizeInstitutionKey } from "@/lib/institutions";

interface ListingRow {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  seller_id: string;
  college: string;
  sold: boolean;
  likes: number;
  created_at: string;
  seller_name?: string;
  seller_phone?: string;
}

const LISTINGS_CACHE_KEY = "campuskart-home-cache-v1";

const Index = () => {
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [allListings, setAllListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    try {
      const rawCache = localStorage.getItem(LISTINGS_CACHE_KEY);
      if (!rawCache) return;

      const parsed = JSON.parse(rawCache) as { listings?: ListingRow[] };
      if (parsed.listings && Array.isArray(parsed.listings)) {
        setAllListings(parsed.listings);
        setLoading(false);
      }
    } catch {
      localStorage.removeItem(LISTINGS_CACHE_KEY);
    }
  }, []);

  const fetchListings = useCallback(async () => {
    const hasCachedListings = allListings.length > 0;
    if (!hasCachedListings) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    const { data: listingsData, error: listingsError } = await supabase
      .from("listings")
      .select("id, title, description, price, category, condition, images, seller_id, college, sold, likes, created_at")
      .order("created_at", { ascending: false });

    if (listingsError || !listingsData) {
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const nextListings = listingsData.map((listing) => {
        return {
          ...listing,
          college: canonicalInstitutionName(listing.college),
          seller_name: "",
          seller_phone: "",
        };
      });

    setAllListings(nextListings);
    localStorage.setItem(LISTINGS_CACHE_KEY, JSON.stringify({ listings: nextListings, updatedAt: Date.now() }));
    setLoading(false);
    setRefreshing(false);
  }, [allListings.length]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings, location.key]);

  const maxPrice = useMemo(() => Math.max(...allListings.map((l) => l.price), 50000), [allListings]);

  const hasActiveFilters =
    !!search || !!selectedCategory || !!selectedCollege || priceRange[0] > 0 || priceRange[1] < maxPrice;

  const listings = useMemo(() => {
    let items = allListings;
    if (selectedCategory) items = items.filter((l) => l.category === selectedCategory);
    if (selectedCollege) {
      const selectedCollegeKey = normalizeInstitutionKey(selectedCollege);
      items = items.filter((l) => normalizeInstitutionKey(l.college) === selectedCollegeKey);
    }
    if (priceRange[0] > 0 || priceRange[1] < maxPrice) {
      items = items.filter((l) => l.price >= priceRange[0] && l.price <= priceRange[1]);
    }
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }
    return [...items].sort((a, b) => {
      if (b.likes !== a.likes) return b.likes - a.likes;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [search, selectedCategory, selectedCollege, priceRange, allListings, maxPrice]);

  const adaptedListings = listings.map((l) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category as Category,
    condition: l.condition as any,
    images: l.images || [],
    sellerId: l.seller_id,
    sellerName: l.seller_name || "Unknown",
    sellerPhone: l.seller_phone || "",
    college: l.college,
    createdAt: l.created_at,
    sold: l.sold,
    likes: l.likes,
  }));

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {!hasActiveFilters && (
        <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
          <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="mx-auto max-w-xl text-center">
              <p className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary shadow-sm">
                <Sparkles className="h-3.5 w-3.5" /> Student Marketplace
              </p>
              <h1 className="mb-2 font-display text-2xl font-extrabold leading-tight text-foreground md:text-3xl lg:text-4xl">
                Buy & Sell <span className="gradient-text">Components</span> Across College
              </h1>
              <p className="mx-auto mb-5 max-w-lg text-sm text-muted-foreground">
                A cleaner, faster marketplace for engineering students to trade Arduino boards, sensors, tools, and project gear with confidence.
              </p>
              <div className="mb-5 rounded-2xl border border-primary/20 bg-[linear-gradient(135deg,rgba(20,184,166,0.12),rgba(59,130,246,0.12))] px-4 py-3 text-sm font-semibold text-foreground shadow-[0_12px_30px_rgba(20,184,166,0.10)]">
                <span className="gradient-text">Filter by your college</span> for faster campus deals.
              </div>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-primary" /> 100+ Parts
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Verified
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" /> WhatsApp
                </span>
              </div>
            </div>
          </div>
          <div className="absolute left-5 top-5 h-24 w-24 rounded-full gradient-bg opacity-5 blur-3xl" />
          <div className="absolute bottom-5 right-5 h-32 w-32 rounded-full gradient-accent-bg opacity-5 blur-3xl" />
        </section>
      )}

      <section id="listings" className="container mx-auto px-4 py-6">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedCollege={selectedCollege}
          onCollegeChange={setSelectedCollege}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
          maxPrice={maxPrice}
        />

        {hasActiveFilters && (
          <div className="mb-2 mt-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{listings.length}</span> result{listings.length !== 1 ? "s" : ""} found
            </p>
          </div>
        )}

        {refreshing && !loading && (
          <div className="mb-2 mt-4 text-center">
            <p className="text-xs text-muted-foreground">Refreshing latest listings...</p>
          </div>
        )}

        {loading ? (
          <div className="py-16 text-center">
            <div className="mx-auto max-w-md space-y-3">
              <div className="h-4 w-40 mx-auto rounded-full bg-muted/80 animate-pulse" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-40 rounded-2xl bg-muted/70 animate-pulse" />
                <div className="h-40 rounded-2xl bg-muted/70 animate-pulse" />
              </div>
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">No components found.</p>
            <p className="mt-1 text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-3 xl:grid-cols-4">
            {adaptedListings.map((listing, i) => (
              <div key={listing.id} className="animate-fade-in" style={{ animationDelay: `${i * 40}ms` }}>
                <ProductCard listing={listing} />
              </div>
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
};

export default Index;
