import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Category, CATEGORIES } from "@/lib/types";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface CollegeListingsFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  selectedCategory: Category | null;
  onCategoryChange: (value: Category | null) => void;
  priceRange: [number, number];
  onPriceRangeChange: (value: [number, number]) => void;
  minPrice: number;
  maxPrice: number;
}

export function CollegeListingsFilterBar({
  search,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  priceRange,
  onPriceRangeChange,
  minPrice,
  maxPrice,
}: CollegeListingsFilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount =
    (selectedCategory ? 1 : 0) +
    (priceRange[0] > minPrice || priceRange[1] < maxPrice ? 1 : 0);

  const clearAll = () => {
    onCategoryChange(null);
    onPriceRangeChange([minPrice, maxPrice]);
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="glass h-10 border-border pl-10 text-sm"
          />
          {search && (
            <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        <Button
          variant={filtersOpen ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltersOpen((value) => !value)}
          className={`h-10 shrink-0 gap-1.5 ${filtersOpen ? "gradient-bg border-0 text-primary-foreground" : ""}`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          <span className="hidden text-xs sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full p-0 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {!filtersOpen && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
              {selectedCategory}
              <button onClick={() => onCategoryChange(null)}>
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
          {(priceRange[0] > minPrice || priceRange[1] < maxPrice) && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
              ₹{priceRange[0]} – ₹{priceRange[1]}
              <button onClick={() => onPriceRangeChange([minPrice, maxPrice])}>
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
          <button onClick={clearAll} className="ml-1 text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground">
            Clear all
          </button>
        </div>
      )}

      {filtersOpen && (
        <div className="glass animate-fade-in space-y-3 rounded-lg border border-border p-3">
          <div>
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Category</p>
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => onCategoryChange(null)}
                className={`h-7 px-2.5 text-xs ${selectedCategory === null ? "gradient-bg border-0 text-primary-foreground" : ""}`}
              >
                All
              </Button>
              {CATEGORIES.map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => onCategoryChange(category)}
                  className={`h-7 px-2.5 text-xs ${selectedCategory === category ? "gradient-bg border-0 text-primary-foreground" : ""}`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Price Range</p>
              <span className="text-xs text-muted-foreground">₹{priceRange[0]} – ₹{priceRange[1]}</span>
            </div>
            <div className="px-1">
              <Slider
                min={minPrice}
                max={maxPrice}
                step={5}
                value={priceRange}
                onValueChange={(value) => onPriceRangeChange(value as [number, number])}
                className="w-full"
              />
            </div>
          </div>

          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-[10px] text-muted-foreground underline underline-offset-2 hover:text-foreground">
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
