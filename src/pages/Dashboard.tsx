import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";

interface ListingRow {
  id: string;
  title: string;
  price: number;
  category: string;
  sold: boolean;
}

const Dashboard = () => {
  const { user, isAuthenticated, supabaseUser, isAdmin, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState<ListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingAccount, setDeletingAccount] = useState(false);

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

  const handleMarkSold = async (id: string) => {
    const { error } = await supabase.from("listings").update({ sold: true }).eq("id", id);
    if (error) { toast.error("Failed to update"); return; }
    setMyListings((prev) => prev.map((l) => (l.id === id ? { ...l, sold: true } : l)));
    toast.success("Item marked as sold!");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) { toast.error("Failed to delete"); return; }
    setMyListings((prev) => prev.filter((l) => l.id !== id));
    toast.success("Listing deleted");
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount();
      toast.success("Your account and data have been permanently deleted.");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-fade-in">
          <div className="glass rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
                {user?.name?.charAt(0) || "?"}
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-foreground">{user?.name || "Loading..."}</h1>
                <p className="text-sm text-muted-foreground">{user?.email} • {user?.college}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-foreground">Your Listings</h2>
            <div className="flex gap-3">
              <Button onClick={() => navigate("/sell")} className="gradient-bg text-primary-foreground border-0 hover:opacity-90" size="sm">
                <Plus className="w-4 h-4 mr-1" /> New Listing
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete your account, your profile, and all of your listings. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteAccount}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deletingAccount}
                    >
                      {deletingAccount ? "Deleting..." : "Delete Permanently"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
                      <span className="font-display font-bold gradient-text">₹{listing.price}</span>
                      {listing.sold ? (
                        <Badge className="bg-success/10 text-success">Sold</Badge>
                      ) : (
                        <Badge variant="outline">Active</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {!listing.sold && (
                      <Button size="sm" variant="outline" onClick={() => handleMarkSold(listing.id)}>
                        <CheckCircle className="w-4 h-4 mr-1" /> Sold
                      </Button>
                    )}
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
    </div>
  );
};

export default Dashboard;
