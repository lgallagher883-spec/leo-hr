"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import {
  BadgeCheck,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CarFront,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  ContactRound,
  FileCheck2,
  FileSearch,
  FileText,
  GraduationCap,
  HeartPulse,
  LayoutDashboard,
  LifeBuoy,
  Library,
  LogOut,
  MessageCircle,
  Settings2,
  ShieldCheck,
  Sparkles,
  X,
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import styles from "./DashboardShell.module.css";

const SIDEBAR_WIDTH = 260;
const HELP_CENTRE_URL = "https://leo-hr.helpscoutdocs.com";

export type DashboardAccessRole =
  | "owner"
  | "senior"
  | "manager"
  | "employee";

export type DashboardBillingGuard = {
  hasPlatformAccess: boolean;
  billingRedirectPlanKey: "organisation_50" | "organisation_150" | "organisation_250" | null;
};

type NavigationIcon = ComponentType<{
  size?: number | string;
  strokeWidth?: number | string;
  "aria-hidden"?: boolean;
}>;

type NavigationLink = {
  label: string;
  href: string;
  icon: NavigationIcon;
  target?: string;
  rel?: string;
};

const managementMainLinks: NavigationLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Ask Leo",
    href: "/dashboard/ask-leo",
    icon: MessageCircle,
  },
  {
    label: "Matters",
    href: "/dashboard/matters",
    icon: BriefcaseBusiness,
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: Users,
  },
  {
    label: "Leo Talent",
    href: "/dashboard/leo-talent",
    icon: FileSearch,
  },
  {
    label: "Leo Learn",
    href: "/dashboard/leo-learn",
    icon: GraduationCap,
  },
  {
    label: "Compliance",
    href: "/dashboard/compliance",
    icon: ShieldCheck,
  },
  {
    label: "HR Resources",
    href: "/dashboard/policies",
    icon: FileText,
  },
  {
    label: "SAR Requests",
    href: "/dashboard/sar-requests",
    icon: Library,
  },
  {
    label: "Insights",
    href: "/dashboard/insights",
    icon: Sparkles,
  },
  {
    label: "Audit Logs",
    href: "/dashboard/audit-logs",
    icon: ClipboardCheck,
  },
  {
    label: "Foundations",
    href: "/dashboard/foundations",
    icon: Building2,
  },
  {
    label: "Welcome Brief",
    href: "/dashboard/welcome-brief",
    icon: BookOpen,
  },
];

const managementAccountLinks: NavigationLink[] = [
  {
    label: "My Account",
    href: "/dashboard/my-account",
    icon: CircleUserRound,
  },
  {
    label: "Organisation",
    href: "/dashboard/organisation",
    icon: Settings2,
  },
  {
    label: "Help & Support",
    href: HELP_CENTRE_URL,
    icon: LifeBuoy,
    target: "_blank",
    rel: "noopener noreferrer",
  },
];

const employeeMainLinks: NavigationLink[] = [
  {
    label: "Dashboard",
    href: "/dashboard/employee",
    icon: LayoutDashboard,
  },
  {
    label: "My Employment",
    href: "/dashboard/my-employment",
    icon: BriefcaseBusiness,
  },
  {
    label: "My Leave",
    href: "/dashboard/my-employment/leave",
    icon: CalendarDays,
  },
  {
    label: "My Learning",
    href: "/dashboard/my-employment/learning",
    icon: GraduationCap,
  },
  {
    label: "My Documents",
    href: "/dashboard/my-employment/documents",
    icon: FileText,
  },
  {
    label: "Upcoming Reviews",
    href: "/dashboard/my-employment/reviews",
    icon: ClipboardCheck,
  },
  {
    label: "Emergency Contacts",
    href: "/dashboard/my-employment/emergency-contacts",
    icon: ContactRound,
  },
  {
    label: "Medical",
    href: "/dashboard/my-employment/medical",
    icon: HeartPulse,
  },
  {
    label: "Right to Work",
    href: "/dashboard/my-employment/right-to-work",
    icon: FileCheck2,
  },
  {
    label: "DBS",
    href: "/dashboard/my-employment/dbs-safeguarding",
    icon: BadgeCheck,
  },
  {
    label: "Driving",
    href: "/dashboard/my-employment/driving",
    icon: CarFront,
  },
];

const employeeAccountLinks: NavigationLink[] = [
  {
    label: "My Account",
    href: "/dashboard/my-account",
    icon: CircleUserRound,
  },
  {
    label: "Help & Support",
    href: HELP_CENTRE_URL,
    icon: LifeBuoy,
    target: "_blank",
    rel: "noopener noreferrer",
  },
];

const employeeMobileMoreLinks: NavigationLink[] = [
  { label: "My Learning", href: "/dashboard/my-employment/learning", icon: GraduationCap },
  { label: "Upcoming Reviews", href: "/dashboard/my-employment/reviews", icon: ClipboardCheck },
  { label: "Emergency Contacts", href: "/dashboard/my-employment/emergency-contacts", icon: ContactRound },
  { label: "Medical", href: "/dashboard/my-employment/medical", icon: HeartPulse },
  { label: "Right to Work", href: "/dashboard/my-employment/right-to-work", icon: FileCheck2 },
  { label: "DBS", href: "/dashboard/my-employment/dbs-safeguarding", icon: BadgeCheck },
  { label: "Driving", href: "/dashboard/my-employment/driving", icon: CarFront },
  { label: "My Account", href: "/dashboard/my-account", icon: CircleUserRound },
  { label: "Help & Support", href: HELP_CENTRE_URL, icon: LifeBuoy, target: "_blank", rel: "noopener noreferrer" },
];

const employeeMobilePrimaryLinks: NavigationLink[] = [
  { label: "Home", href: "/dashboard/employee", icon: LayoutDashboard },
  { label: "Employment", href: "/dashboard/my-employment", icon: BriefcaseBusiness },
  { label: "Leave", href: "/dashboard/my-employment/leave", icon: CalendarDays },
  { label: "Docs", href: "/dashboard/my-employment/documents", icon: FileText },
];

const employeeAllowedRoutes = [
  "/dashboard/employee",
  "/dashboard/my-employment",
  "/dashboard/my-account",
  "/dashboard/access-unavailable",
];

function routeIsWithin(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isEmployeeRouteAllowed(pathname: string) {
  return employeeAllowedRoutes.some((route) =>
    routeIsWithin(pathname, route),
  );
}

export default function DashboardShell({
  children,
  accessRole,
  billingGuard,
  organisationId: _organisationId,
  organisationName,
  userId: _userId,
}: {
  children: ReactNode;
  accessRole: DashboardAccessRole;
  billingGuard: DashboardBillingGuard;
  organisationId: string | null;
  organisationName: string | null;
  userId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isResolvingRoute, setIsResolvingRoute] = useState(true);
  const [isMobileMoreOpen, setIsMobileMoreOpen] = useState(false);

  const isEmployee = accessRole === "employee";
  const mainLinks = isEmployee ? employeeMainLinks : managementMainLinks;
  const accountLinks = isEmployee
    ? employeeAccountLinks
    : managementAccountLinks;

  useEffect(() => {
    if (!isMobileMoreOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileMoreOpen(false);
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMoreOpen]);

  useEffect(() => {
    function openMobileMore() {
      setIsMobileMoreOpen(true);
    }

    window.addEventListener("leo:open-employee-mobile-more", openMobileMore);
    return () =>
      window.removeEventListener("leo:open-employee-mobile-more", openMobileMore);
  }, []);

  useEffect(() => {
    const blockedDestination =
      accessRole === "owner" || accessRole === "senior"
        ? "/dashboard/billing"
        : "/dashboard/access-unavailable";

    if (
      !billingGuard.hasPlatformAccess &&
      !routeIsWithin(pathname, blockedDestination)
    ) {
      router.replace(blockedDestination);
      return;
    }

    if (isEmployee) {
      if (
        pathname === "/dashboard" ||
        !isEmployeeRouteAllowed(pathname)
      ) {
        router.replace("/dashboard/employee");
        return;
      }

      setIsResolvingRoute(false);
      return;
    }

    if (pathname === "/dashboard/employee") {
      router.replace("/dashboard");
      return;
    }

    setIsResolvingRoute(false);
  }, [accessRole, billingGuard, isEmployee, pathname, router]);

  function isActive(href: string) {
    if (href === "/dashboard") {
      return pathname === "/dashboard";
    }

    if (href === "/dashboard/employee") {
      return pathname === "/dashboard/employee";
    }

    return routeIsWithin(pathname, href);
  }

  async function handleSignOut() {
    if (isSigningOut) {
      return;
    }

    setIsSigningOut(true);
    setSignOutError(null);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace("/login");
      router.refresh();
    } catch (error) {
      console.error("LEO sign-out failed:", error);

      setSignOutError(
        error instanceof Error
          ? error.message
          : "LEO could not sign you out. Please try again.",
      );

      setIsSigningOut(false);
    }
  }

  return (
    <div
      className={styles.shell}
      style={{
        minHeight: "100vh",
        fontFamily:
          '"Segoe UI", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif',
        background: "#F5FFF9",
        color: "#2F2635",
      }}
    >
        {isEmployee ? (
          <>
            <header className={styles.mobileTopBar}>
              <Image src="/logo.png" alt="Leo HR" width={84} height={48} priority className={styles.mobileLogo} />
              <p className={styles.mobileOrganisationName} title={organisationName ?? undefined}>
                {organisationName ?? "Leo HR"}
              </p>
              <button
                type="button"
                className={styles.mobileAccountButton}
                aria-label="Open account and more navigation"
                aria-expanded={isMobileMoreOpen}
                aria-controls="employee-mobile-more-sheet"
                onClick={() => setIsMobileMoreOpen(true)}
              >
                <CircleUserRound size={23} strokeWidth={1.8} aria-hidden />
              </button>
            </header>

            <nav className={styles.mobileBottomNavigation} aria-label="Employee primary navigation">
              {employeeMobilePrimaryLinks.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);
                return (
                  <Link key={href} href={href} className={`${styles.mobileNavigationLink} ${active ? styles.mobileNavigationLinkActive : ""}`} aria-current={active ? "page" : undefined}>
                    <Icon size={21} strokeWidth={active ? 2.1 : 1.8} aria-hidden />
                    <span>{label}</span>
                  </Link>
                );
              })}
              <button
                type="button"
                className={`${styles.mobileNavigationLink} ${isMobileMoreOpen ? styles.mobileNavigationLinkActive : ""}`}
                aria-label="Open more employee navigation"
                aria-expanded={isMobileMoreOpen}
                aria-controls="employee-mobile-more-sheet"
                onClick={() => setIsMobileMoreOpen(true)}
              >
                <CircleUserRound size={21} strokeWidth={isMobileMoreOpen ? 2.1 : 1.8} aria-hidden />
                <span>More</span>
              </button>
            </nav>

            {isMobileMoreOpen ? (
              <div className={styles.mobileMoreLayer} role="presentation">
                <button type="button" className={styles.mobileMoreBackdrop} aria-label="Close more navigation" onClick={() => setIsMobileMoreOpen(false)} />
                <section id="employee-mobile-more-sheet" className={styles.mobileMoreSheet} role="dialog" aria-modal="true" aria-label="More employee navigation">
                  <div className={styles.mobileMoreSheetHeader}>
                    <h2>More</h2>
                    <button type="button" className={styles.mobileCloseButton} aria-label="Close more navigation" onClick={() => setIsMobileMoreOpen(false)}>
                      <X size={22} strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                  <nav className={styles.mobileMoreLinks} aria-label="More employee destinations">
                    {employeeMobileMoreLinks.map(({ label, href, icon: Icon, target, rel }) => (
                      <Link key={href} href={href} target={target} rel={rel} className={styles.mobileMoreLink} onClick={() => setIsMobileMoreOpen(false)}>
                        <Icon size={20} strokeWidth={1.8} aria-hidden />
                        <span>{label}</span>
                        <ChevronRight size={18} strokeWidth={1.8} aria-hidden />
                      </Link>
                    ))}
                  </nav>
                </section>
              </div>
            ) : null}
          </>
        ) : null}

        <aside
          className={styles.desktopSidebar}
          aria-label={
            isEmployee
              ? "LEO employee navigation"
              : "LEO dashboard navigation"
          }
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            bottom: 0,
            zIndex: 40,
            width: `${SIDEBAR_WIDTH}px`,
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "#FFFFFF",
            borderRight: "1px solid #E8E2EB",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              height: "78px",
              padding: "8px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#FFFFFF",
              boxSizing: "border-box",
            }}
          >
            <Image
              src="/logo.png"
              alt="LEO HR"
              width={190}
              height={64}
              priority
              style={{
                display: "block",
                width: "100%",
                maxWidth: "190px",
                height: "64px",
                objectFit: "contain",
              }}
            />
          </div>

          <nav
            aria-label="Main navigation"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              padding: "2px 12px 6px",
              scrollbarWidth: "thin",
              scrollbarColor: "#D8C9E1 transparent",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
              }}
            >
              {mainLinks.map(({ label, href, icon: Icon }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    style={{
                      minHeight: "36px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "7px 11px",
                      borderRadius: "8px",
                      color: active ? "#6E5084" : "#3E3444",
                      background: active ? "#F0DFFD" : "transparent",
                      border: "1px solid transparent",
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: active ? 650 : 500,
                      lineHeight: 1.35,
                      letterSpacing: "-0.01em",
                      boxSizing: "border-box",
                      transition:
                        "background-color 150ms ease, color 150ms ease",
                    }}
                    onMouseEnter={(event) => {
                      if (!active) {
                        event.currentTarget.style.background = "#FAF7FC";
                        event.currentTarget.style.color = "#6E5084";
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!active) {
                        event.currentTarget.style.background = "transparent";
                        event.currentTarget.style.color = "#3E3444";
                      }
                    }}
                  >
                    <Icon size={18} strokeWidth={1.8} aria-hidden />
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          <div
            style={{
              flexShrink: 0,
              padding: "4px 12px 6px",
              background: "#FFFFFF",
              borderTop: "1px solid #E8E2EB",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0px",
              }}
            >
              {accountLinks.map(({ label, href, icon: Icon, target, rel }) => {
                const active = isActive(href);

                return (
                  <Link
                    key={href}
                    href={href}
                    target={target}
                    rel={rel}
                    aria-current={active ? "page" : undefined}
                    style={{
                      minHeight: "34px",
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "6px 11px",
                      borderRadius: "8px",
                      color: active ? "#6E5084" : "#3E3444",
                      background: active ? "#F0DFFD" : "transparent",
                      border: "1px solid transparent",
                      textDecoration: "none",
                      fontSize: "14px",
                      fontWeight: active ? 650 : 500,
                      lineHeight: 1.35,
                      letterSpacing: "-0.01em",
                      boxSizing: "border-box",
                    }}
                    onMouseEnter={(event) => {
                      if (!active) {
                        event.currentTarget.style.background = "#FAF7FC";
                        event.currentTarget.style.color = "#6E5084";
                      }
                    }}
                    onMouseLeave={(event) => {
                      if (!active) {
                        event.currentTarget.style.background = "transparent";
                        event.currentTarget.style.color = "#3E3444";
                      }
                    }}
                  >
                    <Icon size={18} strokeWidth={1.8} aria-hidden />
                    <span>{label}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={handleSignOut}
                disabled={isSigningOut}
                style={{
                  minHeight: "34px",
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "6px 11px",
                  borderRadius: "8px",
                  border: "1px solid transparent",
                  background: "transparent",
                  color: isSigningOut ? "#9CA3AF" : "#3E3444",
                  textAlign: "left",
                  font: "inherit",
                  fontSize: "14px",
                  fontWeight: 500,
                  lineHeight: 1.35,
                  letterSpacing: "-0.01em",
                  cursor: isSigningOut ? "not-allowed" : "pointer",
                  boxSizing: "border-box",
                }}
                onMouseEnter={(event) => {
                  if (!isSigningOut) {
                    event.currentTarget.style.background = "#FFF7F7";
                    event.currentTarget.style.color = "#9F3A3A";
                  }
                }}
                onMouseLeave={(event) => {
                  if (!isSigningOut) {
                    event.currentTarget.style.background = "transparent";
                    event.currentTarget.style.color = "#3E3444";
                  }
                }}
              >
                <LogOut size={18} strokeWidth={1.8} aria-hidden />
                <span>{isSigningOut ? "Signing out…" : "Sign out"}</span>
              </button>

              {signOutError ? (
                <p
                  role="alert"
                  style={{
                    margin: "6px 4px 0",
                    color: "#9F3A3A",
                    fontSize: "12px",
                    lineHeight: 1.45,
                  }}
                >
                  {signOutError}
                </p>
              ) : null}
            </div>
          </div>
        </aside>

        <main
          className={styles.dashboardContent}
          style={{
            minHeight: "100vh",
            marginLeft: `${SIDEBAR_WIDTH}px`,
            padding: "30px",
            background: "#F5FFF9",
            boxSizing: "border-box",
          }}
        >
          {isResolvingRoute ? (
            <div
              role="status"
              aria-live="polite"
              style={{
                minHeight: "calc(100vh - 60px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  padding: "18px 22px",
                  borderRadius: "14px",
                  background: "#FFFFFF",
                  border: "1px solid #E8E2EB",
                  color: "#6E5084",
                  fontSize: "14px",
                  fontWeight: 700,
                  boxShadow: "0 8px 22px rgba(17, 24, 39, 0.05)",
                }}
              >
                Opening your LEO workspace…
              </div>
            </div>
          ) : (
            children
          )}
        </main>
    </div>
  );
}