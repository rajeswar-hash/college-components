import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { CATEGORIES, Category } from "@/lib/types";
import { getListings } from "@/lib/store";
import { Search, X, SlidersHorizontal, MapPin, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface FilterBarProps {
  search: string;
  onSearchChange: (s: string) => void;
  selectedCategory: Category | null;
  onCategoryChange: (c: Category | null) => void;
  selectedCollege: string | null;
  onCollegeChange: (c: string | null) => void;
}

interface CollegeEntry {
  "College Name": string;
}
interface UniversityEntry {
  "University Name": string;
}

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

export function FilterBar({ search, onSearchChange, selectedCategory, onCategoryChange, selectedCollege, onCollegeChange }: FilterBarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [collegeQuery, setCollegeQuery] = useState(selectedCollege ?? "");
  const [collegeResults, setCollegeResults] = useState<string[]>([]);
  const [collegeDropdownOpen, setCollegeDropdownOpen] = useState(false);
  const [dataReady, setDataReady] = useState(!!cachedColleges);
  const collegeWrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    loadAllColleges().then(() => setDataReady(true));
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

  const searchColleges = useCallback((q: string) => {
    if (!cachedColleges || q.length < 2) { setCollegeResults([]); return; }
    const lower = q.toLowerCase();
    setCollegeResults(cachedColleges.filter(c => c.toLowerCase().includes(lower)).slice(0, 30));
  }, []);

  const activeFilterCount = (selectedCategory ? 1 : 0) + (selectedCollege ? 1 : 0);

  const collegesWithListings = useMemo(() => {
    const listings = getListings();
    return [...new Set(listings.map(l => l.college))].sort();
  }, []);

  return (
    <div className="space-y-3">
      {/* Search + Filter Toggle */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search components..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 glass border-border"
          />
          {search && (
            <button onClick={() => onSearchChange("")} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <Button
          variant={filtersOpen ? "default" : "outline"}
          onClick={() => setFiltersOpen(!filtersOpen)}
          className={`shrink-0 gap-2 ${filtersOpen ? "gradient-bg text-primary-foreground border-0" : ""}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Active filter chips */}
      {!filtersOpen && activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              {selectedCategory}
              <button onClick={() => onCategoryChange(null)}><X className="w-3 h-3" /></button>
            </Badge>
          )}
          {selectedCollege && (
            <Badge variant="secondary" className="gap-1 px-3 py-1">
              <MapPin className="w-3 h-3" />
              {selectedCollege.length > 25 ? selectedCollege.slice(0, 25) + "…" : selectedCollege}
              <button onClick={() => { onCollegeChange(null); setCollegeQuery(""); }}><X className="w-3 h-3" /></button>
            </Badge>
          )}
        </div>
      )}

      {/* Expandable Filter Panel */}
      {filtersOpen && (
        <div className="glass border border-border rounded-xl p-4 space-y-4 animate-fade-in">
          {/* Category Filter */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Category</p>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => onCategoryChange(null)}
                className={`text-xs ${selectedCategory === null ? "gradient-bg text-primary-foreground border-0" : ""}`}
              >
                All
              </Button>
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => onCategoryChange(cat)}
                  className={`text-xs ${selectedCategory === cat ? "gradient-bg text-primary-foreground border-0" : ""}`}
                >
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* College Filter */}
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">College / University</p>
            <div ref={collegeWrapperRef} className="relative">
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={dataReady ? "Search 40,000+ colleges..." : "Loading colleges..."}
                  value={collegeQuery}
                  autoComplete="off"
                  onChange={(e) => {
                    const val = e.target.value;
                    setCollegeQuery(val);
                    setCollegeDropdownOpen(true);
                    clearTimeout(debounceRef.current);
                    debounceRef.current = setTimeout(() => searchColleges(val), 150);
                    if (!val) { onCollegeChange(null); }
                  }}
                  onFocus={() => {
                    if (collegeQuery.length >= 2) {
                      setCollegeDropdownOpen(true);
                      searchColleges(collegeQuery);
                    }
                  }}
                  className="pl-10 pr-8 border-border"
                />
                {collegeQuery && (
                  <button
                    onClick={() => { setCollegeQuery(""); onCollegeChange(null); setCollegeResults([]); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
              {collegeDropdownOpen && collegeResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-border bg-popover shadow-lg">
                  {collegeResults.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
                      onClick={() => {
                        onCollegeChange(c);
                        setCollegeQuery(c);
                        setCollegeDropdownOpen(false);
                      }}
                    >
                      <span className={selectedCollege === c ? "font-medium text-primary" : ""}>{c}</span>
                    </button>
                  ))}
                </div>
              )}
              {collegeDropdownOpen && collegeQuery.length >= 2 && collegeResults.length === 0 && (
                <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg p-3 text-sm text-muted-foreground">
                  No match — type will be used as-is
                </div>
              )}
            </div>

            {/* Quick college picks from listings */}
            {!selectedCollege && collegesWithListings.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {collegesWithListings.slice(0, 6).map((c) => (
                  <button
                    key={c}
                    onClick={() => { onCollegeChange(c); setCollegeQuery(c); }}
                    className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Clear All */}
          {activeFilterCount > 0 && (
            <button
              onClick={() => { onCategoryChange(null); onCollegeChange(null); setCollegeQuery(""); }}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
