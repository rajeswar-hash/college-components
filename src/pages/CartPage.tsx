import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { getSavedListingIds, toggleListingLike } from "@/lib/likes";
import { normalizeCategory, normalizeCondition, type Listing } from "@/lib/types";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { toast } from "sonner";

type SavedListing = Listing;

const CartPage = () => {
  const { isAuthenticated, user, supabaseUser } = useAuth();
  const [items, setItems] = useState<SavedListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }

    const fetchSavedItems = async () => {
      setLoading(true);
      try {
        const savedRows = await getSavedListingIds(user.id);
        const listingIds = savedRows.map((row) => row.listing_id);

        if (listingIds.length === 0) {
          setItems([]);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("listings")
          .select("id, title, description, price, category, condition, images, seller_id, college, created_at, sold, likes")
          .in("id", listingIds)
          .order("created_at", { ascending: false });

        if (error || !data) throw error;

        const orderMap = new Map(savedRows.map((row, index) => [row.listing_id, index]));

        const mapped = data
          .map((listing) => ({
            id: listing.id,
            title: listing.title,
            description: listing.description,
            price: listing.price,
            category: normalizeCategory(listing.category) as Listing["category"],
            condition: normalizeCondition(listing.condition) as Listing["condition"],
            images: listing.images || [],
            sellerId: listing.seller_id,
            sellerName: "",
            sellerPhone: "",
            college: listing.college,
            createdAt: listing.created_at,
            sold: listing.sold,
            likes: listing.likes,
          }))
          .sort((a, b) => (orderMap.get(a.id) ?? 9999) - (orderMap.get(b.id) ?? 9999));

        setItems(mapped);
      } catch {
        toast.error("Could not load your cart right now");
      } finally {
        setLoading(false);
      }
    };

    void fetchSavedItems();
  }, [isAuthenticated, user?.id]);

  const totalValue = useMemo(() => items.reduce((sum, item) => sum + item.price, 0), [items]);

  const handleRemove = async (listingId: string, likes: number) => {
    if (!supabaseUser || removingId) return;

    setRemovingId(listingId);
    try {
      await toggleListingLike(listingId, likes, true);
      setItems((prev) => prev.filter((item) => item.id !== listingId));
      toast.success("Removed from cart");
    } catch {
      toast.error("Could not remove this item right now");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="space-y-6 animate-fade-in">
          <div className="rounded-3xl border border-primary/10 bg-[linear-gradient(135deg,rgba(20,184,166,0.10),rgba(59,130,246,0.08))] p-6 shadow-[0_18px_50px_rgba(20,184,166,0.10)]">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Badge className="border-0 bg-primary/10 text-primary">Saved Items</Badge>
                <h1 className="mt-3 font-display text-3xl font-bold text-foreground">Your Cart</h1>
                <p className="mt-2 max-w-xl text-sm text-muted-foreground">
                  Items you saved from the marketplace so you can come back and contact the seller later.
                </p>
              </div>
              <div className="rounded-2xl border border-primary/10 bg-background/80 px-4 py-3 text-sm shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">Saved Total</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">₹{totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {!isAuthenticated ? (
            <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-16 text-center shadow-sm">
              <ShoppingCart className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">Sign in to view your cart</h2>
              <p className="mt-2 text-sm text-muted-foreground">Save items you like and find them here any time.</p>
            </div>
          ) : loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-44 animate-pulse rounded-3xl bg-muted/60" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-3xl border border-border/70 bg-card/70 px-6 py-16 text-center shadow-sm">
              <ShoppingCart className="mx-auto h-12 w-12 text-primary" />
              <h2 className="mt-4 font-display text-2xl font-semibold text-foreground">Your cart is empty</h2>
              <p className="mt-2 text-sm text-muted-foreground">Tap the heart on any listing to save it here.</p>
              <Link to="/">
                <Button className="mt-6 gradient-bg border-0 text-primary-foreground hover:opacity-90">Browse Items</Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((item) => {
                const cover = item.images?.[0];
                return (
                  <div key={item.id} className="overflow-hidden rounded-3xl border border-border/70 bg-card/80 shadow-sm transition-shadow hover:shadow-lg">
                    <Link to={`/product/${item.id}`} className="block">
                      <div className="aspect-[16/10] bg-muted">
                        {cover ? (
                          <img src={cover} alt={item.title} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">{item.category}</div>
                        )}
                      </div>
                    </Link>
                    <div className="space-y-4 p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{item.category}</Badge>
                            {item.condition ? <Badge variant="outline">{item.condition}</Badge> : null}
                          </div>
                          <Link to={`/product/${item.id}`}>
                            <h3 className="mt-3 truncate font-display text-xl font-semibold text-foreground">{item.title}</h3>
                          </Link>
                        </div>
                        <p className="font-display text-2xl font-bold gradient-text">₹{item.price}</p>
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                      <p className="text-sm text-muted-foreground">{item.college}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <Link to={`/product/${item.id}`}>
                          <Button variant="outline" className="w-full rounded-2xl">View Item</Button>
                        </Link>
                        <Button
                          variant="outline"
                          className="w-full rounded-2xl border-destructive/20 text-destructive hover:border-destructive/30 hover:text-destructive"
                          onClick={() => handleRemove(item.id, item.likes)}
                          disabled={removingId === item.id}
                        >
                          {removingId === item.id ? (
                            "Removing..."
                          ) : (
                            <>
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default CartPage;
