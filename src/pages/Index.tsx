import { useState, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Category } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { FilterBar } from "@/components/FilterBar";
import { ProductCard } from "@/components/ProductCard";
import { Cpu, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
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

const Index = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedCollege, setSelectedCollege] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50000]);
  const [allListings, setAllListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchListings = useCallback(async () => {
    setLoading(true);

    const { data: listingsData, error: listingsError } = await supabase
      .from("listings")
      .select("*")
      .order("created_at", { ascending: false });

    if (listingsError || !listingsData) {
      setAllListings([]);
      setLoading(false);
      return;
    }

    const sellerIds = Array.from(new Set(listingsData.map((listing) => listing.seller_id)));
    let profilesData: { id: string; name: string; phone: string }[] = [];

    if (sellerIds.length > 0) {
      const { data } = await supabase.from("profiles").select("id, name, phone").in("id", sellerIds);

      profilesData = data ?? [];
    }

    const sellers = new Map(
      profilesData.map((profile) => [
        profile.id,
        {
          name: profile.name,
          phone: profile.phone || "",
        },
      ])
    );

    setAllListings(
      listingsData.map((listing) => {
        const seller = sellers.get(listing.seller_id);
        return {
          ...listing,
          college: canonicalInstitutionName(listing.college),
          seller_name: seller?.name || "Unknown",
          seller_phone: seller?.phone || "",
        };
      })
    );
    setLoading(false);
  }, []);

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
              <div className="mb-5 rounded-2xl border border-primary/15 bg-background/75 px-4 py-3 text-sm font-medium text-foreground shadow-sm">
                Filter by your college to buy from your campus community.
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

        {loading ? (
          <div className="py-16 text-center">
            <p className="text-lg text-muted-foreground">Loading listings...</p>
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
