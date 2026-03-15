import { useState, useMemo, useRef, useEffect } from "react";
import { COLLEGES } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check } from "lucide-react";

interface CollegeAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
}

export function CollegeAutocomplete({ value, onChange }: CollegeAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!query) return COLLEGES;
    const q = query.toLowerCase();
    return COLLEGES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <Label htmlFor="college">College</Label>
      <Input
        id="college"
        value={query}
        placeholder="Start typing your college name..."
        autoComplete="off"
        onChange={(e) => {
          setQuery(e.target.value);
          onChange("");
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-48 overflow-auto rounded-lg border border-border bg-popover shadow-lg">
          {filtered.map((c) => (
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
      {open && query && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-popover shadow-lg p-3 text-sm text-muted-foreground">
          No matching college found
        </div>
      )}
    </div>
  );
}
