import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";

interface CollegeEntry {
  "College Name": string;
  "State Name": string;
  "University Name": string;
}

interface UniversityEntry {
  "University Name": string;
  "State Name": string;
}

let cachedColleges: string[] | null = null;
let loadingPromise: Promise<string[]> | null = null;

function cleanName(name: string): string {
  // Remove "(Id: C-XXXXX)" or "(Id: U-XXXXX)" patterns
  return name.replace(/\s*\(Id:\s*[CU]-\d+\)\s*/g, "").trim();
}

async function loadAllColleges(): Promise<string[]> {
  if (cachedColleges) return cachedColleges;
  if (loadingPromise) return loadingPromise;

  loadingPromise = (async () => {
    try {
      const [collegesRes, universitiesRes] = await Promise.all([
        fetch("/data/indian_colleges.json"),
        fetch("/data/indian_universities.json"),
      ]);

      const names = new Set<string>();

      if (collegesRes.ok) {
        const colleges: CollegeEntry[] = await collegesRes.json();
        for (const c of colleges) {
          names.add(cleanName(c["College Name"]));
        }
      }

      if (universitiesRes.ok) {
        const universities: UniversityEntry[] = await universitiesRes.json();
        for (const u of universities) {
          names.add(cleanName(u["University Name"]));
        }
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

interface CollegeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function CollegeAutocomplete({ value, onChange }: CollegeAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(!!cachedColleges);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Preload data on mount
  useEffect(() => {
    loadAllColleges().then(() => setDataReady(true));
  }, []);

  const searchColleges = useCallback((q: string) => {
    if (!cachedColleges || q.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const lower = q.toLowerCase();
    const matches = cachedColleges.filter((c) => c.toLowerCase().includes(lower)).slice(0, 40);
    setResults(matches);
    setLoading(false);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
        if (query.trim() && !value) onChange(query.trim());
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [query, value, onChange]);

  return (
    <div ref={wrapperRef} className="relative">
      <Label htmlFor="college">College / University</Label>
      <Input
        id="college"
        value={query}
        placeholder={dataReady ? "Start typing your college name..." : "Loading colleges..."}
        autoComplete="off"
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          onChange(val);
          setOpen(true);
          clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => searchColleges(val), 150);
        }}
        onFocus={() => {
          if (query.length >= 2) {
            setOpen(true);
            searchColleges(query);
          }
        }}
        onBlur={() => {
          if (query.trim()) onChange(query.trim());
        }}
      />
      {open && (loading || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-border bg-popover shadow-lg">
          {loading && results.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching...
            </div>
          )}
          {results.map((c) => (
            <button
              key={c}
              type="button"
              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent text-left transition-colors"
              onClick={() => {
                onChange(c);
                setQuery(c);
                setOpen(false);
              }}
            >
              {value === c && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
              <span className={value === c ? "font-medium" : ""}>{c}</span>
            </button>
          ))}
        </div>
      )}
      {open && !loading && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg p-3 text-sm text-muted-foreground">
          No match found — your typed name will be used
        </div>
      )}
    </div>
  );
}
