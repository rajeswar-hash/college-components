import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MapPin, Calendar, Share2, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { hasUserLikedListing, toggleListingLike } from "@/lib/likes";
import { useAuth } from "@/contexts/AuthContext";
import { AuthModal } from "@/components/AuthModal";

function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length > 10) return digits;
  const cleaned = digits.replace(/^0+/, "");
  return "91" + cleaned;
}

interface ListingDetail {
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
  created_at: string;
  seller_name: string;
  seller_phone: string;
}

const ProductDetail = () => {
  const { isAuthenticated, supabaseUser } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [listing, setListing] = useState<ListingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [liking, setLiking] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    const fetchListing = async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !data) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("name, phone")
        .eq("id", data.seller_id)
        .maybeSingle();

      setListing({
        ...data,
        images: data.images || [],
        seller_name: profile?.name || "Unknown",
        seller_phone: profile?.phone || "",
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

  const hasImages = listing.images && listing.images.length > 0 && listing.images[0];

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
      toast.success(result.liked ? "Added to favorites" : "Removed from favorites");
    } catch {
      toast.error("Could not update like right now");
    } finally {
      setLiking(false);
    }
  };

  const whatsappUrl = (() => {
    const msg = encodeURIComponent(
      `Hi! I'm interested in your listing on College Components:\n\n*${listing.title}*\nPrice: ₹${listing.price}\n\nIs this still available?`
    );
    return `https://wa.me/${formatPhone(listing.seller_phone)}?text=${msg}`;
  })();

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: listing.title,
          text: `Check out this listing on College Components: ${listing.title}`,
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

  const dateStr = new Date(listing.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <Navbar />
      <div className="container mx-auto max-w-4xl overflow-x-hidden px-4 py-8">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid animate-fade-in gap-8 md:grid-cols-2">
          <div className="relative aspect-square max-w-full overflow-hidden rounded-xl bg-muted glass">
            {hasImages ? (
              <>
                <img
                  src={listing.images[currentImage]}
                  alt={`${listing.title} - Image ${currentImage + 1}`}
                  className="h-full w-full max-w-full object-cover"
                />
                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImage((p) => (p === 0 ? listing.images.length - 1 : p - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCurrentImage((p) => (p === listing.images.length - 1 ? 0 : p + 1))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {listing.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentImage(i)}
                          className={`w-2 h-2 rounded-full transition-colors ${i === currentImage ? "bg-primary" : "bg-background/60"}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="w-24 h-24 rounded-xl gradient-bg opacity-20" />
                <span className="absolute text-muted-foreground font-medium">{listing.category}</span>
              </div>
            )}
            {listing.sold && (
              <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
                <span className="font-display font-bold text-4xl text-background rotate-[-12deg]">SOLD</span>
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-5">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{listing.category}</Badge>
                <Badge variant="outline">{listing.condition}</Badge>
              </div>
              <h1 className="break-words font-display font-bold text-2xl text-foreground md:text-3xl">{listing.title}</h1>
              <p className="font-display font-extrabold text-3xl gradient-text mt-2">₹{listing.price}</p>
            </div>

            <p className="break-words text-muted-foreground leading-relaxed">{listing.description}</p>

            <div className="rounded-2xl border border-border/70 bg-card/70 p-4 shadow-sm">
              <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 shrink-0" /> <span className="break-words">{listing.college}</span></div>
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Listed {dateStr}</p>
              <p className="flex items-center gap-2"><Heart className="w-4 h-4" /> {listing.likes} likes</p>
              <p className="break-words">Sold by <span className="font-medium text-foreground">{listing.seller_name}</span></p>
            </div>
            </div>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              {!listing.sold && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="w-full flex-1">
                  <Button className="w-full bg-success text-success-foreground hover:opacity-90 border-0" size="lg">
                    <MessageCircle className="w-4 h-4 mr-2" /> Contact on WhatsApp
                  </Button>
                </a>
              )}
              <Button variant="outline" size="lg" onClick={handleLike} disabled={liking} className="w-full sm:w-auto">
                <Heart className={`w-4 h-4 mr-1 ${liked ? "fill-destructive text-destructive" : ""}`} />
                {liked ? "Liked" : "Like"}
              </Button>
              <Button variant="outline" size="lg" onClick={handleShare} className="w-full sm:w-auto">
                <Share2 className="w-4 h-4" />
              </Button>
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
