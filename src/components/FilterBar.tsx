import { CATEGORIES, Category, COLLEGES } from "@/lib/types";
import { Search, X, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FilterBarProps {
  search: string;
  onSearchChange: (s: string) => void;
  selectedCategory: Category | null;
  onCategoryChange: (c: Category | null) => void;
  selectedCollege: string | null;
  onCollegeChange: (c: string | null) => void;
}

export function FilterBar({ search, onSearchChange, selectedCategory, onCategoryChange, selectedCollege, onCollegeChange }: FilterBarProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
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

        <div className="w-full sm:w-56">
          <Select
            value={selectedCollege ?? "all"}
            onValueChange={(v) => onCollegeChange(v === "all" ? null : v)}
          >
            <SelectTrigger className="glass border-border">
              <MapPin className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="All Colleges" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Colleges</SelectItem>
              {COLLEGES.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
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
