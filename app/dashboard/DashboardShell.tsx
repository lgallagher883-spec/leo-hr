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
  CircleUserRound,
  ClipboardCheck,
  ContactRound,
  FileCheck2,
  FileHeart,
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
  Users,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

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
    label: "Ask Leo",
    href: "/dashboard/ask-leo",
    icon: MessageCircle,
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
    label: "Medical & Fit Notes",
    href: "/dashboard/my-employment/medical",
    icon: HeartPulse,
  },
  {
    label: "Right to Work",
    href: "/dashboard/my-employment/right-to-work",
    icon: FileCheck2,
  },
  {
    label: "DBS & Safeguarding",
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
];

const employeeAllowedRoutes = [
  "/dashboard/employee",
  "/dashboard/ask-leo",
  "/dashboard/my-employment",
  "/dashboard/my-account",
];

const billingAllowedRoutes = [
  "/dashboard/billing",
  "/dashboard/my-account",
];

function routeIsWithin(pathname: string, route: string) {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function isEmployeeRouteAllowed(pathname: string) {
  return employeeAllowedRoutes.some((route) =>
    routeIsWithin(pathname, route),
  );
}

function isBillingRouteAllowed(pathname: string) {
  return billingAllowedRoutes.some((route) =>
    routeIsWithin(pathname, route),
  );
}

export default function DashboardShell({
  children,
  accessRole,
  billingGuard,
  organisationId: _organisationId,
  userId: _userId,
}: {
  children: ReactNode;
  accessRole: DashboardAccessRole;
  billingGuard: DashboardBillingGuard;
  organisationId: string | null;
  userId: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isResolvingRoute, setIsResolvingRoute] = useState(true);

  const isEmployee = accessRole === "employee";
  const mainLinks = isEmployee ? employeeMainLinks : managementMainLinks;
  const accountLinks = isEmployee
    ? employeeAccountLinks
    : managementAccountLinks;

  useEffect(() => {
    if (!billingGuard.hasPlatformAccess && !isBillingRouteAllowed(pathname)) {
      const target = billingGuard.billingRedirectPlanKey
        ? `/dashboard/billing?autostart=${billingGuard.billingRedirectPlanKey}`
        : "/dashboard/billing";

      router.replace(target);
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
  }, [billingGuard, isEmployee, pathname, router]);

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
      style={{
        minHeight: "100vh",
        fontFamily:
          '"Segoe UI", Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Arial, sans-serif',
        background: "#F5FFF9",
        color: "#2F2635",
      }}
    >
        <aside
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

          {isEmployee ? (
            <div
              style={{
                flexShrink: 0,
                margin: "0 12px 8px",
                padding: "10px 12px",
                borderRadius: "10px",
                background: "#F7F1FC",
                border: "1px solid #E9D5FF",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "9px",
                  color: "#6E5084",
                }}
              >
                <FileHeart size={17} strokeWidth={1.8} aria-hidden />
                <span
                  style={{
                    fontSize: "12px",
                    lineHeight: 1.35,
                    fontWeight: 750,
                    letterSpacing: "0.02em",
                  }}
                >
                  Employee workspace
                </span>
              </div>
            </div>
          ) : null}

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