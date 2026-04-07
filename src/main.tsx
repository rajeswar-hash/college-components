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
        <div className="absolute left-1/2 top-1/2 -z-10 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/12 blur-3xl sm:h-72 sm:w-72" />
        <div className="glass flex min-w-[290px] max-w-[88vw] flex-col items-center rounded-[28px] border-white/50 px-6 py-6 shadow-[0_24px_70px_hsla(210,78%,50%,0.12)] sm:min-w-[380px] sm:px-8 sm:py-7">
          <div className="flex items-center gap-4 sm:gap-5">
            <img
              src={brandLogoSrc}
              alt="CampusKart logo"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-16 w-16 rounded-[20px] object-cover shadow-[0_14px_35px_hsla(210,78%,50%,0.18)] sm:h-20 sm:w-20 sm:rounded-[24px]"
            />
            <div className="text-left">
              <h1 className="font-display text-[1.95rem] font-bold leading-none tracking-tight text-foreground sm:text-[2.45rem]">
                Campus<span className="gradient-text">Kart</span>
              </h1>
              <p className="mt-1 text-[0.76rem] font-semibold tracking-[0.14em] text-muted-foreground/80 sm:text-[0.82rem]">
                CAMPUS MARKETPLACE
              </p>
            </div>
          </div>
          <div className="mt-5 h-2 w-40 overflow-hidden rounded-full bg-primary/10 sm:mt-6 sm:w-48">
            <div className="boot-progress-bar h-full w-20 rounded-full gradient-bg sm:w-24" />
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
