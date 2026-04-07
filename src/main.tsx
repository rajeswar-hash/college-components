import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { Toaster } from "sonner";

function ResponsiveToaster() {
  const [showCloseButton, setShowCloseButton] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const sync = () => setShowCloseButton(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return <Toaster richColors position="top-right" closeButton={showCloseButton} />;
}

function AppBootScreen() {
  const brandLogoSrc = `${import.meta.env.BASE_URL}campuskart-logo.jpeg`;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex select-none items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5 text-center">
        <img
          src={brandLogoSrc}
          alt="CampusKart logo"
          className="h-20 w-20 rounded-3xl object-cover shadow-lg"
        />
        <div className="space-y-1">
          <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
            Campus<span className="gradient-text">Kart</span>
          </h1>
          <p className="text-sm text-muted-foreground">Loading your campus marketplace...</p>
        </div>
      </div>
    </div>
  );
}

function BootstrappedApp() {
  const [showBootScreen, setShowBootScreen] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const minDelayTimer = window.setTimeout(() => {
      if (isMounted) {
        setShowBootScreen(false);
      }
    }, 1100);

    return () => {
      isMounted = false;
      window.clearTimeout(minDelayTimer);
    };
  }, []);

  return (
    <>
      <App />
      <ResponsiveToaster />
      {showBootScreen && <AppBootScreen />}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <BootstrappedApp />
  </AuthProvider>
);
