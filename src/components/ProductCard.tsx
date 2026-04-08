import { Listing, normalizeCategory, normalizeCondition } from "@/lib/types";
import { MapPin, ShoppingCart, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { hasUserLikedListing, toggleListingLike } from "@/lib/likes";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { getListingCoverImage } from "@/lib/listingImage";

interface ProductCardProps {
  listing: Listing;
  showAdminDelete?: boolean;
  onAdminDelete?: (listingId: string) => void;
  deleting?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Handwriting Service": "bg-cyan-500/10 text-cyan-700",
  Notes: "bg-amber-500/10 text-amber-700",
  Components: "bg-primary/10 text-primary",
  Gadgets: "bg-sky-500/10 text-sky-600",
  Books: "bg-emerald-500/10 text-emerald-700",
  Tools: "bg-destructive/10 text-destructive",
  Projects: "bg-violet-500/10 text-violet-600",
  Others: "bg-muted text-muted-foreground",
};

export function ProductCard({ listing, showAdminDelete = false, onAdminDelete, deleting = false }: ProductCardProps) {
  const { isAuthenticated, supabaseUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(listing.likes);
  const [liking, setLiking] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const displayCategory = normalizeCategory(listing.category);
  const displayCondition = normalizeCondition(listing.condition);
  const displayPrice = displayCategory === "Handwriting Service" ? `₹${listing.price}/page` : `₹${listing.price}`;
  const previewImage = getListingCoverImage(listing.category, listing.images);
  const hasImage = Boolean(previewImage);

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
      toast.success(result.liked ? "Item added to cart" : "Item removed from cart");
    } catch {
      toast.error("Could not update cart right now");
    } finally {
      setLiking(false);
    }
  };

  const handleAdminDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!onAdminDelete || deleting) return;
    onAdminDelete(listing.id);
  };

  return (
    <>
    <Link to={`/product/${listing.id}`} className="group block h-full">
      <div className="glass flex h-[114px] overflow-hidden rounded-xl border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated sm:h-full sm:min-h-[116px] sm:block">
        <div className="relative w-[104px] shrink-0 overflow-hidden bg-muted sm:w-full sm:aspect-[4/3]">
          {hasImage ? (
            <img
              src={previewImage}
              alt={listing.title}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 639px) 104px, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="h-full min-h-[96px] w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:min-h-0"
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
            className={`absolute flex h-8 w-8 items-center justify-center rounded-full glass transition-transform hover:scale-110 sm:h-9 sm:w-9 ${showAdminDelete ? "top-2 right-12 sm:top-3 sm:right-14" : "top-2 right-2 sm:top-3 sm:right-3"}`}
          >
            <ShoppingCart
              className={`w-4 h-4 transition-colors ${liked ? "fill-primary text-primary" : "text-muted-foreground"}`}
            />
          </button>
          {showAdminDelete && (
            <button
              onClick={handleAdminDelete}
              disabled={deleting}
              aria-label="Delete listing as admin"
              className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-destructive/90 text-destructive-foreground shadow-sm transition-transform hover:scale-110 disabled:opacity-60 sm:top-3 sm:right-3 sm:h-9 sm:w-9"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col p-3 sm:min-h-[132px] sm:justify-start sm:space-y-2 sm:p-4">
          <div className="flex min-h-[66px] flex-col sm:min-h-0 sm:space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">
                {listing.title}
              </h3>
              <div className="flex shrink-0 items-center gap-2 sm:hidden">
                <Badge variant="outline" className="text-[10px]">
                  {displayCondition}
                </Badge>
              </div>
              <span className="hidden font-display font-bold text-base gradient-text whitespace-nowrap sm:inline sm:text-lg">
                {displayPrice}
              </span>
            </div>

            <p className="mt-1 font-display text-lg font-bold leading-none gradient-text sm:hidden">
              {displayPrice}
            </p>
            <div className="h-4 sm:hidden" />
          </div>

          <div className="hidden items-center gap-2 flex-wrap sm:flex">
            <Badge variant="secondary" className={CATEGORY_COLORS[displayCategory] || ""}>
              {displayCategory}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {displayCondition}
            </Badge>
          </div>

          <div className="flex items-center justify-between gap-3 pt-0 text-[11px] text-muted-foreground sm:mt-0 sm:pt-1 sm:text-xs">
            <span className="flex min-w-0 items-center gap-1">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{listing.college}</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
    <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

