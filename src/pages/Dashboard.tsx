import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Brush,
  CheckCircle,
  Package,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Trophy,
  Wallet,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  sold: boolean;
}

const avatarPresets = [
  { id: "avatar:aurora", label: "Aurora", className: "from-teal-400 via-cyan-400 to-blue-500" },
  { id: "avatar:sunset", label: "Sunset", className: "from-orange-400 via-pink-400 to-rose-500" },
  { id: "avatar:neon", label: "Neon", className: "from-fuchsia-500 via-violet-500 to-indigo-500" },
  { id: "avatar:mint", label: "Mint", className: "from-emerald-300 via-teal-400 to-cyan-500" },
  { id: "avatar:berry", label: "Berry", className: "from-rose-400 via-fuchsia-500 to-purple-600" },
  { id: "avatar:ember", label: "Ember", className: "from-amber-400 via-orange-500 to-red-500" },
];

const getAvatarClass = (avatarUrl?: string) =>
  avatarPresets.find((preset) => preset.id === avatarUrl)?.className ?? avatarPresets[0].className;

const Dashboard = () => {
  const { user, isAuthenticated, supabaseUser, isAdmin, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingAvatar, setSavingAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (isAdmin) {
      navigate("/admin", { replace: true });
      return;
    }

    if (!supabaseUser) return;

    const fetchListings = async () => {
      const { data } = await supabase
        .from("listings")
        .select("id, title, price, category, sold")
        .eq("seller_id", supabaseUser.id)
        .order("created_at", { ascending: false });

      setMyListings(data || []);
      setLoading(false);
    };

    fetchListings();
  }, [isAdmin, navigate, supabaseUser]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-lg text-muted-foreground">Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const handleMarkSold = async (id: string) => {
    const { error } = await supabase.from("listings").update({ sold: true }).eq("id", id);
    if (error) {
      toast.error("Failed to update");
      return;
    }

    setMyListings((prev) => prev.map((listing) => (listing.id === id ? { ...listing, sold: true } : listing)));
    toast.success("Item marked as sold!");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }

    setMyListings((prev) => prev.filter((listing) => listing.id !== id));
    toast.success("Listing deleted");
  };

  const handleAvatarChange = async (avatarId: string) => {
    try {
      setSavingAvatar(avatarId);
      await updateProfile({ avatar_url: avatarId });
      toast.success("Avatar updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update avatar");
    } finally {
      setSavingAvatar(null);
    }
  };

  const dashboardStats = useMemo(() => {
    const activeListings = myListings.filter((listing) => !listing.sold).length;
    const soldListings = myListings.filter((listing) => listing.sold).length;
    const totalValue = myListings.reduce((sum, listing) => sum + listing.price, 0);
    const profileStrength = user?.phone && user?.college ? "Complete" : "Needs update";

    return {
      activeListings,
      soldListings,
      totalValue,
      profileStrength,
    };
  }, [myListings, user?.college, user?.phone]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="animate-fade-in">
          <div className="relative mb-8 overflow-hidden rounded-[28px] border border-white/50 bg-white/80 p-6 shadow-[0_20px_80px_rgba(31,41,55,0.08)] backdrop-blur-xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.16),transparent_30%)]" />
            <div className="relative grid gap-6 lg:grid-cols-[1.4fr_0.95fr]">
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-3">
                    <Badge className="rounded-full border-0 bg-primary/10 px-3 py-1 text-primary">
                      Personal Dashboard
                    </Badge>
                    <div className="flex items-center gap-4">
                      <div className={`flex h-20 w-20 items-center justify-center rounded-[26px] bg-gradient-to-br ${getAvatarClass(user?.avatar_url)} text-2xl font-bold text-white shadow-lg`}>
                        {user?.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <h1 className="font-display text-3xl font-bold text-foreground">
                          {user?.name || "Your dashboard"}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {user?.college || "Add your college to personalize your account"}
                        </p>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate("/sell")}
                    className="gradient-bg border-0 text-primary-foreground hover:opacity-90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Sell New Item
                  </Button>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      <Package className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]">Active</span>
                    </div>
                    <p className="font-display text-2xl font-bold text-foreground">{dashboardStats.activeListings}</p>
                    <p className="text-xs text-muted-foreground">Listings currently visible</p>
                  </div>

                  <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-emerald-600">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]">Sold</span>
                    </div>
                    <p className="font-display text-2xl font-bold text-foreground">{dashboardStats.soldListings}</p>
                    <p className="text-xs text-muted-foreground">Deals successfully closed</p>
                  </div>

                  <div className="rounded-2xl border border-sky-500/10 bg-sky-500/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sky-600">
                      <Wallet className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]">Value</span>
                    </div>
                    <p className="font-display text-2xl font-bold text-foreground">
                      Rs. {dashboardStats.totalValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Combined listing value</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/60 bg-white/80 p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-display text-lg font-semibold text-foreground">Avatar Studio</h2>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Choose a signature animated-style avatar colorway to make your seller profile feel more alive.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  {avatarPresets.map((preset) => {
                    const isSelected = user?.avatar_url === preset.id;

                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleAvatarChange(preset.id)}
                        disabled={savingAvatar === preset.id}
                        className={`rounded-2xl border p-2 text-left transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-[0_10px_25px_rgba(45,212,191,0.12)]"
                            : "border-border/60 bg-background hover:border-primary/50 hover:bg-primary/5"
                        }`}
                      >
                        <div className={`mb-2 flex h-14 w-full items-center justify-center rounded-xl bg-gradient-to-br ${preset.className} text-lg font-bold text-white`}>
                          {user?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <p className="text-center text-xs font-medium text-foreground">
                          {savingAvatar === preset.id ? "Saving..." : preset.label}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-3">
                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="mb-2 flex items-center gap-2 text-amber-600">
                      <Trophy className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]">Seller Status</span>
                    </div>
                    <p className="font-medium text-foreground">
                      {dashboardStats.soldListings > 0 ? "Trusted campus seller" : "Getting started"}
                    </p>
                    <p className="text-xs text-muted-foreground">Keep your listings clear to build trust faster.</p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="mb-2 flex items-center gap-2 text-fuchsia-600">
                      <Brush className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]">Profile Strength</span>
                    </div>
                    <p className="font-medium text-foreground">{dashboardStats.profileStrength}</p>
                    <p className="text-xs text-muted-foreground">
                      College and WhatsApp details help buyers trust you quickly.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <div className="mb-2 flex items-center gap-2 text-primary">
                      <Zap className="h-4 w-4" />
                      <span className="text-xs font-semibold uppercase tracking-[0.24em]">Selling Power</span>
                    </div>
                    <p className="font-medium text-foreground">
                      {dashboardStats.activeListings >= 3 ? "High visibility" : "Add more listings"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      More active items give buyers more reason to explore your profile.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-foreground">Your Listings</h2>
              <p className="text-sm text-muted-foreground">
                Manage your active components and close deals faster.
              </p>
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
              <Star className="mr-1 h-3.5 w-3.5 text-primary" />
              Seller Workspace
            </Badge>
          </div>

          {loading ? (
            <div className="glass rounded-xl py-16 text-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : myListings.length === 0 ? (
            <div className="glass rounded-[24px] py-16 text-center">
              <Package className="mx-auto mb-3 h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground">You haven't listed any components yet.</p>
              <Button onClick={() => navigate("/sell")} variant="outline" className="mt-4">
                Create your first listing
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myListings.map((listing) => (
                <div key={listing.id} className="glass animate-fade-in rounded-[24px] border border-white/60 p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-muted">
                      <span className="text-xs text-muted-foreground">{listing.category}</span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-display text-lg font-semibold text-foreground">
                        {listing.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="font-display font-bold gradient-text">Rs. {listing.price}</span>
                        {listing.sold ? (
                          <Badge className="bg-success/10 text-success">Sold</Badge>
                        ) : (
                          <Badge variant="outline">Active</Badge>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {listing.sold
                          ? "This item is archived as sold."
                          : "Visible to buyers from your campus filters."}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                      {!listing.sold && (
                        <Button size="sm" variant="outline" onClick={() => handleMarkSold(listing.id)}>
                          <CheckCircle className="mr-1 h-4 w-4" />
                          Sold
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(listing.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default Dashboard;

