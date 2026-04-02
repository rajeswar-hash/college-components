import { Listing } from "@/lib/types";
import { Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { getLikedIds, toggleListingLike } from "@/lib/likes";
import { toast } from "sonner";

interface ProductCardProps {
  listing: Listing;
}

const CATEGORY_COLORS: Record<string, string> = {
  Arduino: "bg-primary/10 text-primary",
  Sensors: "bg-success/10 text-success",
  Motors: "bg-warning/10 text-warning",
  Tools: "bg-destructive/10 text-destructive",
  Displays: "bg-accent text-accent-foreground",
  Communication: "bg-primary/10 text-primary",
  Power: "bg-warning/10 text-warning",
  Misc: "bg-muted text-muted-foreground",
};

export function ProductCard({ listing }: ProductCardProps) {
  const [liked, setLiked] = useState(() => getLikedIds().includes(listing.id));
  const [likeCount, setLikeCount] = useState(listing.likes);
  const [liking, setLiking] = useState(false);
  const hasImage = listing.images && listing.images.length > 0 && listing.images[0];

  useEffect(() => {
    setLikeCount(listing.likes);
    setLiked(getLikedIds().includes(listing.id));
  }, [listing.id, listing.likes]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (liking) return;

    setLiking(true);
    try {
      const result = await toggleListingLike(listing.id, likeCount);
      setLiked(result.liked);
      setLikeCount(result.likes);
    } catch {
      toast.error("Could not update like right now");
    } finally {
      setLiking(false);
    }
  };

  return (
    <Link to={`/product/${listing.id}`} className="group block">
      <div className="glass rounded-xl overflow-hidden transition-all duration-300 hover:shadow-elevated hover:-translate-y-1">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {hasImage ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 rounded-xl gradient-bg opacity-20" />
              <span className="absolute text-muted-foreground text-sm font-medium">
                {listing.category}
              </span>
            </div>
          )}
          {listing.sold && (
            <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
              <span className="font-display font-bold text-2xl text-background rotate-[-12deg]">
                SOLD
              </span>
            </div>
          )}
          <button
            onClick={handleLike}
            disabled={liking}
            className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center transition-transform hover:scale-110"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${liked ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
            />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <span className="font-display font-bold text-lg gradient-text whitespace-nowrap">
              ₹{listing.price}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={CATEGORY_COLORS[listing.category] || ""}>
              {listing.category}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {listing.condition}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {listing.college}
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" /> {likeCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
