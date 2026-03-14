import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getListings, updateListing, deleteListing } from "@/lib/store";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [refresh, setRefresh] = useState(0);

  const myListings = useMemo(
    () => getListings().filter((l) => l.sellerId === user?.id),
    [user?.id, refresh]
  );

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

  const handleMarkSold = (id: string) => {
    updateListing(id, { sold: true });
    setRefresh((r) => r + 1);
    toast.success("Item marked as sold!");
  };

  const handleDelete = (id: string) => {
    deleteListing(id);
    setRefresh((r) => r + 1);
    toast.success("Listing deleted");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-fade-in">
          {/* Profile Header */}
          <div className="glass rounded-xl p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full gradient-bg flex items-center justify-center text-primary-foreground font-display font-bold text-xl">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <h1 className="font-display font-bold text-2xl text-foreground">{user?.name}</h1>
                <p className="text-sm text-muted-foreground">{user?.email} • {user?.college}</p>
              </div>
            </div>
          </div>

          {/* Listings */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display font-semibold text-xl text-foreground">Your Listings</h2>
            <Button onClick={() => navigate("/sell")} className="gradient-bg text-primary-foreground border-0 hover:opacity-90" size="sm">
              <Plus className="w-4 h-4 mr-1" /> New Listing
            </Button>
          </div>

          {myListings.length === 0 ? (
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
