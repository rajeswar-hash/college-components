import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, PackageSearch } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { trackHandledError } from "@/lib/errorTracking";
import type { Listing } from "@/lib/types";

interface SellerListingRow {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images?: string[];
  seller_id: string;
  college: string;
  sold: boolean;
  likes: number;
  created_at: string;
  moderation_status?: string | null;
  report_count?: number | null;
  resource_link?: string | null;
  ai_verification_status?: string | null;
}

interface SellerListingsLocationState {
  sellerName?: string;
  from?: string;
}

const SellerListingsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { sellerId } = useParams<{ sellerId: string }>();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  const locationState = (location.state as SellerListingsLocationState | null) || null;
  const sellerName = locationState?.sellerName?.trim() || "this seller";

  useEffect(() => {
    if (!sellerId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchSellerListings = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("listings")
        .select("id, title, description, price, category, condition, images, seller_id, college, sold, likes, created_at, moderation_status, report_count, resource_link, ai_verification_status")
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) {
        trackHandledError("seller-listings.fetch", error, { sellerId });
      }

      if (cancelled) return;

      const nextListings: Listing[] = (data || [])
        .filter(
          (listing) =>
            !listing.sold &&
            !["pending_review", "rejected"].includes(listing.moderation_status || "active"),
        )
        .map((listing: SellerListingRow) => ({
          id: listing.id,
          title: listing.title,
          description: listing.description,
          price: listing.price,
          category: listing.category,
          condition: listing.condition,
          images: listing.images || [],
          sellerId: listing.seller_id,
          sellerName,
          sellerPhone: "",
          college: listing.college,
          createdAt: listing.created_at,
          sold: listing.sold,
          likes: listing.likes,
          resourceLink: listing.resource_link || undefined,
          moderationStatus: listing.moderation_status || undefined,
          reportCount: listing.report_count || undefined,
          aiVerificationStatus: listing.ai_verification_status || undefined,
        }));

      setListings(nextListings);
      setLoading(false);
    };

    void fetchSellerListings();

    return () => {
      cancelled = true;
    };
  }, [sellerId, sellerName]);

  const handleBack = () => {
    if (locationState?.from) {
      navigate(locationState.from);
      return;
    }

    navigate(-1);
  };

  const sellerLabel = useMemo(() => {
    if (!sellerName || sellerName === "this seller") {
      return "this seller";
    }
    return sellerName;
  }, [sellerName]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={handleBack} className="mb-6 rounded-full px-3 text-foreground/90 hover:bg-primary/5 hover:text-primary">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>

        <div className="mb-8 rounded-[28px] border border-border/70 bg-[linear-gradient(135deg,rgba(20,184,166,0.08),rgba(15,23,42,0.96),rgba(59,130,246,0.08))] p-5 shadow-[0_20px_50px_rgba(15,23,42,0.12)]">
          <div className="flex items-start gap-4">
            <div className="rounded-[20px] bg-primary/10 p-3 text-primary shadow-[0_10px_24px_rgba(20,184,166,0.10)]">
              <PackageSearch className="h-6 w-6" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
                Seller Store
              </p>
              <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
                More items from {sellerLabel}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                Browse other active listings from the same seller and contact them for anything you like.
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-muted-foreground">Loading seller items...</div>
        ) : listings.length === 0 ? (
          <Card className="border-border/70 bg-card/80 shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="rounded-2xl bg-primary/10 p-4 text-primary">
                <PackageSearch className="h-8 w-8" />
              </div>
              <h2 className="mt-5 text-xl font-semibold text-foreground">No active items right now</h2>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                This seller does not have any other public items available at the moment.
              </p>
              <Button variant="outline" className="mt-6" onClick={handleBack}>
                Go Back
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {listings.map((listing) => (
              <ProductCard key={listing.id} listing={listing} user={user} />
            ))}
          </div>
        )}
      </div>
      <SiteFooter />
    </div>
  );
};

export default SellerListingsPage;
