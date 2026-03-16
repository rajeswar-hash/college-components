import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { COLLEGES } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";

interface CollegeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function CollegeAutocomplete({ value, onChange }: CollegeAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [apiResults, setApiResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Local fallback filtering
  const localResults = useMemo(() => {
    if (!query || query.length < 2) return [];
    const q = query.toLowerCase();
    return COLLEGES.filter((c) => c.toLowerCase().includes(q)).slice(0, 20);
  }, [query]);

  // Merge API + local, deduplicated
  const results = useMemo(() => {
    const merged = [...apiResults];
    for (const local of localResults) {
      if (!merged.some((r) => r.toLowerCase() === local.toLowerCase())) {
        merged.push(local);
      }
    }
    return merged.slice(0, 30);
  }, [apiResults, localResults]);

  const fetchColleges = useCallback(async (q: string) => {
    if (q.length < 2) {
      setApiResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `https://universities.hipolabs.com/search?name=${encodeURIComponent(q)}`
      );
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const names = ([...new Set(data.map((d: any) => d.name as string))] as string[]).slice(0, 30);
      setApiResults(names);
    } catch {
      // API failed — local results will still show
      setApiResults([]);
    } finally {
      setLoading(false);
    }
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
      <Label htmlFor="college">College</Label>
      <Input
        id="college"
        value={query}
        placeholder="Start typing your college name..."
        autoComplete="off"
        onChange={(e) => {
          const val = e.target.value;
          setQuery(val);
          onChange(val);
          setOpen(true);
          clearTimeout(debounceRef.current);
          debounceRef.current = setTimeout(() => fetchColleges(val), 300);
        }}
        onFocus={() => {
          if (query.length >= 2) setOpen(true);
        }}
        onBlur={() => {
          if (query.trim()) onChange(query.trim());
        }}
      />
      {open && (loading || results.length > 0) && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-border bg-popover shadow-lg">
          {loading && results.length === 0 && (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Searching colleges...
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
          No suggestions found — your typed name will be used
        </div>
      )}
    </div>
  );
}
