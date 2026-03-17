import { useParams, useNavigate } from "react-router-dom";
import { getListingById, toggleLike, getLikedIds } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Heart, MapPin, Calendar, Share2, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatPhone(phone: string): string {
  // Strip non-digits
  const digits = phone.replace(/\D/g, "");
  // If already has country code (10+ digits starting with non-0), use as-is
  // Otherwise prepend India code 91
  if (digits.length > 10) return digits;
  // Remove leading 0 if present
  const cleaned = digits.replace(/^0+/, "");
  return "91" + cleaned;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const listing = id ? getListingById(id) : undefined;
  const [liked, setLiked] = useState(() => (id ? getLikedIds().includes(id) : false));
  const [currentImage, setCurrentImage] = useState(0);

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

  const handleLike = () => {
    if (!id) return;
    const isNowLiked = toggleLike(id);
    setLiked(isNowLiked);
    toast.success(isNowLiked ? "Added to favorites" : "Removed from favorites");
  };

  const whatsappUrl = (() => {
    const msg = encodeURIComponent(
      `Hi! I'm interested in your listing on Campus Components:\n\n*${listing.title}*\nPrice: ₹${listing.price}\n\nIs this still available?`
    );
    return `https://wa.me/${formatPhone(listing.sellerPhone)}?text=${msg}`;
  })();

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Link copied to clipboard!");
  };

  const dateStr = new Date(listing.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8 animate-fade-in">
          {/* Image */}
          <div className="aspect-square rounded-xl bg-muted glass overflow-hidden relative">
            {hasImages ? (
              <>
                <img
                  src={listing.images[currentImage]}
                  alt={`${listing.title} - Image ${currentImage + 1}`}
                  className="w-full h-full object-cover"
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

          {/* Details */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary">{listing.category}</Badge>
                <Badge variant="outline">{listing.condition}</Badge>
              </div>
              <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground">{listing.title}</h1>
              <p className="font-display font-extrabold text-3xl gradient-text mt-2">₹{listing.price}</p>
            </div>

            <p className="text-muted-foreground leading-relaxed">{listing.description}</p>

            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {listing.college}</p>
              <p className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Listed {dateStr}</p>
              <p>Sold by <span className="font-medium text-foreground">{listing.sellerName}</span></p>
            </div>

            <div className="flex gap-3 pt-2">
              {!listing.sold && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1"
                >
                  <Button
                    className="w-full bg-success text-success-foreground hover:opacity-90 border-0"
                    size="lg"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" /> Contact on WhatsApp
                  </Button>
                </a>
              )}
              <Button variant="outline" size="lg" onClick={handleLike}>
                <Heart className={`w-4 h-4 mr-1 ${liked ? "fill-destructive text-destructive" : ""}`} />
                {liked ? "Liked" : "Like"}
              </Button>
              <Button variant="outline" size="lg" onClick={handleShare}>
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
