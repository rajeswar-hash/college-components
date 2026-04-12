import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { categoryUsesCondition, normalizeCategory, normalizeCondition } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Share2, MessageCircle, ChevronLeft, ChevronRight, ShieldAlert, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { hasUserLikedListing, toggleListingLike } from "@/lib/likes";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";
import { getListingDetailImages, getListingDetailPlaceholders } from "@/lib/listingImage";
import { trackHandledError } from "@/lib/errorTracking";
import { LqipImage } from "@/components/LqipImage";

function formatPhone(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  const cleaned = digits.replace(/^0+/, "");

  if (cleaned.length < 10) return null;
  if (cleaned.length === 10) return `91${cleaned}`;
  return cleaned;
}

interface ListingDetail {
  ai_verification_status?: string | null;
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  seller_id: string;
  college: string;
  sold: boolean;
  likes: number;
  moderation_status?: string;
  report_count?: number;
  resource_link?: string | null;
  created_at: string;
  seller_name: string;
  seller_phone: string;
}

const ProductDetail = () => {
  const { isAuthenticated, supabaseUser, isAdmin } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [openingWhatsapp, setOpeningWhatsapp] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);
  const [imageAnimationClass, setImageAnimationClass] = useState("gallery-slide-left");

  useEffect(() => {
    if (!id) return;
    const fetchListing = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        if (error) {
          trackHandledError("product-detail.fetch-listing", error, { listingId: id });
        }
        setLoading(false);
        return;
      }

      const { data: contactRows } = await supabase.rpc("get_listing_contact", {
        p_listing_id: data.id,
      });
      const contact = contactRows?.[0];

      setListing({
        ...data,
        images: data.images || [],
        seller_name: contact?.seller_name || "Unknown",
        seller_phone: contact?.seller_phone || "",
      });
      setLoading(false);
    };
    fetchListing();
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    if (!listing || !supabaseUser) {
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
  }, [listing, supabaseUser]);

  useEffect(() => {
    let cancelled = false;

    if (!listing || !supabaseUser) {
      setHasReported(false);
      return;
    }

    const fetchReportState = async () => {
      const { data, error } = await supabase
        .from("listing_reports")
        .select("id")
        .eq("listing_id", listing.id)
        .eq("reporter_id", supabaseUser.id)
        .maybeSingle();

      if (!cancelled) {
        setHasReported(!error && !!data);
      }
    };

    void fetchReportState();

    return () => {
      cancelled = true;
    };
  }, [listing, supabaseUser]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-lg">Listing not found.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const isOwnListing = !!supabaseUser && supabaseUser.id === listing.seller_id;
  const hiddenFromPublic = ["pending_review", "rejected"].includes(listing.moderation_status || "active");
  const soldAndHiddenFromBuyers = listing.sold && !isOwnListing && !isAdmin;

  if (hiddenFromPublic && !isOwnListing && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-lg">This listing is under review and is not public yet.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  if (soldAndHiddenFromBuyers) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-lg">This listing has been marked sold and is no longer public.</p>
          <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const displayImages = getListingDetailImages(listing.category, listing.images);
  const displayPlaceholders = getListingDetailPlaceholders(listing.category, listing.images);
  const hasImages = displayImages.length > 0;
  const displayCategory = normalizeCategory(listing.category);
  const displayCondition = normalizeCondition(listing.condition);
  const shouldShowCondition = categoryUsesCondition(listing.category) && Boolean(listing.condition);
  const displayPrice = displayCategory === "Handwriting Service"
    ? `₹${Number(listing.price).toLocaleString("en-IN")}/page`
    : `₹${Number(listing.price).toLocaleString("en-IN")}`;
  const hasMultipleImages = displayImages.length > 1;
  const safeCurrentImage = currentImage >= displayImages.length ? 0 : currentImage;

  const changeImage = (direction: "left" | "right", nextIndex: number) => {
    setImageAnimationClass(direction === "left" ? "gallery-slide-left" : "gallery-slide-right");
    setCurrentImage(nextIndex);
  };

  const showPreviousImage = () => {
    const nextIndex = safeCurrentImage === 0 ? displayImages.length - 1 : safeCurrentImage - 1;
    changeImage("right", nextIndex);
  };

  const showNextImage = () => {
    const nextIndex = safeCurrentImage === displayImages.length - 1 ? 0 : safeCurrentImage + 1;
    changeImage("left", nextIndex);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!hasMultipleImages || touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40;

    if (distance > minSwipeDistance) {
      showNextImage();
    } else if (distance < -minSwipeDistance) {
      showPreviousImage();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  const handleLike = async () => {
    if (!listing || liking) return;

    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    setLiking(true);
    try {
      const result = await toggleListingLike(listing.id, listing.likes, liked);
      setLiked(result.liked);
      setListing((current) => current ? { ...current, likes: result.likes } : current);
      toast.success(result.liked ? "Item added to cart" : "Item removed from cart");
    } catch {
      toast.error("Could not update cart right now");
    } finally {
      setLiking(false);
    }
  };

  const whatsappPhone = formatPhone(listing.seller_phone);

  const buildWhatsappUrl = (phone: string) => {
    const msg = encodeURIComponent(
      `Hi! I'm interested in your listing on CampusKart:\n\n*${listing.title}*\nPrice: ₹${listing.price}\n\nIs this still available?`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  };

  const handleWhatsappContact = async () => {
    if (isOwnListing) {
      toast.error("This is your own listing.");
      return;
    }

    if (openingWhatsapp) return;

    setOpeningWhatsapp(true);
    try {
      const { data: contactRows, error } = await supabase.rpc("get_listing_contact", {
        p_listing_id: listing.id,
      });

      if (error) {
        throw error;
      }

      const contact = contactRows?.[0];
      const latestPhone = formatPhone(contact?.seller_phone || "");

      if (!latestPhone) {
        toast.error("This seller has not added a valid WhatsApp number yet.");
        return;
      }

      if (contact?.seller_phone && contact.seller_phone !== listing.seller_phone) {
        setListing((current) =>
          current
            ? {
                ...current,
                seller_phone: contact.seller_phone,
                seller_name: contact.seller_name || current.seller_name,
              }
            : current
        );
      }

      window.open(buildWhatsappUrl(latestPhone), "_blank", "noopener,noreferrer");
    } catch {
      trackHandledError("product-detail.contact-seller", new Error("Could not open seller WhatsApp contact"), {
        listingId: listing.id,
      });
      if (whatsappPhone) {
        window.open(buildWhatsappUrl(whatsappPhone), "_blank", "noopener,noreferrer");
        return;
      }
      toast.error("This seller has not added a valid WhatsApp number yet.");
    } finally {
      setOpeningWhatsapp(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: listing.title,
          text: `Check out this listing on CampusKart: ${listing.title}`,
          url: window.location.href,
        })
        .catch(() => {
          // Ignore share sheet cancellation.
        });
      return;
    }

    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const handleReport = async () => {
    if (!listing || reporting) return;

    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }

    setReporting(true);
    try {
      const { data, error } = await supabase.rpc("toggle_listing_report", {
        p_listing_id: listing.id,
        p_reason: "Community report from product page",
      });
      if (error) throw error;

      const result = data?.[0];
      const nextStatus = result?.moderation_status || "active";
      const nextCount = result?.report_count ?? Math.max(0, listing.report_count || 0);
      const nextHasReported = result?.has_reported ?? false;
      setListing((current) =>
        current
          ? {
              ...current,
              moderation_status: nextStatus,
              report_count: nextCount,
            }
          : current
      );
      setHasReported(nextHasReported);
      if (nextHasReported) {
        toast.success(nextStatus === "hidden" ? "Listing hidden for admin review." : "Listing reported for review.");
      } else {
        toast.success("Report removed.");
      }
    } catch (error: any) {
      trackHandledError("product-detail.report-listing", error, { listingId: listing.id });
      toast.error(error.message || "Could not report this listing right now");
    } finally {
      setReporting(false);
    }
  };

  const dateStr = new Date(listing.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl overflow-x-hidden px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="animate-fade-in grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-start">
          <div
            className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border/60 bg-muted shadow-[0_18px_45px_rgba(15,23,42,0.08)] lg:sticky lg:top-24"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {hasImages ? (
              <>
                <LqipImage
                  key={`${safeCurrentImage}-${imageAnimationClass}`}
                  src={displayImages[safeCurrentImage]}
                  placeholderSrc={displayPlaceholders[safeCurrentImage] || displayImages[safeCurrentImage]}
                  alt={`${listing.title} - Image ${safeCurrentImage + 1}`}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  sizes="(max-width: 768px) 100vw, 896px"
                  className="h-full w-full"
                  imgClassName={`h-full w-full object-cover ${imageAnimationClass}`}
                />
                {hasMultipleImages && (
                  <>
                    <button
                      onClick={showPreviousImage}
                      className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/88 text-foreground shadow-lg transition-transform hover:scale-105"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={showNextImage}
                      className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-background/88 text-foreground shadow-lg transition-transform hover:scale-105"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                      {displayImages.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => changeImage(i > safeCurrentImage ? "left" : "right", i)}
                          className={`h-2.5 rounded-full transition-all ${i === safeCurrentImage ? "w-6 bg-primary" : "w-2.5 bg-background/70"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="h-24 w-24 rounded-2xl gradient-bg opacity-20" />
                <span className="absolute text-sm font-medium text-muted-foreground">{displayCategory}</span>
              </div>
            )}
            {listing.sold && (
              <div className="absolute inset-0 flex items-center justify-center bg-foreground/60">
                <span className="font-display text-4xl font-bold text-background rotate-[-12deg]">SOLD</span>
              </div>
            )}
          </div>

          <div className="rounded-[18px] border border-border/70 bg-card px-4 py-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:px-5">
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{displayCategory}</Badge>
                  {shouldShowCondition && <Badge variant="outline">{displayCondition}</Badge>}
                </div>

                <div className="space-y-3">
                  <h1 className="break-words text-2xl font-bold leading-tight text-foreground sm:text-3xl">
                    {listing.title}
                  </h1>
                  <p className="text-2xl font-extrabold leading-none text-primary sm:text-3xl">
                    {displayPrice}
                  </p>
                </div>
              </div>

              <div className="space-y-3 border-t border-border/70 pt-5">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Description</p>
                  <div className="mt-3 rounded-2xl border border-border/70 bg-background/70 p-4">
                    <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
                      {listing.description}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Sold by <span className="font-medium text-foreground">{listing.seller_name}</span>
                </p>
              </div>

              <div className="space-y-3 border-t border-border/70 pt-5">
                {!listing.sold && (
                  isOwnListing ? (
                    <Button className="h-12 w-full rounded-xl border-0 bg-muted text-muted-foreground" disabled>
                      <MessageCircle className="mr-2 h-4 w-4" /> Your Listing
                    </Button>
                  ) : (
                    <Button
                      className="h-12 w-full rounded-xl border-0 bg-primary text-primary-foreground shadow-sm hover:opacity-90"
                      onClick={handleWhatsappContact}
                      disabled={openingWhatsapp || (!whatsappPhone && !listing.seller_phone)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      {openingWhatsapp ? "Opening WhatsApp..." : "Contact Seller"}
                    </Button>
                  )
                )}

                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" size="lg" onClick={handleLike} disabled={liking} className="h-12 rounded-xl">
                    <ShoppingCart className={`mr-2 h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} />
                    {liked ? "Added to Cart" : "Add to Cart"}
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleShare} className="h-12 rounded-xl">
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                </div>

                {!isOwnListing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReport}
                    disabled={reporting}
                    className="h-11 w-full rounded-xl border-destructive/20 bg-destructive/5 text-destructive hover:border-destructive/30 hover:bg-destructive/10 hover:text-destructive"
                  >
                    <ShieldAlert className="mr-2 h-4 w-4" />
                    {reporting ? (hasReported ? "Undoing..." : "Reporting...") : hasReported ? "Undo Report" : "Report Listing"}
                  </Button>
                )}

                <div className="rounded-2xl border border-border/70 bg-background/75 p-4">
                  <div className="flex items-start gap-3">
                    <div className="rounded-full bg-primary/10 p-2 text-primary">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">College</p>
                      <p className="mt-1 text-sm font-medium leading-6 text-foreground">{listing.college}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SiteFooter />
      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
};

export default ProductDetail;

