import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, useSearchParams } from "react-router-dom";
import {
  SignedIn,
  SignedOut,
  UserButton,
  SignIn,
  useUser,
} from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { BriefcaseBusiness, CornerLeftUp, Heart, PenBox, Shell, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

const Header = () => {
  const [showSignIn, setShowSignIn] = useState(false);

  const [search, setSearch] = useSearchParams();
  const { user } = useUser();

  useEffect(() => {
    if (search.get("sign-in")) {
      setShowSignIn(true);
    }
  }, [search]);

  useEffect(() => {
    if (!showSignIn) {
      document.body.style.overflow = "";
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showSignIn]);

  const navigationLinks = useMemo(
    () => [
      { label: "Discover", path: "/jobs" },
      { label: "My Jobs", path: "/my-jobs" },
      { label: "Saved", path: "/saved-jobs" },
    ],
    [],
  );

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      setShowSignIn(false);
      setSearch({});
    }
  };

  const renderNavLink = ({ path, label }) => (
    <NavLink
      key={path}
      to={path}
      className={({ isActive }) =>
        cn(
          "group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-300",
          "hover:text-sky-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/60",
          isActive ? "text-sky-200" : "text-slate-400/90",
        )
      }
    >
      <span
        className={cn(
          "absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-sky-500/30 via-cyan-400/20 to-fuchsia-500/30 opacity-0 blur-sm transition duration-300",
          "group-hover:opacity-100",
        )}
      />
      {label}
    </NavLink>
  );

  return (
    <>
      <nav className="relative flex flex-col gap-4">
        <div className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-3xl border border-white/15 bg-slate-950/40 px-5 py-4 shadow-[0_24px_60px_-28px_rgba(8,15,40,0.95)] backdrop-blur-2xl">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-sky-500/20 via-cyan-400/10 to-fuchsia-500/20 opacity-80" />
          <Link
            to="/"
            className="group relative flex items-center gap-3 rounded-full bg-white/0 px-3 py-2 text-white transition hover:bg-white/5"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/80 via-cyan-400/70 to-violet-500/80 shadow-lg shadow-sky-500/30">
              <PenBox size={20} className="text-black" />
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-semibold tracking-wide text-sky-100">
                JOB-SEEK
              </span>
              <span className="flex items-center gap-1 text-xs font-medium text-slate-300/80">
                <CornerLeftUp size={14} className="text-cyan-300" />
                Match talent faster
              </span>
            </div>
          </Link>

          <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-slate-900/30 px-2 py-2 md:flex">
            {navigationLinks.map(renderNavLink)}
          </div>

          <div className="flex items-center gap-3">
            <SignedOut>
              <Button
                variant="outline"
                className="app-button-glow border-white/20 text-slate-200"
                onClick={() => setShowSignIn(true)}
              >
                Login
              </Button>
            </SignedOut>
            <SignedIn>
              {user?.unsafeMetadata?.role === "recruiter" && (
                <Link to="/post-job" className="hidden md:block">
                  <Button
                    size="lg"
                    className="app-button-glow border border-sky-400/40 bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-[0_20px_40px_-24px_rgba(56,189,248,0.75)]"
                  >
                    <PenBox size={18} className="mr-2" />
                    Post a Job
                  </Button>
                </Link>
              )}
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-10 h-10",
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Link
                    label="My Jobs"
                    labelIcon={<BriefcaseBusiness size={15} />}
                    href="/my-jobs"
                  />
                  <UserButton.Link
                    label="Saved Jobs"
                    labelIcon={<Heart size={15} />}
                    href="/saved-jobs"
                  />
                  <UserButton.Link
                    label="Profile"
                    labelIcon={<User size={15} />}
                    href="/profile-page"
                  />
                  <UserButton.Action label="manageAccount" />
                </UserButton.MenuItems>
              </UserButton>
            </SignedIn>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 md:hidden">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/30 p-2">
            {navigationLinks.map(renderNavLink)}
          </div>
          {user?.unsafeMetadata?.role === "recruiter" && (
            <Link to="/post-job">
              <Button
                size="sm"
                className="app-button-glow border border-sky-400/40 bg-gradient-to-r from-sky-500 to-cyan-500 text-xs font-semibold uppercase tracking-wide text-white"
              >
                Post Job
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {showSignIn && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 py-6"
          onClick={handleOverlayClick}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md"
            onClick={(event) => event.stopPropagation()}
          >
            <SignIn
              appearance={{
                layout: {
                  socialButtonsPlacement: "top",
                  socialButtonsVariant: "iconButton",
                },
                elements: {
                  card: "w-full rounded-lg border border-slate-200 bg-gray-400 p-6 text-slate-300 shadow-2xl",
                  headerTitle: "text-slate-900",
                  headerSubtitle: "text-slate-700",
                  formButtonPrimary:
                    "app-button-glow border border-sky-400/40 bg-gradient-to-r from-sky-500 to-cyan-500 text-white",
                  footerActionLink: "text-sky-500 hover:text-sky-600",
                },
              }}
              signUpForceRedirectUrl="/onboarding"
              fallbackRedirectUrl="/onboarding"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
