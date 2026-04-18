import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./contexts/AuthContext.tsx";
import { ThemeProvider, useThemeMode } from "./contexts/ThemeContext.tsx";
import { Toaster } from "sonner";
import { loadInstitutionNames, canonicalInstitutionName } from "./lib/institutions";
import { supabase } from "./integrations/supabase/client";
import { getBuiltInListingImageUrls, getListingCoverImage } from "./lib/listingImage";
import { AppErrorBoundary } from "./components/AppErrorBoundary.tsx";
import { installGlobalErrorTracking } from "./lib/errorTracking";
import { heroDesktopPlaceholder, heroMobilePlaceholder } from "./lib/staticImagePlaceholders";
import { preloadCommonRoutes } from "./lib/routePreload";
import { getBuiltInAvatarUrls } from "./lib/avatar";

const SELECTED_COLLEGE_STORAGE_KEY = "campuskart-selected-college";
const STARTUP_IMAGE_PRELOAD_COUNT = 4;
const STARTUP_LISTING_FETCH_LIMIT = 12;

function ResponsiveToaster() {
  const [showCloseButton, setShowCloseButton] = useState(false);
  const { theme } = useThemeMode();

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    const sync = () => setShowCloseButton(mediaQuery.matches);

    sync();
    mediaQuery.addEventListener("change", sync);
    return () => mediaQuery.removeEventListener("change", sync);
  }, []);

  return <Toaster richColors theme={theme} position="top-right" closeButton={showCloseButton} />;
}

function AppBootScreen() {
  const brandLogoSrc = `${import.meta.env.BASE_URL}campuskart-logo.jpeg`;

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] flex select-none items-center justify-center bg-background">
      <div className="relative px-6">
        <div className="absolute left-1/2 top-1/2 -z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,hsla(210,88%,46%,0.28)_0%,hsla(208,90%,56%,0.16)_24%,hsla(206,92%,60%,0.08)_46%,hsla(206,92%,60%,0.03)_66%,transparent_82%)] blur-2xl sm:h-80 sm:w-80" />
        <div className="glass flex min-w-[272px] max-w-[84vw] flex-col items-center rounded-[24px] border-white/50 px-5 py-5 shadow-[0_18px_50px_hsla(210,78%,50%,0.08)] sm:min-w-[352px] sm:px-7 sm:py-6">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <img
              src={brandLogoSrc}
              alt="CampusKart logo"
              loading="eager"
              fetchPriority="high"
              decoding="sync"
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

  useEffect(() => {
    return installGlobalErrorTracking();
  }, []);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;
    let institutionIdleId: number | undefined;
    let institutionTimeoutId: number | undefined;

    const preloadImage = (src: string, priority: "high" | "auto" = "auto") => {
      if (!src) return;
      const image = new Image();
      image.decoding = "async";
      image.fetchPriority = priority;
      image.src = src;
    };

    const warmStartup = async () => {
      preloadImage(`${import.meta.env.BASE_URL}campuskart-logo.jpeg`, "high");
      preloadImage(`${import.meta.env.BASE_URL}campus-hero-mobile.jpg`, "high");
      preloadImage(`${import.meta.env.BASE_URL}campus-hero-desktop.jpg`, "high");
      preloadImage(heroMobilePlaceholder, "high");
      preloadImage(heroDesktopPlaceholder, "high");

      getBuiltInListingImageUrls().forEach((src) => preloadImage(src));
      getBuiltInAvatarUrls().forEach((src) => preloadImage(src));

      if (cancelled) return;

      const currentHash = window.location.hash || "#/";
      const isHomeRoute = currentHash === "#/" || currentHash === "#" || currentHash.startsWith("#/?");
      if (!isHomeRoute) return;

      const savedCollege = localStorage.getItem(SELECTED_COLLEGE_STORAGE_KEY);
      if (!savedCollege) return;

      const canonicalCollege = canonicalInstitutionName(savedCollege);
      const { data, error } = await supabase
        .from("listings")
        .select("id, category, images, moderation_status, created_at, college")
        .eq("college", canonicalCollege)
        .order("created_at", { ascending: false })
        .limit(STARTUP_LISTING_FETCH_LIMIT);

      if (cancelled || error || !data) return;

      data
        .filter((listing) => !["pending_review", "rejected"].includes(listing.moderation_status || "active"))
        .slice(0, STARTUP_IMAGE_PRELOAD_COUNT)
        .forEach((listing) => {
          const cover = getListingCoverImage(listing.category, listing.images || []);
          preloadImage(cover);
        });
    };

    void warmStartup();

    const warmInstitutions = () => {
      if (cancelled) return;
      void loadInstitutionNames();
    };

    const warmRoutes = () => {
      if (cancelled) return;
      preloadCommonRoutes();
    };

    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(warmRoutes, { timeout: 2200 });
      institutionIdleId = window.requestIdleCallback(warmInstitutions, { timeout: 3000 });
    } else {
      timeoutId = window.setTimeout(warmRoutes, 1800);
      institutionTimeoutId = window.setTimeout(warmInstitutions, 2400);
    }

    return () => {
      cancelled = true;
      if (typeof idleId === "number" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(idleId);
      }
      if (typeof institutionIdleId === "number" && "cancelIdleCallback" in window) {
        window.cancelIdleCallback(institutionIdleId);
      }
      if (typeof timeoutId === "number") {
        window.clearTimeout(timeoutId);
      }
      if (typeof institutionTimeoutId === "number") {
        window.clearTimeout(institutionTimeoutId);
      }
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
  <ThemeProvider>
    <AuthProvider>
      <AppErrorBoundary>
        <BootstrappedApp />
      </AppErrorBoundary>
    </AuthProvider>
  </ThemeProvider>
);
