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
  const splashLogoSrc = `${import.meta.env.BASE_URL}campuskart-splash.jpeg`;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex select-none items-center justify-center bg-background">
      <div className="relative flex items-center justify-center px-8">
        <div className="absolute inset-x-0 top-1/2 -z-10 h-32 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />
        <img
          src={splashLogoSrc}
          alt="CampusKart logo"
          className="w-[230px] max-w-[78vw] object-contain sm:w-[310px]"
        />
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
