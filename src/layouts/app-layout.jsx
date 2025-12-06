import Header from "@/components/header";
import { Github } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

const AppLayout = () => {
  return (
    <div className="app-bg-canvas">
      <div className="app-bg-aurora" aria-hidden="true"></div>
      <div className="app-bg-grid" aria-hidden="true"></div>
      <div className="app-glass-shell min-h-screen flex flex-col gap-12">
        <Header />
        <main className="flex-1">
          <Outlet />
        </main>
        <footer className="mx-auto mb-2 mt-auto w-full max-w-5xl pt-2">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 px-4 py-4 text-white shadow-[0_32px_80px_-40px_rgba(8,15,40,0.9)] backdrop-blur-2xl">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-sky-500/20 via-cyan-400/10 to-fuchsia-500/20 opacity-70"></div>
            <div className="relative flex flex-col items-center gap-3 text-center">
              <p className="text-sm font-medium tracking-wide sm:text-base">
                2025 © All rights reserved.
              </p>
              <p className="text-sm font-medium tracking-wide sm:text-base">
                Crafted with <span className="text-pink-300">❤</span> by{" "}
                <span className="font-semibold text-indigo-300">@Sjx</span>
              </p>
              <Link
                className="relative inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-900/30 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-sky-300/60 hover:text-sky-200"
                to="https://github.com/SjxSubham/JOB-SEEK"
              >
                <Github color="#9fbad2" strokeWidth={1} />
                Github
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AppLayout;
