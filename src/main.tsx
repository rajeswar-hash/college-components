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
      <div className="relative px-6">
        <div className="absolute left-1/2 top-1/2 -z-10 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-3xl sm:h-56 sm:w-56" />
        <div className="glass flex min-w-[272px] max-w-[84vw] flex-col items-center rounded-[24px] border-white/50 px-5 py-5 shadow-[0_18px_50px_hsla(210,78%,50%,0.08)] sm:min-w-[352px] sm:px-7 sm:py-6">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <img
              src={brandLogoSrc}
              alt="CampusKart logo"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-14 w-14 rounded-[18px] object-cover shadow-[0_12px_26px_hsla(210,78%,50%,0.14)] sm:h-18 sm:w-18 sm:rounded-[22px]"
            />
            <div className="text-left">
              <h1 className="font-display text-[1.8rem] font-bold leading-none tracking-tight text-foreground sm:text-[2.2rem]">
                Campus<span className="gradient-text">Kart</span>
              </h1>
              <p className="mt-0.5 text-[0.68rem] font-semibold tracking-[0.14em] text-muted-foreground/72 sm:text-[0.76rem]">
                CAMPUS MARKETPLACE
              </p>
            </div>
          </div>
          <div className="mt-4 h-1.5 w-36 overflow-hidden rounded-full bg-primary/10 sm:mt-5 sm:w-44">
            <div className="boot-progress-bar h-full w-18 rounded-full gradient-bg sm:w-22" />
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
