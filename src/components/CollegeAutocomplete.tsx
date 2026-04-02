import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";
import { loadInstitutionNames, searchInstitutionNames } from "@/lib/institutions";

interface CollegeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function CollegeAutocomplete({ value, onChange }: CollegeAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Preload data on mount
  useEffect(() => {
    loadInstitutionNames().then(() => setDataReady(true));
  }, []);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  const searchColleges = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const matches = await searchInstitutionNames(q);
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
