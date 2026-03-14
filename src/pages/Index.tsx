import { useState, useMemo } from "react";
import { getListings } from "@/lib/store";
import { Category } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { FilterBar } from "@/components/FilterBar";
import { ProductCard } from "@/components/ProductCard";
import { Cpu, Zap, Users } from "lucide-react";

const Index = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const listings = useMemo(() => {
    let items = getListings();
    if (selectedCategory) items = items.filter((l) => l.category === selectedCategory);
    if (search) {
      const q = search.toLowerCase();
      items = items.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl mx-auto text-center animate-fade-in">
            <h1 className="font-display font-extrabold text-4xl md:text-5xl lg:text-6xl text-foreground leading-tight mb-4">
              Buy & Sell <span className="gradient-text">Components</span> on Campus
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              The peer-to-peer marketplace for engineering students. Find Arduino boards, sensors, tools — right on your campus.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-primary" /> 100+ Components
              </span>
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Campus Verified
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" /> Instant WhatsApp
              </span>
            </div>
          </div>
        </div>
        <div className="absolute top-10 left-10 w-32 h-32 rounded-full gradient-bg opacity-5 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full gradient-accent-bg opacity-5 blur-3xl" />
      </section>

      {/* Listings */}
      <section className="container mx-auto px-4 py-10">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />

        {listings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">No components found.</p>
            <p className="text-muted-foreground text-sm mt-1">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mt-8">
            {listings.map((listing, i) => (
              <div key={listing.id} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
                <ProductCard listing={listing} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p className="font-display font-semibold text-foreground mb-1">Campus Components</p>
          <p>Built for students, by students. Reduce e-waste, save money.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
