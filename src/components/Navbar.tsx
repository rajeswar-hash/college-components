import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, User, LogOut, Menu, X, Shield, Trash2, Eye, EyeOff, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthModal } from "@/components/AuthModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { toast } from "sonner";
import { getSavedListingsCount, onCartUpdated } from "@/lib/likes";

export function Navbar() {
  const { user, isAuthenticated, logout, isAdmin, deleteAccount } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [mobileMenuMounted, setMobileMenuMounted] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [showDeletePasswordMobile, setShowDeletePasswordMobile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const lockedScrollY = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const isMainAdmin = user?.email?.trim().toLowerCase() === "rajeswarbind39@gmail.com";
  const dashboardRoute = isAdmin && !isMainAdmin ? "/admin" : "/dashboard";
  const dashboardLabel = isAdmin && !isMainAdmin ? "Admin Panel" : "Dashboard";

  const isActive = (path: string) => location.pathname === path;
  const brandLogoSrc = `${import.meta.env.BASE_URL}campuskart-logo.jpeg`;
  const navButtonClass = (path: string) =>
    `${
      isActive(path)
        ? "bg-primary/10 text-primary hover:bg-primary/15"
        : ""
    } md:transition-all md:duration-200 md:hover:-translate-y-0.5 md:hover:scale-[1.04] md:hover:shadow-[0_10px_24px_rgba(15,23,42,0.12)]`;

  useEffect(() => {
    if (mobileMenu) {
      setMobileMenuMounted(true);
      return;
    }

    const timeout = window.setTimeout(() => {
      setMobileMenuMounted(false);
    }, 220);

    return () => window.clearTimeout(timeout);
  }, [mobileMenu]);

  useEffect(() => {
    if (!mobileMenuMounted) {
      const restoreY = lockedScrollY.current;
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      if (restoreY) {
        window.scrollTo(0, restoreY);
      }
      return;
    }

    lockedScrollY.current = window.scrollY;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${lockedScrollY.current}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";
    return () => {
      const restoreY = lockedScrollY.current;
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      if (restoreY) {
        window.scrollTo(0, restoreY);
      }
    };
  }, [mobileMenuMounted]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setCartCount(0);
      return;
    }

    const syncCartCount = async () => {
      try {
        const count = await getSavedListingsCount(user.id);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    };

    void syncCartCount();
    const unsubscribe = onCartUpdated(() => {
      void syncCartCount();
    });

    return unsubscribe;
  }, [isAuthenticated, user?.id]);

  const closeMobileMenu = () => {
    setMobileMenu(false);
  };

  const handleLogout = async () => {
    setShowSignOutConfirm(false);
    setMobileMenu(false);
    if (isMainAdmin) {
      localStorage.removeItem("campuskart-main-admin-pin-unlocked");
    }
    await logout();
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      await deleteAccount(deletePassword);
      setDeletePassword("");
      setMobileMenu(false);
      toast.success("Your account and all linked data have been permanently deleted.");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 md:gap-3">
            <img
              src={brandLogoSrc}
              alt="CampusKart logo"
              className="h-9 w-9 rounded-lg object-cover shadow-sm md:h-10 md:w-10"
              loading="eager"
              decoding="sync"
              fetchPriority="high"
            />
            <span className="font-display text-xl font-bold leading-none text-foreground md:flex md:h-10 md:items-center">
              Campus<span className="gradient-text">Kart</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm" className={navButtonClass("/")}>Home</Button>
            </Link>
            <Link to="/about">
              <Button variant="ghost" size="sm" className={navButtonClass("/about")}>About</Button>
            </Link>
            <Link to="/help">
              <Button variant="ghost" size="sm" className={navButtonClass("/help")}>Help</Button>
            </Link>
            <Link to="/terms">
              <Button variant="ghost" size="sm" className={navButtonClass("/terms")}>Terms</Button>
            </Link>
            <Link to="/contact">
              <Button variant="ghost" size="sm" className={navButtonClass("/contact")}>Contact</Button>
            </Link>
            {isAuthenticated && !isAdmin && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                    Delete Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes your account, profile, and listings forever. Enter your password to confirm.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="delete-account-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="delete-account-password"
                        type={showDeletePassword ? "text" : "password"}
                        value={deletePassword}
                        onChange={(e) => setDeletePassword(e.target.value)}
                        placeholder="Enter your password"
                        className="pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword((value) => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                        aria-label={showDeletePassword ? "Hide password" : "Show password"}
                      >
                        {showDeletePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeletePassword("")}>Cancel</AlertDialogCancel>
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
            )}
            <Link to="/privacy">
              <Button variant="ghost" size="sm" className={navButtonClass("/privacy")}>Privacy</Button>
            </Link>
            {isAuthenticated && (
              <Link to="/cart">
                <Button variant="ghost" size="sm" className={`relative ${navButtonClass("/cart")}`}>
                  <ShoppingCart className="w-4 h-4 mr-1" /> Cart
                  {cartCount > 0 && (
                    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary/12 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                      {cartCount}
                    </span>
                  )}
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
                <Link to={isAdmin ? "/admin" : "/dashboard"}>
                  <Button variant="ghost" size="sm" className={navButtonClass(dashboardRoute)}>
                    {isAdmin && !isMainAdmin ? <Shield className="w-4 h-4 mr-1" /> : <User className="w-4 h-4 mr-1" />} {dashboardLabel}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={() => setShowSignOutConfirm(true)}>
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
                closeMobileMenu();
              } else {
                setMobileMenu(true);
              }
            }}
          >
            {mobileMenu ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

      </nav>
      <div className="h-16" aria-hidden="true" />

      {mobileMenuMounted && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close mobile menu"
            onClick={closeMobileMenu}
            className={`absolute inset-0 transition-opacity duration-300 ease-out ${mobileMenu ? "opacity-100" : "pointer-events-none opacity-0"}`}
            style={{
              background: "linear-gradient(135deg, rgba(0, 150, 136, 0.25), rgba(33, 150, 243, 0.25))",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          />

          <div
            className={`absolute inset-x-0 top-16 z-50 transition-all duration-300 ease-out ${mobileMenu ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0 pointer-events-none"}`}
          >
            <div className="border-t border-border bg-background/95 shadow-lg">
              <div className="p-4 flex flex-col gap-2">
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
                  <Link to={dashboardRoute} onClick={() => setMobileMenu(false)}>
                    <Button variant="ghost" className={`w-full justify-start ${navButtonClass(dashboardRoute)}`}>
                      {isAdmin && !isMainAdmin ? <Shield className="w-4 h-4 mr-2" /> : <User className="w-4 h-4 mr-2" />} {dashboardLabel}
                    </Button>
                  </Link>
                )}
                <Link to="/" onClick={() => setMobileMenu(false)}>
                  <Button variant="ghost" className={`w-full justify-start ${navButtonClass("/")}`}>Home</Button>
                </Link>
                <Link to="/about" onClick={() => setMobileMenu(false)}>
                  <Button variant="ghost" className={`w-full justify-start ${navButtonClass("/about")}`}>About</Button>
                </Link>
                <Link to="/help" onClick={() => setMobileMenu(false)}>
                  <Button variant="ghost" className={`w-full justify-start ${navButtonClass("/help")}`}>Help</Button>
                </Link>
                <Link to="/terms" onClick={() => setMobileMenu(false)}>
                  <Button variant="ghost" className={`w-full justify-start ${navButtonClass("/terms")}`}>Terms & Conditions</Button>
                </Link>
                <Link to="/contact" onClick={() => setMobileMenu(false)}>
                  <Button variant="ghost" className={`w-full justify-start ${navButtonClass("/contact")}`}>Contact Us</Button>
                </Link>
                {isAuthenticated && !isAdmin && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete Account
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete your account permanently?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This removes your account, profile, and listings forever. Enter your password to confirm.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <div className="space-y-2">
                        <Label htmlFor="delete-account-password-mobile">Password</Label>
                        <div className="relative">
                          <Input
                            id="delete-account-password-mobile"
                            type={showDeletePasswordMobile ? "text" : "password"}
                            value={deletePassword}
                            onChange={(e) => setDeletePassword(e.target.value)}
                            placeholder="Enter your password"
                            className="pr-11"
                          />
                          <button
                            type="button"
                            onClick={() => setShowDeletePasswordMobile((value) => !value)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
                            aria-label={showDeletePasswordMobile ? "Hide password" : "Show password"}
                          >
                            {showDeletePasswordMobile ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletePassword("")}>Cancel</AlertDialogCancel>
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
                )}
                <Link to="/privacy" onClick={() => setMobileMenu(false)}>
                  <Button variant="ghost" className={`w-full justify-start ${navButtonClass("/privacy")}`}>Privacy Policy</Button>
                </Link>
                {isAuthenticated && (
                  <Link to="/cart" onClick={() => setMobileMenu(false)}>
                    <Button variant="ghost" className={`w-full justify-start ${navButtonClass("/cart")}`}>
                      <ShoppingCart className="w-4 h-4 mr-2" /> Cart
                      {cartCount > 0 && (
                        <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-primary/12 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
                          {cartCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}
                {isAuthenticated && (
                  <Button variant="ghost" className="w-full justify-start" onClick={() => setShowSignOutConfirm(true)}>
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <AlertDialog open={showSignOutConfirm} onOpenChange={setShowSignOutConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to sign out?</AlertDialogTitle>
            <AlertDialogDescription>
              You will need to sign in again to access your dashboard, cart, and saved account features.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Sign Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AuthModal open={showAuth} onClose={() => setShowAuth(false)} />
    </>
  );
}
