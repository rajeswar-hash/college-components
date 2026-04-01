import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, User, LogOut, Menu, X, Cpu, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";

export function Navbar() {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mobileMenu) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenu]);

  const closeMobileMenuToHome = () => {
    setMobileMenu(false);
    navigate("/");
  };

  const handleLogout = async () => {
    setMobileMenu(false);
    await logout();
    navigate("/");
  };

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b border-border relative">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center">
              <Cpu className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground">
              College<span className="gradient-text">Components</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm">Browse</Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="sm">About</Button>
            </Link>
            <Link to="/help">
              <Button variant="ghost" size="sm">Help</Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost" size="sm">Contact</Button>
            </Link>
            {isAdmin && (
              <Link to="/admin">
                <Button variant="ghost" size="sm">
                  <Shield className="w-4 h-4 mr-1" /> Admin
                </Button>
              </Link>
            )}
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
                    <User className="w-4 h-4 mr-1" /> {user?.name?.split(" ")[0] || "Profile"}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => {
              if (mobileMenu) {
                closeMobileMenuToHome();
              } else {
                setMobileMenu(true);
              }
            }}
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {mobileMenu && (
          <>
            <button
              type="button"
              aria-label="Close mobile menu"
              className="fixed inset-x-0 top-16 bottom-0 z-40 bg-background/55 backdrop-blur-md md:hidden"
              onClick={closeMobileMenuToHome}
            />
            <div className="fixed inset-x-0 top-16 z-50 max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-border bg-background p-4 flex flex-col gap-2 shadow-lg md:hidden">
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
                <Link to="/dashboard" onClick={() => setMobileMenu(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="w-4 h-4 mr-2" /> Dashboard
                  </Button>
                </Link>
              )}
              <Link to="/about" onClick={() => setMobileMenu(false)}>
                <Button variant="ghost" className="w-full justify-start">About</Button>
              </Link>
              <Link to="/help" onClick={() => setMobileMenu(false)}>
                <Button variant="ghost" className="w-full justify-start">Help</Button>
              </Link>
              <Link to="/contact" onClick={() => setMobileMenu(false)}>
                <Button variant="ghost" className="w-full justify-start">Contact Us</Button>
              </Link>
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileMenu(false)}>
                  <Button variant="ghost" className="w-full justify-start">
                    <Shield className="w-4 h-4 mr-2" /> Admin Panel
                  </Button>
                </Link>
              )}
              {isAuthenticated && (
                <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                  <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
              )}
            </div>
          </>
        )}
      </nav>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
