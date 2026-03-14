import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Plus, User, LogOut, Menu, X, Cpu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              Campus<span className="gradient-text">Components</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm">Browse</Button>
            </Link>
            <Button
              size="sm"
              className="gradient-bg text-primary-foreground border-0 hover:opacity-90"
              onClick={() => {
                if (isAuthenticated) {
                  navigate("/sell");
                } else {
                  setShowAuth(true);
                }
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Sell
            </Button>
            {isAuthenticated && (
              <>
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm">
                    <User className="w-4 h-4 mr-1" /> {user?.name?.split(" ")[0]}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={logout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setMobileMenu(!mobileMenu)}>
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {mobileMenu && (
          <div className="md:hidden border-t border-border p-4 flex flex-col gap-2 glass">
            <Link to="/" onClick={() => setMobileMenu(false)}>
              <Button variant="ghost" className="w-full justify-start">Browse</Button>
            </Link>
            <Button
              className="w-full gradient-bg text-primary-foreground border-0"
              onClick={() => {
                setMobileMenu(false);
                if (isAuthenticated) {
                  navigate("/sell");
                } else {
                  setShowAuth(true);
                }
              }}
            >
              <Plus className="w-4 h-4 mr-1" /> Sell Item
            </Button>
            {isAuthenticated && (
              <>
                <Link to="/dashboard" onClick={() => setMobileMenu(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" /> Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" className="w-full justify-start" onClick={() => { logout(); setMobileMenu(false); }}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              </>
            )}
          </div>
        )}
      </nav>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
