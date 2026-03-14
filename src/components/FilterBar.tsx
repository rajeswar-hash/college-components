import { CATEGORIES, Category } from "@/lib/types";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FilterBarProps {
  search: string;
  onSearchChange: (s: string) => void;
  selectedCategory: Category | null;
  onCategoryChange: (c: Category | null) => void;
}

export function FilterBar({ search, onSearchChange, selectedCategory, onCategoryChange }: FilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="relative">
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

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => onCategoryChange(null)}
          className={selectedCategory === null ? "gradient-bg text-primary-foreground border-0" : ""}
        >
          All
        </Button>
        {CATEGORIES.map((cat) => (
          <Button
            key={cat}
            size="sm"
            variant={selectedCategory === cat ? "default" : "outline"}
            onClick={() => onCategoryChange(cat)}
            className={selectedCategory === cat ? "gradient-bg text-primary-foreground border-0" : ""}
          >
            {cat}
          </Button>
        ))}
      </div>
    </div>
  );
}
