import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 text-white">
      <div className="max-w-lg rounded-[32px] border border-white/10 bg-white/5 p-10 text-center backdrop-blur-xl">
        <p className="mb-3 text-sm uppercase tracking-[0.32em] text-[#fdb927]">Route unavailable</p>
        <h1 className="mb-4 text-5xl font-black tracking-tight">404</h1>
        <p className="mb-6 text-lg text-slate-300">This page does not exist in the current CampusKart experience.</p>
        <Button asChild className="rounded-full bg-[#fdb927] px-6 text-slate-950 hover:bg-[#ffd15c]">
          <a href="#/">Return home</a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
