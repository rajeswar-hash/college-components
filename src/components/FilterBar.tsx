import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { CATEGORIES, COLLEGES, Category } from "@/lib/types";
import { getListings } from "@/lib/store";
import { Search, X, SlidersHorizontal, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

interface FilterBarProps {
  search: string;
  onSearchChange: (s: string) => void;
  selectedCategory: Category | null;
  onCategoryChange: (c: Category | null) => void;
  selectedCollege: string | null;
  onCollegeChange: (c: string | null) => void;
  priceRange: [number, number];
  onPriceRangeChange: (r: [number, number]) => void;
  maxPrice: number;
}

interface CollegeEntry { "College Name": string; }
interface UniversityEntry { "University Name": string; }

function cleanName(name: string): string {
  return name.replace(/\s*\(Id:\s*[CU]-\d+\)\s*/g, "").trim();
}

let cachedColleges: string[] | null = null;
let loadingPromise: Promise<string[]> | null = null;

async function loadAllColleges(): Promise<string[]> {
  if (cachedColleges) return cachedColleges;
  if (loadingPromise) return loadingPromise;
  loadingPromise = (async () => {
    try {
      const [cRes, uRes] = await Promise.all([
        fetch("/data/indian_colleges.json"),
        fetch("/data/indian_universities.json"),
      ]);
      const names = new Set<string>();
      for (const c of COLLEGES) names.add(c);
      if (cRes.ok) {
        const colleges: CollegeEntry[] = await cRes.json();
        for (const c of colleges) names.add(cleanName(c["College Name"]));
      }
      if (uRes.ok) {
        const unis: UniversityEntry[] = await uRes.json();
        for (const u of unis) names.add(cleanName(u["University Name"]));
      }
      cachedColleges = [...names].sort();
      return cachedColleges;
    } catch {
      cachedColleges = [];
      return [];
    }
  })();
  return loadingPromise;
}

export function FilterBar({
  search, onSearchChange, selectedCategory, onCategoryChange,
  selectedCollege, onCollegeChange, priceRange, onPriceRangeChange, maxPrice
}: FilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collegeQuery, setCollegeQuery] = useState(selectedCollege ?? "");
  const [collegeResults, setCollegeResults] = useState<string[]>([]);
  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);
  const [dataReady, setDataReady] = useState(!!cachedColleges);
  const collegeWrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { loadAllColleges().then(() => setDataReady(true)); }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (collegeWrapperRef.current && !collegeWrapperRef.current.contains(e.target as Node))
        setCollegeDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const searchColleges = useCallback((q: string) => {
    if (!cachedColleges || q.length < 2) { setCollegeResults([]); return; }
    const words = q.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    setCollegeResults(
      cachedColleges.filter(c => {
        const lower = c.toLowerCase();
        return words.every(w => lower.includes(w));
      }).slice(0, 40)
    );
  }, []);

  const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedCollege ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0);

  const collegesWithListings = useMemo(() => {
    const listings = getListings();
    return [...new Set(listings.map(l => l.college))].sort();
  }, []);

  const clearAll = () => {
    onCategoryChange(null);
    onCollegeChange(null);
    setCollegeQuery("");
    onPriceRangeChange([0, maxPrice]);
  };

  return (
    <div className="space-y-2">
      {/* Search + Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 h-9 text-sm glass border-border"
          />
          {search && (
            <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button
          variant={filtersOpen ? "default" : "outline"}
          size="sm"
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`shrink-0 gap-1.5 h-9 ${filtersOpen ? "gradient-bg text-primary-foreground border-0" : ""}`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Active filter chips */}
      {!filtersOpen && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
              {selectedCategory}
              <button onClick={() => onCategoryChange(null)}><X className="w-2.5 h-2.5" /></button>
            </Badge>
          )}
          {selectedCollege && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
              <MapPin className="w-2.5 h-2.5" />
              {selectedCollege.length > 20 ? selectedCollege.slice(0, 20) + "…" : selectedCollege}
              <button onClick={() => { onCollegeChange(null); setCollegeQuery(""); }}><X className="w-2.5 h-2.5" /></button>
            </Badge>
          )}
          {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
            <Badge variant="secondary" className="gap-1 px-2 py-0.5 text-xs">
              ₹{priceRange[0]} – ₹{priceRange[1]}
              <button onClick={() => onPriceRangeChange([0, maxPrice])}><X className="w-2.5 h-2.5" /></button>
            </Badge>
          )}
          <button onClick={clearAll} className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 ml-1">
            Clear all
          </button>
        </div>
      )}

      {/* Expandable Filter Panel */}
      {filtersOpen && (
        <div className="glass border border-border rounded-lg p-3 space-y-3 animate-fade-in relative z-40">
          {/* Category */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Category</p>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => onCategoryChange(null)}
                className={`text-xs h-7 px-2.5 ${selectedCategory === null ? "gradient-bg text-primary-foreground border-0" : ""}`}>
                All
              </Button>
              {CATEGORIES.map((cat) => (
                <Button key={cat} size="sm" variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => onCategoryChange(cat)}
                  className={`text-xs h-7 px-2.5 ${selectedCategory === cat ? "gradient-bg text-primary-foreground border-0" : ""}`}>
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Price Range</p>
              <span className="text-xs text-muted-foreground">₹{priceRange[0]} – ₹{priceRange[1]}</span>
            </div>
            <div className="px-1">
              <Slider
                min={0}
                max={maxPrice}
                step={50}
                value={priceRange}
                onValueChange={(v) => onPriceRangeChange(v as [number, number])}
                className="w-full"
              />
            </div>
          </div>

          {/* College */}
          <div>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">College / University</p>
            <div ref={collegeWrapperRef} className="relative space-y-2">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder={dataReady ? "Search 40,000+ colleges..." : "Loading..."}
                  value={collegeQuery}
                  autoComplete="off"
                  onChange={(e) => {
                    const val = e.target.value;
                    setCollegeQuery(val);
                    setCollegeDropdownOpen(true);
                    clearTimeout(debounceRef.current);
                    debounceRef.current = setTimeout(() => searchColleges(val), 150);
                    if (!val) onCollegeChange(null);
                  }}
                  onFocus={() => {
                    if (collegeQuery.length >= 2) {
                      setCollegeDropdownOpen(true);
                      searchColleges(collegeQuery);
                    }
                  }}
                  className="pl-9 pr-7 h-8 text-xs border-border"
                />
                {collegeQuery && (
                  <button onClick={() => { setCollegeQuery(""); onCollegeChange(null); setCollegeResults([]); }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              {collegeDropdownOpen && collegeResults.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-border bg-popover shadow-md">
                  <div className="max-h-48 overflow-auto py-1">
                    {collegeResults.map((c) => (
                      <button key={c} type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-accent"
                        onClick={() => { onCollegeChange(c); setCollegeQuery(c); setCollegeDropdownOpen(false); }}>
                        <span className={selectedCollege === c ? "font-medium text-primary" : ""}>{c}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {collegeDropdownOpen && collegeQuery.length >= 2 && collegeResults.length === 0 && (
                <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                  No match — type will be used as-is
                </div>
              )}
            </div>
            {!selectedCollege && collegesWithListings.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {collegesWithListings.slice(0, 6).map((c) => (
                  <button key={c} onClick={() => { onCollegeChange(c); setCollegeQuery(c); }}
                    className="text-[10px] px-2 py-0.5 rounded-full border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground">
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear All */}
          {activeFilterCount > 0 && (
            <button onClick={clearAll}
              className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2">
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
