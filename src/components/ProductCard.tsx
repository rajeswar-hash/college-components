import { Listing, normalizeCategory, normalizeCondition } from "@/lib/types";
import { Heart, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { hasUserLikedListing, toggleListingLike } from "@/lib/likes";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";

interface ProductCardProps {
  listing: Listing;
}

const CATEGORY_COLORS: Record<string, string> = {
  Components: "bg-primary/10 text-primary",
  Gadgets: "bg-sky-500/10 text-sky-600",
  Notes: "bg-amber-500/10 text-amber-700",
  Tools: "bg-destructive/10 text-destructive",
  Projects: "bg-violet-500/10 text-violet-600",
  Others: "bg-muted text-muted-foreground",
};

export function ProductCard({ listing }: ProductCardProps) {
  const { isAuthenticated, supabaseUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(listing.likes);
  const [liking, setLiking] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const hasImage = listing.images && listing.images.length > 0 && listing.images[0];
  const displayCategory = normalizeCategory(listing.category);
  const displayCondition = normalizeCondition(listing.condition);

  useEffect(() => {
    setLikeCount(listing.likes);
  }, [listing.likes]);

  useEffect(() => {
    let cancelled = false;

    if (!supabaseUser) {
      setLiked(false);
      return;
    }

    hasUserLikedListing(listing.id, supabaseUser.id)
      .then((value) => {
        if (!cancelled) {
          setLiked(value);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLiked(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [listing.id, supabaseUser]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    if (liking) return;

    setLiking(true);
    try {
      const result = await toggleListingLike(listing.id, likeCount, liked);
      setLiked(result.liked);
      setLikeCount(result.likes);
    } catch {
      toast.error("Could not update like right now");
    } finally {
      setLiking(false);
    }
  };

  return (
    <>
    <Link to={`/product/${listing.id}`} className="group block h-full">
      <div className="glass h-full overflow-hidden rounded-xl border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated">
        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
          {hasImage ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-xl gradient-bg opacity-20" />
              <span className="absolute text-muted-foreground text-sm font-medium">
                {displayCategory}
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
            aria-label={liked ? "Unlike listing" : "Like listing"}
            className="absolute top-3 right-3 w-9 h-9 rounded-full glass flex items-center justify-center transition-transform hover:scale-110"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${liked ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
            />
          </button>
        </div>

        <div className="flex h-full flex-col p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">
              {listing.title}
            </h3>
            <span className="font-display font-bold text-lg gradient-text whitespace-nowrap">
              ₹{listing.price}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={CATEGORY_COLORS[displayCategory] || ""}>
              {displayCategory}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {displayCondition}
            </Badge>
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-1 text-xs text-muted-foreground">
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{listing.college}</span>
            </span>
            <span className="flex items-center gap-1">
              <Heart className="w-3 h-3" /> {likeCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
    <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
