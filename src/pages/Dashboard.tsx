import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Package, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { toast } from "sonner";

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  sold: boolean;
}

const Dashboard = () => {
  const { user, isAuthenticated, supabaseUser, isAdmin, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    college: "",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        college: user.college || "",
      });
    }
  }, [user]);

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
          <p className="text-muted-foreground text-lg">Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  const activeListings = myListings.filter((listing) => !listing.sold).length;
  const soldListings = myListings.filter((listing) => listing.sold).length;
  const listingValue = useMemo(() => myListings.reduce((sum, listing) => sum + listing.price, 0), [myListings]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete");
      return;
    }
    setMyListings((prev) => prev.filter((l) => l.id !== id));
    toast.success("Listing deleted");
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!profileForm.college.trim()) {
      toast.error("Please enter your college");
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfile({
        name: profileForm.name.trim(),
        phone: profileForm.phone.trim(),
        college: profileForm.college.trim(),
      });
      setIsEditingProfile(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const resetProfileForm = () => {
    setProfileForm({
      name: user?.name || "",
      phone: user?.phone || "",
      college: user?.college || "",
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="animate-fade-in space-y-8">
          <div className="glass rounded-2xl p-6 border border-primary/10 shadow-[0_18px_60px_rgba(34,197,194,0.08)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-display font-bold text-xl shadow-lg">
                  {user?.name?.charAt(0) || "?"}
                </div>
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Badge className="bg-primary/10 text-primary border-0">My Profile</Badge>
                  </div>
                  <h1 className="font-display font-bold text-2xl text-foreground">{user?.name || "Loading..."}</h1>
                  <p className="text-sm text-muted-foreground break-words">{user?.email}</p>
                  <p className="text-sm text-muted-foreground break-words">{user?.college}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile((prev) => !prev)}
                  className="rounded-full"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  {isEditingProfile ? "Close Edit" : "Edit Profile"}
                </Button>
                <Button onClick={() => navigate("/sell")} className="gradient-bg text-primary-foreground border-0 hover:opacity-90 rounded-full">
                  <Plus className="w-4 h-4 mr-2" />
                  New Listing
                </Button>
              </div>
            </div>

            <div className="grid gap-3 mt-6 sm:grid-cols-3">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-primary font-semibold">Active Listings</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{activeListings}</p>
                <p className="text-xs text-muted-foreground">Currently visible on the marketplace</p>
              </div>
              <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-emerald-600 font-semibold">Delete After Sale</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">{soldListings}</p>
                <p className="text-xs text-muted-foreground">Remove sold listings so buyers only see available items</p>
              </div>
              <div className="rounded-2xl border border-sky-500/10 bg-sky-500/5 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-sky-600 font-semibold">Catalog Value</p>
                <p className="mt-2 font-display text-2xl font-bold text-foreground">Rs. {listingValue.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Total value of your current listings</p>
              </div>
            </div>
          </div>

          {isEditingProfile && (
            <div className="glass rounded-2xl p-6 border border-primary/10">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="font-display font-semibold text-xl text-foreground">Edit Profile</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5">Update your profile details so buyers can trust you faster.</p>

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">Full Name</span>
                  <input
                    value={profileForm.name}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                    placeholder="Enter your full name"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-medium text-foreground">WhatsApp Number</span>
                  <input
                    value={profileForm.phone}
                    onChange={(event) => setProfileForm((prev) => ({ ...prev, phone: event.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                    placeholder="Enter your WhatsApp number"
                  />
                </label>
              </div>

              <label className="space-y-2 mt-4 block">
                <span className="text-sm font-medium text-foreground">College / University</span>
                <input
                  value={profileForm.college}
                  onChange={(event) => setProfileForm((prev) => ({ ...prev, college: event.target.value }))}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
                  placeholder="Enter your college or university"
                />
              </label>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button onClick={handleSaveProfile} disabled={savingProfile} className="gradient-bg text-primary-foreground border-0 hover:opacity-90 rounded-full">
                  <Save className="w-4 h-4 mr-2" />
                  {savingProfile ? "Saving..." : "Save Profile"}
                </Button>
                <Button variant="outline" onClick={resetProfileForm} className="rounded-full">
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-xl text-foreground">Your Listings</h2>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-800">
            Delete a listing as soon as it is sold. Sold items should not stay visible on the marketplace.
          </div>

          {loading ? (
            <div className="text-center py-16 glass rounded-xl">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          ) : myListings.length === 0 ? (
            <div className="text-center py-16 glass rounded-xl">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">You haven't listed any components yet.</p>
              <Button onClick={() => navigate("/sell")} variant="outline" className="mt-4">
                Create your first listing
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {myListings.map((listing) => (
                <div key={listing.id} className="glass rounded-xl p-4 flex items-center gap-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <span className="text-xs text-muted-foreground">{listing.category}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display font-semibold text-foreground truncate">{listing.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-display font-bold gradient-text">Rs. {listing.price}</span>
                      {listing.sold ? (
                        <Badge className="bg-success/10 text-success">Sold</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {listing.sold
                        ? "This sold listing should be deleted now."
                        : "If this item gets sold, delete this listing immediately."}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(listing.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
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
