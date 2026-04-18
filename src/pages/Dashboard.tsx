import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeMode } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { CheckCircle2, KeyRound, Loader2, Lock, Moon, Pencil, Package, Plus, Save, Shield, Sparkles, Sun, Trash2, Unlock, User, X } from "lucide-react";
import { toast } from "sonner";
import { getListingCoverImage, getListingPreviewPlaceholders } from "@/lib/listingImage";
import { deleteListingImages } from "@/lib/storage";
import { trackHandledError } from "@/lib/errorTracking";
import { LqipImage } from "@/components/LqipImage";
import {
  extractBuiltInAvatarId,
  getAvatarStorageValue,
  getDefaultAvatarUrl,
  PROFILE_AVATARS,
  resolveAvatarUrl,
} from "@/lib/avatar";

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  sold: boolean;
  images: string[] | null;
  moderation_status?: string | null;
}

const MAIN_ADMIN_EMAIL = "rajeswarbind39@gmail.com";
const MAIN_ADMIN_PIN_HASH_KEY = "campuskart-main-admin-pin-hash";
const MAIN_ADMIN_PIN_HASH_METADATA_KEY = "campuskart_main_admin_pin_hash";
const MAIN_ADMIN_PIN_UNLOCK_KEY = "campuskart-main-admin-pin-unlocked";

async function hashAdminPin(pin: string) {
  const encoded = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

const Dashboard = () => {
  const { user, isAuthenticated, supabaseUser, isAdmin, updateProfile, loading: authLoading } = useAuth();
  const { theme, setTheme } = useThemeMode();
  const navigate = useNavigate();
  const isMainAdmin = user?.email?.trim().toLowerCase() === MAIN_ADMIN_EMAIL;
  const [myListings, setMyListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingSoldId, setUpdatingSoldId] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [hasAdminPin, setHasAdminPin] = useState(false);
  const [adminPanelUnlocked, setAdminPanelUnlocked] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [newAdminPin, setNewAdminPin] = useState("");
  const [confirmAdminPin, setConfirmAdminPin] = useState("");
  const [resetCurrentPin, setResetCurrentPin] = useState("");
  const [resetNewPin, setResetNewPin] = useState("");
  const [resetConfirmPin, setResetConfirmPin] = useState("");
  const [savingAdminPin, setSavingAdminPin] = useState(false);
  const [banState, setBanState] = useState<{ isBanned: boolean; reason: string | null }>({
    isBanned: false,
    reason: null,
  });
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
        avatar_url: getAvatarStorageValue(user.avatar_url),
      });
    }
  }, [user]);

  useEffect(() => {
    if (isAdmin && !isMainAdmin) {
      navigate("/admin", { replace: true });
      return;
    }
    if (!supabaseUser) {
      setLoading(false);
      return;
    }
    const fetchListings = async () => {
      const [{ data }, { data: profileRow }] = await Promise.all([
        supabase
        .from("listings")
        .select("id, title, price, category, sold, images, moderation_status")
        .eq("seller_id", supabaseUser.id)
        .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("is_banned, ban_reason")
          .eq("id", supabaseUser.id)
          .maybeSingle(),
      ]);
      setMyListings(data || []);
      setBanState({
        isBanned: !!profileRow?.is_banned,
        reason: profileRow?.ban_reason || null,
      });
      setLoading(false);
    };
    fetchListings();
  }, [isAdmin, isMainAdmin, navigate, supabaseUser]);

  useEffect(() => {
    if (!isMainAdmin) {
      setHasAdminPin(false);
      setAdminPanelUnlocked(false);
      return;
    }

    const metadataPinHash = typeof supabaseUser?.user_metadata?.[MAIN_ADMIN_PIN_HASH_METADATA_KEY] === "string"
      ? String(supabaseUser.user_metadata[MAIN_ADMIN_PIN_HASH_METADATA_KEY])
      : "";
    const localPinHash = localStorage.getItem(MAIN_ADMIN_PIN_HASH_KEY) || "";
    setHasAdminPin(!!(metadataPinHash || localPinHash));
    setAdminPanelUnlocked(localStorage.getItem(MAIN_ADMIN_PIN_UNLOCK_KEY) === "true");
  }, [isMainAdmin, supabaseUser?.user_metadata]);

  useEffect(() => {
    if (!isMainAdmin || !supabaseUser) return;

    const metadataPinHash = typeof supabaseUser.user_metadata?.[MAIN_ADMIN_PIN_HASH_METADATA_KEY] === "string"
      ? String(supabaseUser.user_metadata[MAIN_ADMIN_PIN_HASH_METADATA_KEY])
      : "";
    const localPinHash = localStorage.getItem(MAIN_ADMIN_PIN_HASH_KEY) || "";

    if (metadataPinHash || !localPinHash) return;

    void supabase.auth.updateUser({
      data: {
        ...supabaseUser.user_metadata,
        [MAIN_ADMIN_PIN_HASH_METADATA_KEY]: localPinHash,
      },
    });
  }, [isMainAdmin, supabaseUser]);

  const activeListings = myListings.filter((listing) => !listing.sold).length;
  const soldListings = myListings.filter((listing) => listing.sold).length;
  const listingValue = useMemo(() => myListings.reduce((sum, listing) => sum + listing.price, 0), [myListings]);
  const selectedAvatar = resolveAvatarUrl(profileForm.avatar_url || user?.avatar_url, user?.name, user?.email);

  const getListingStatusMeta = (status?: string | null, sold?: boolean) => {
    if (sold) return { label: "Sold", className: "bg-success/10 text-success border-success/20" };
    switch (status) {
      case "pending_review":
        return { label: "Under Verification", className: "bg-amber-500/10 text-amber-700 border-amber-500/20" };
      case "rejected":
        return { label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" };
      case "flagged":
      case "hidden":
        return { label: "Reported", className: "bg-orange-500/10 text-orange-700 border-orange-500/20" };
      default:
        return { label: "Approved", className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" };
    }
  };

  const handleDelete = async (id: string) => {
    const target = myListings.find((listing) => listing.id === id);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) {
      trackHandledError("dashboard.delete-listing", error, { listingId: id });
      toast.error("Failed to delete");
      return;
    }
    void deleteListingImages(target?.images);
    setMyListings((prev) => prev.filter((l) => l.id !== id));
    toast.success("Listing deleted");
  };

  const handleSoldToggle = async (id: string, nextSoldState: boolean) => {
    if (updatingSoldId) return;

    setUpdatingSoldId(id);
    try {
      const { error } = await supabase
        .from("listings")
        .update({ sold: nextSoldState })
        .eq("id", id)
        .eq("seller_id", supabaseUser?.id || "");

      if (error) throw error;

      setMyListings((prev) =>
        prev.map((listing) => (listing.id === id ? { ...listing, sold: nextSoldState } : listing))
      );
      toast.success(
        nextSoldState
          ? "Marked as sold. Buyers will no longer see this item."
          : "Listing is active again and visible to buyers."
      );
    } catch (error) {
      trackHandledError("dashboard.toggle-sold", error, {
        listingId: id,
        userId: supabaseUser?.id,
        nextSoldState,
      });
      toast.error(`Could not ${nextSoldState ? "mark" : "unmark"} this listing as sold`);
    } finally {
      setUpdatingSoldId(null);
    }
  };

  const handleSaveProfile = async () => {
    const cleanName = profileForm.name.trim();
    const cleanCollege = profileForm.college.trim();
    const cleanPhone = profileForm.phone.trim();
    const normalizedPhone = cleanPhone.replace(/\D/g, "");

    if (!cleanName) {
      toast.error("Please enter your name");
      return;
    }
    if (!cleanCollege) {
      toast.error("Please enter your college");
      return;
    }
    if (!cleanPhone) {
      toast.error("Please enter your WhatsApp number");
      return;
    }
    if (normalizedPhone.length !== 10) {
      toast.error("Please enter a valid 10-digit WhatsApp number");
      return;
    }

    try {
      setSavingProfile(true);
      await updateProfile({
        name: cleanName,
        phone: normalizedPhone,
        college: cleanCollege,
        avatar_url: getAvatarStorageValue(
          profileForm.avatar_url || user?.avatar_url || getDefaultAvatarUrl(profileForm.name, user?.email)
        ),
      });
      setIsEditingProfile(false);
      toast.success("Profile updated");
    } catch (error) {
      trackHandledError("dashboard.save-profile", error, { userId: supabaseUser?.id });
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
      avatar_url: getAvatarStorageValue(user?.avatar_url),
    });
    setIsEditingProfile(false);
  };

  const validatePinFormat = (pin: string) => /^\d{4,8}$/.test(pin);

  const handleCreateAdminPin = async () => {
    if (!validatePinFormat(newAdminPin)) {
      toast.error("Use a 4 to 8 digit PIN");
      return;
    }
    if (newAdminPin !== confirmAdminPin) {
      toast.error("PIN confirmation does not match");
      return;
    }

    setSavingAdminPin(true);
    try {
      const hashedPin = await hashAdminPin(newAdminPin);
      const { error } = await supabase.auth.updateUser({
        data: {
          ...supabaseUser?.user_metadata,
          [MAIN_ADMIN_PIN_HASH_METADATA_KEY]: hashedPin,
        },
      });
      if (error) throw error;
      localStorage.setItem(MAIN_ADMIN_PIN_HASH_KEY, hashedPin);
      localStorage.setItem(MAIN_ADMIN_PIN_UNLOCK_KEY, "true");
      setHasAdminPin(true);
      setAdminPanelUnlocked(true);
      setNewAdminPin("");
      setConfirmAdminPin("");
      toast.success("Admin PIN created");
    } finally {
      setSavingAdminPin(false);
    }
  };

  const handleUnlockAdminPanel = async () => {
    const storedHash =
      (typeof supabaseUser?.user_metadata?.[MAIN_ADMIN_PIN_HASH_METADATA_KEY] === "string"
        ? String(supabaseUser.user_metadata[MAIN_ADMIN_PIN_HASH_METADATA_KEY])
        : "") || localStorage.getItem(MAIN_ADMIN_PIN_HASH_KEY);
    if (!storedHash) {
      toast.error("Create your admin PIN first");
      return;
    }
    if (!validatePinFormat(adminPin)) {
      toast.error("Enter your 4 to 8 digit PIN");
      return;
    }

    setSavingAdminPin(true);
    try {
      const hashedPin = await hashAdminPin(adminPin);
      if (hashedPin !== storedHash) {
        toast.error("Incorrect PIN");
        return;
      }

      localStorage.setItem(MAIN_ADMIN_PIN_UNLOCK_KEY, "true");
      setAdminPanelUnlocked(true);
      setAdminPin("");
      toast.success("Admin panel unlocked");
    } finally {
      setSavingAdminPin(false);
    }
  };

  const handleResetAdminPin = async () => {
    const storedHash =
      (typeof supabaseUser?.user_metadata?.[MAIN_ADMIN_PIN_HASH_METADATA_KEY] === "string"
        ? String(supabaseUser.user_metadata[MAIN_ADMIN_PIN_HASH_METADATA_KEY])
        : "") || localStorage.getItem(MAIN_ADMIN_PIN_HASH_KEY);
    if (!storedHash) {
      toast.error("Create your admin PIN first");
      return;
    }
    if (!validatePinFormat(resetCurrentPin) || !validatePinFormat(resetNewPin)) {
      toast.error("Use a 4 to 8 digit PIN");
      return;
    }
    if (resetNewPin !== resetConfirmPin) {
      toast.error("New PIN confirmation does not match");
      return;
    }

    setSavingAdminPin(true);
    try {
      const currentHash = await hashAdminPin(resetCurrentPin);
      if (currentHash !== storedHash) {
        toast.error("Current PIN is incorrect");
        return;
      }

      const nextHash = await hashAdminPin(resetNewPin);
      const { error } = await supabase.auth.updateUser({
        data: {
          ...supabaseUser?.user_metadata,
          [MAIN_ADMIN_PIN_HASH_METADATA_KEY]: nextHash,
        },
      });
      if (error) throw error;
      localStorage.setItem(MAIN_ADMIN_PIN_HASH_KEY, nextHash);
      localStorage.setItem(MAIN_ADMIN_PIN_UNLOCK_KEY, "true");
      setAdminPanelUnlocked(true);
      setResetCurrentPin("");
      setResetNewPin("");
      setResetConfirmPin("");
      toast.success("Admin PIN updated");
    } finally {
      setSavingAdminPin(false);
    }
  };

  const handleLockAdminPanel = () => {
    localStorage.removeItem(MAIN_ADMIN_PIN_UNLOCK_KEY);
    setAdminPanelUnlocked(false);
    toast.success("Admin panel locked");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          <p className="text-muted-foreground text-lg">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="animate-fade-in space-y-8">
          {banState.isBanned && (
            <Alert className="border-destructive/20 bg-destructive/5">
              <AlertTitle>Account Banned</AlertTitle>
              <AlertDescription>
                Your account has been banned. {banState.reason ? banState.reason : "Please contact CampusKart support if you think this is a mistake."}
              </AlertDescription>
            </Alert>
          )}
          <div className="relative pt-8">
            <div className="absolute left-4 top-0 z-10">
              <Badge className="rounded-xl border-0 bg-[linear-gradient(135deg,rgb(45,212,191),rgb(59,130,246))] px-4 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(34,197,194,0.22)]">
                <User className="mr-2 h-4 w-4" />
                My Profile
              </Badge>
            </div>
            <div className="glass rounded-2xl border border-primary/10 p-6 pt-6 shadow-[0_18px_60px_rgba(34,197,194,0.08)]">
              <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 items-center gap-4 md:items-center">
                  <div className="relative h-20 w-20 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-primary/10 blur-md" />
                    <div className="relative overflow-hidden rounded-full border border-white/80 bg-white shadow-[0_18px_32px_rgba(15,23,42,0.12)] ring-4 ring-white/75">
                      <img
                        src={selectedAvatar}
                        alt="Profile avatar"
                        loading="lazy"
                        decoding="async"
                        className="h-20 w-20 object-cover"
                      />
                    </div>
                  </div>
                  <div className="min-w-0 self-center">
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
                    className="h-11 w-full rounded-xl border border-border/70 bg-background px-4 text-foreground shadow-sm hover:bg-background"
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

              <div className="mt-4 rounded-2xl border border-border/70 bg-background/70 px-4 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Website Theme</p>
                    <p className="mt-1 text-xs text-muted-foreground">Choose how CampusKart looks for you.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:w-auto">
                    <Button
                      type="button"
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => setTheme("light")}
                      className={theme === "light" ? "gradient-bg border-0 text-primary-foreground hover:opacity-90" : ""}
                    >
                      <Sun className="mr-2 h-4 w-4" />
                      Light
                    </Button>
                    <Button
                      type="button"
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => setTheme("dark")}
                      className={theme === "dark" ? "gradient-bg border-0 text-primary-foreground hover:opacity-90" : ""}
                    >
                      <Moon className="mr-2 h-4 w-4" />
                      Dark
                    </Button>
                  </div>
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
                    const isSelected =
                      extractBuiltInAvatarId(profileForm.avatar_url || user?.avatar_url) === avatar.id;
                    return (
                      <button
                        key={avatar.id}
                        type="button"
                        onClick={() => setProfileForm((prev) => ({ ...prev, avatar_url: avatar.id }))}
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
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
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
            Mark an item as sold once a deal is done. If the deal is canceled, you can make it active again. After the item is given away, delete the listing to keep the marketplace clean.
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
              {myListings.map((listing) => {
                const coverImage = getListingCoverImage(listing.category, listing.images);
                const coverPlaceholder = getListingPreviewPlaceholders(listing.category, listing.images)[0] || coverImage;
                return (
                <div key={listing.id} className="glass rounded-xl p-4 flex items-center gap-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {coverImage ? (
                      <LqipImage
                        src={coverImage}
                        alt={listing.title}
                        placeholderSrc={coverPlaceholder}
                        className="w-full h-full rounded-lg"
                        imgClassName="w-full h-full rounded-lg object-cover"
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
                      <Badge variant="outline" className={getListingStatusMeta(listing.moderation_status, listing.sold).className}>
                        {getListingStatusMeta(listing.moderation_status, listing.sold).label}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {listing.sold
                        ? "This sold listing should be deleted now."
                        : listing.moderation_status === "pending_review"
                          ? "This listing is under verification and is waiting for moderator approval."
                          : listing.moderation_status === "rejected"
                            ? "This listing was rejected by moderation and is not public."
                            : "This listing was approved and is visible to buyers."}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      className={
                        listing.sold
                          ? "border-amber-500/25 text-amber-700 hover:border-amber-500/35 hover:text-amber-800"
                          : "border-emerald-500/25 text-emerald-700 hover:border-emerald-500/35 hover:text-emerald-800"
                      }
                      onClick={() => handleSoldToggle(listing.id, !listing.sold)}
                      disabled={updatingSoldId === listing.id}
                    >
                      {updatingSoldId === listing.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span className="ml-2">{listing.sold ? "Unmark Sold" : "Mark Sold"}</span>
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => handleDelete(listing.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )})}
            </div>
          )}

          {isMainAdmin && (
            <div className="glass rounded-2xl border border-primary/10 p-5 shadow-[0_18px_60px_rgba(34,197,194,0.08)]">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" />
                    <h2 className="font-display text-xl font-semibold text-foreground">Admin Panel Access</h2>
                  </div>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Your main admin account uses the normal dashboard first. Open the admin panel only after PIN verification.
                  </p>
                </div>
                {adminPanelUnlocked && (
                  <Button onClick={() => navigate("/admin")} className="gradient-bg border-0 text-primary-foreground hover:opacity-90">
                    <Unlock className="mr-2 h-4 w-4" />
                    Open Admin Panel
                  </Button>
                )}
              </div>

              {!hasAdminPin ? (
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <Input
                    value={newAdminPin}
                    onChange={(event) => setNewAdminPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="Set 4-8 digit PIN"
                    inputMode="numeric"
                  />
                  <Input
                    value={confirmAdminPin}
                    onChange={(event) => setConfirmAdminPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                    placeholder="Confirm PIN"
                    inputMode="numeric"
                  />
                  <Button onClick={handleCreateAdminPin} disabled={savingAdminPin}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {savingAdminPin ? "Saving..." : "Create PIN"}
                  </Button>
                </div>
              ) : (
                <div className="mt-5 space-y-4">
                  {!adminPanelUnlocked && (
                    <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                      <Input
                        value={adminPin}
                        onChange={(event) => setAdminPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                        placeholder="Enter admin PIN"
                        inputMode="numeric"
                      />
                      <Button onClick={handleUnlockAdminPanel} disabled={savingAdminPin}>
                        <Unlock className="mr-2 h-4 w-4" />
                        {savingAdminPin ? "Checking..." : "Unlock Admin Panel"}
                      </Button>
                    </div>
                  )}

                  <div className="rounded-2xl border border-border/70 bg-background/70 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">Reset admin PIN</p>
                        <p className="mt-1 text-xs text-muted-foreground">Use your current PIN once, then set a new one.</p>
                      </div>
                      {adminPanelUnlocked && (
                        <Button variant="outline" onClick={handleLockAdminPanel}>
                          <Lock className="mr-2 h-4 w-4" />
                          Lock
                        </Button>
                      )}
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                      <Input
                        value={resetCurrentPin}
                        onChange={(event) => setResetCurrentPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                        placeholder="Current PIN"
                        inputMode="numeric"
                      />
                      <Input
                        value={resetNewPin}
                        onChange={(event) => setResetNewPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                        placeholder="New PIN"
                        inputMode="numeric"
                      />
                      <Input
                        value={resetConfirmPin}
                        onChange={(event) => setResetConfirmPin(event.target.value.replace(/\D/g, "").slice(0, 8))}
                        placeholder="Confirm new PIN"
                        inputMode="numeric"
                      />
                    </div>
                    <Button className="mt-3" variant="outline" onClick={handleResetAdminPin} disabled={savingAdminPin}>
                      <KeyRound className="mr-2 h-4 w-4" />
                      {savingAdminPin ? "Updating..." : "Reset PIN"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
};

export default Dashboard;
