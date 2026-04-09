import { Listing, categoryUsesCondition, normalizeCategory, normalizeCondition } from "@/lib/types";
import { Share2, ShoppingCart, Trash2 } from "lucide-react";
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
  prioritizeImage?: boolean;
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

export function ProductCard({
  listing,
  showAdminDelete = false,
  onAdminDelete,
  deleting = false,
  prioritizeImage = false,
}: ProductCardProps) {
  const { isAuthenticated, supabaseUser } = useAuth();
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(listing.likes);
  const [liking, setLiking] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const displayCategory = normalizeCategory(listing.category);
  const displayCondition = normalizeCondition(listing.condition);
  const shouldShowCondition = categoryUsesCondition(listing.category) && Boolean(listing.condition);
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

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = `${window.location.origin}${window.location.pathname}#/product/${listing.id}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: listing.title,
          text: `Check out this listing on CampusKart: ${listing.title}`,
          url: shareUrl,
        });
      } catch {
        // Ignore share cancellation.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Listing link copied");
    } catch {
      toast.error("Could not copy listing link");
    }
  };

  return (
    <>
    <Link to={`/product/${listing.id}`} className="group block h-full">
      <div className="glass flex min-h-[132px] overflow-hidden rounded-xl border border-border/60 transition-all duration-300 hover:-translate-y-1 hover:shadow-elevated sm:h-full sm:min-h-[116px] sm:block">
        <div className="relative w-[96px] shrink-0 overflow-hidden bg-muted sm:w-full sm:aspect-[4/3]">
          {hasImage ? (
            <img
              src={previewImage}
              alt={listing.title}
              loading={prioritizeImage ? "eager" : "lazy"}
              decoding="async"
              fetchPriority={prioritizeImage ? "high" : "auto"}
              sizes="(max-width: 639px) 96px, (max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="h-full min-h-[132px] w-full object-cover transition-transform duration-300 group-hover:scale-105 sm:min-h-0"
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
          <div className="flex min-h-[52px] flex-col sm:min-h-0 sm:space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-display font-semibold text-sm leading-tight line-clamp-2 text-card-foreground group-hover:text-primary transition-colors">
                {listing.title}
              </h3>
              <div className="flex shrink-0 items-center gap-2 sm:hidden">
                {shouldShowCondition && (
                  <Badge variant="outline" className="text-[10px]">
                    {displayCondition}
                  </Badge>
                )}
              </div>
              <span className="hidden font-display font-bold text-base gradient-text whitespace-nowrap sm:inline sm:text-lg">
                {displayPrice}
              </span>
            </div>

            <p className="mt-1 font-display text-lg font-bold leading-none gradient-text sm:hidden">
              {displayPrice}
            </p>
            <div className="h-2 sm:hidden" />
          </div>

          <div className="hidden items-center gap-2 flex-wrap sm:flex">
            <Badge variant="secondary" className={CATEGORY_COLORS[displayCategory] || ""}>
              {displayCategory}
            </Badge>
            {shouldShowCondition && (
              <Badge variant="outline" className="text-xs">
                {displayCondition}
              </Badge>
            )}
          </div>

          <div className="mt-auto flex items-center gap-2 pt-2 sm:pt-2">
            <button
              onClick={handleShare}
              type="button"
              className="inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 text-[10px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:h-9 sm:px-3 sm:text-xs"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
            <button
              onClick={handleLike}
              disabled={liking}
              type="button"
              aria-label={liked ? "Remove from cart" : "Add to cart"}
              className={`inline-flex h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full px-2.5 text-[10px] font-medium transition-colors sm:h-9 sm:px-3 sm:text-xs ${
                liked
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "border border-border/70 bg-background/80 text-muted-foreground hover:border-primary/40 hover:text-primary"
              }`}
            >
              <ShoppingCart className={`h-3.5 w-3.5 ${liked ? "fill-primary-foreground" : ""}`} />
              <span>{liked ? "In Cart" : "Add to Cart"}</span>
            </button>
          </div>
        </div>
      </div>
    </Link>
    <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}

