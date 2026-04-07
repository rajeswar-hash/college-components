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
      <div className="relative flex flex-col items-center gap-5 px-8 text-center">
        <div className="absolute inset-x-0 top-1/2 -z-10 h-40 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <img
          src={brandLogoSrc}
          alt="CampusKart logo"
          className="h-24 w-24 rounded-[28px] object-cover shadow-[0_18px_45px_hsla(210,78%,50%,0.18)]"
        />
        <div className="space-y-2">
          <h1 className="font-display text-[2.6rem] font-bold tracking-tight text-foreground">
            Campus<span className="gradient-text">Kart</span>
          </h1>
          <div className="mx-auto flex items-center justify-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary/90 boot-dot-delay-1" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary/75 boot-dot-delay-2" />
            <span className="h-2.5 w-2.5 rounded-full bg-primary/55 boot-dot-delay-3" />
          </div>
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
