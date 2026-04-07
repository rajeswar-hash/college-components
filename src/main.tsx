import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { Toaster } from "sonner";
import { Cpu } from "lucide-react";

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
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-5 text-center">
        <div className="flex h-20 w-20 items-center justify-center rounded-3xl gradient-bg shadow-lg">
          <Cpu className="h-10 w-10 text-primary-foreground" />
        </div>
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
    let pageReady = document.readyState === "complete";
    let minDelayElapsed = false;

    const finishIfReady = () => {
      if (isMounted && pageReady && minDelayElapsed) {
        setShowBootScreen(false);
      }
    };

    const minDelayTimer = window.setTimeout(() => {
      minDelayElapsed = true;
      finishIfReady();
    }, 1800);

    const handlePageReady = () => {
      pageReady = true;
      finishIfReady();
    };

    if (!pageReady) {
      window.addEventListener("load", handlePageReady, { once: true });
    }

    return () => {
      isMounted = false;
      window.clearTimeout(minDelayTimer);
      window.removeEventListener("load", handlePageReady);
    };
  }, []);

  if (showBootScreen) {
    return <AppBootScreen />;
  }

  return (
    <>
      <App />
      <ResponsiveToaster />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <BootstrappedApp />
  </AuthProvider>
);
