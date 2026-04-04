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
  images: string[] | null;
}

const PROFILE_AVATARS = [
  {
    id: "avatar-1",
    url: `${import.meta.env.BASE_URL}avatars/avatar-1.jpg`,
  },
  {
    id: "avatar-2",
    url: `${import.meta.env.BASE_URL}avatars/avatar-2.jpg`,
  },
  {
    id: "avatar-3",
    url: `${import.meta.env.BASE_URL}avatars/avatar-3.jpg`,
  },
  {
    id: "avatar-4",
    url: `${import.meta.env.BASE_URL}avatars/avatar-4.jpg`,
  },
  {
    id: "avatar-6",
    url: `${import.meta.env.BASE_URL}avatars/avatar-6.jpg`,
  },
  {
    id: "avatar-7",
    url: `${import.meta.env.BASE_URL}avatars/avatar-7.jpg`,
  },
  {
    id: "avatar-8",
    url: `${import.meta.env.BASE_URL}avatars/avatar-8.jpg`,
  },
  {
    id: "avatar-9",
    url: `${import.meta.env.BASE_URL}avatars/avatar-9.jpg`,
  },
  {
    id: "avatar-10",
    url: `${import.meta.env.BASE_URL}avatars/avatar-10.jpg`,
  },
];

function getDefaultAvatar(name?: string | null, email?: string | null) {
  const seed = `${name || ""}${email || ""}`;
  const index = Array.from(seed).reduce((sum, char) => sum + char.charCodeAt(0), 0) % PROFILE_AVATARS.length;
  return PROFILE_AVATARS[index]?.url || PROFILE_AVATARS[0].url;
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
    avatar_url: "",
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        college: user.college || "",
        avatar_url: user.avatar_url || "",
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
        .select("id, title, price, category, sold, images")
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
  const selectedAvatar = profileForm.avatar_url || user?.avatar_url || getDefaultAvatar(user?.name, user?.email);

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
        avatar_url: profileForm.avatar_url || getDefaultAvatar(profileForm.name, user?.email),
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
      avatar_url: user?.avatar_url || "",
    });
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="animate-fade-in space-y-8">
          <div className="glass rounded-2xl border border-primary/10 p-6 shadow-[0_18px_60px_rgba(34,197,194,0.08)]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative h-20 w-20 shrink-0">
                  <div className="absolute inset-0 rounded-full bg-primary/10 blur-md" />
                  <div className="relative overflow-hidden rounded-full border border-white/80 bg-white shadow-[0_18px_32px_rgba(15,23,42,0.12)] ring-4 ring-white/75">
                    <img
                      src={selectedAvatar}
                      alt="Profile avatar"
                      className="h-20 w-20 object-cover"
                      loading="lazy"
                      decoding="async"
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <Badge className="border-0 bg-primary/10 px-3 py-1 text-primary shadow-sm">My Profile</Badge>
                  </div>
                  <h1 className="font-display text-[1.9rem] font-bold leading-[1.05] text-foreground">{user?.name || "Loading..."}</h1>
                  <p className="mt-0.5 text-sm leading-5 break-words text-muted-foreground">{user?.email}</p>
                  <p className="mt-0.5 text-sm leading-5 break-words text-muted-foreground">{user?.college}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:w-auto md:min-w-[320px]">
                <Button
                  variant="outline"
                  onClick={() => setIsEditingProfile((prev) => !prev)}
                  className="h-11 w-full rounded-xl border-border/70 bg-background/90 px-4 font-medium shadow-sm hover:bg-background"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  {isEditingProfile ? "Close Edit" : "Edit Profile"}
                </Button>
                <Button
                  onClick={() => navigate("/sell")}
                  className="gradient-bg h-11 w-full rounded-xl border-0 px-4 text-primary-foreground shadow-[0_14px_28px_rgba(59,130,246,0.22)] hover:opacity-90"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Listing
                </Button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
              <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Active</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="font-display text-2xl font-bold leading-none text-foreground">{activeListings}</p>
                  <p className="text-right text-[11px] leading-4 text-muted-foreground">Live now</p>
                </div>
              </div>
              <div className="rounded-2xl border border-emerald-500/10 bg-emerald-500/5 px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-600">Delete After Sale</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="font-display text-2xl font-bold leading-none text-foreground">{soldListings}</p>
                  <p className="text-right text-[11px] leading-4 text-muted-foreground">Remove sold items</p>
                </div>
              </div>
              <div className="rounded-2xl border border-sky-500/10 bg-sky-500/5 px-4 py-3 col-span-2 lg:col-span-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-600">Catalog Value</p>
                <div className="mt-2 flex items-end justify-between gap-3">
                  <p className="font-display text-xl font-bold leading-none text-foreground">Rs. {listingValue.toLocaleString()}</p>
                  <p className="text-right text-[11px] leading-4 text-muted-foreground">Current total</p>
                </div>
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

              <div className="mb-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-foreground">Choose profile character</span>
                  <span className="text-xs text-muted-foreground">Pick one avatar</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {PROFILE_AVATARS.map((avatar) => {
                    const isSelected = (profileForm.avatar_url || selectedAvatar) === avatar.url;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setProfileForm((prev) => ({ ...prev, avatar_url: avatar.url }))}
                        className={`overflow-hidden rounded-2xl border p-1 transition ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-[0_14px_24px_rgba(20,184,166,0.10)]"
                            : "border-border/70 bg-background/80 hover:border-primary/30 hover:bg-background"
                        }`}
                      >
                        <div className="aspect-square overflow-hidden rounded-[18px] bg-white">
                          <img
                            src={avatar.url}
                            alt="Profile avatar option"
                            className="h-full w-full object-cover"
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

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
                  <p className="text-xs text-muted-foreground">Use a valid 10-digit WhatsApp number so buyers can contact you.</p>
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
                    {listing.images && listing.images.length > 0 && listing.images[0] ? (
                      <img
                        src={listing.images[0]}
                        alt={listing.title}
                        className="w-full h-full rounded-lg object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span className="text-xs text-muted-foreground">{listing.category}</span>
                    )}
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
