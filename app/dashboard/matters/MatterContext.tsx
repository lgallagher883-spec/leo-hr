"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type Matter = {
  id: number;
  title: string;
  status: string;
  description?: string;
  employee_id?: number | null;
  matter_type?: string | null;
  subject?: string | null;
  matter_lead?: string | null;
  created_at?: string | null;
};

type NewMatterInput = {
  title: string;
  description?: string;
  employeeId?: number | null;
  matterType?: string | null;
  subject?: string | null;
  matterLead?: string | null;
};

type MatterContextType = {
  matters: Matter[];
  setMatters: React.Dispatch<React.SetStateAction<Matter[]>>;
  addMatter: (
    titleOrMatter: string | NewMatterInput,
    description?: string,
    employeeId?: number | null,
  ) => Promise<Matter | null>;
};

type MattersApiResponse = {
  success: boolean;
  matters?: Matter[];
  matter?: Matter;
  error?: string;
};

const MatterContext = createContext<MatterContextType | undefined>(undefined);

export function MatterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [matters, setMatters] = useState<Matter[]>([]);

  useEffect(() => {
    let active = true;

    async function loadMatters() {
      try {
        const response = await fetch("/api/matters", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        const result = (await response.json()) as MattersApiResponse;

        if (!active) return;

        if (!response.ok || !result.success) {
          if (response.status === 401 || response.status === 403) {
            setMatters([]);
            return;
          }

          console.error(
            "Error loading matters:",
            result.error || `Request failed with status ${response.status}`,
          );
          setMatters([]);
          return;
        }

        setMatters(result.matters || []);
      } catch (error) {
        if (!active) return;

        console.error("Error loading matters:", error);
        setMatters([]);
      }
    }

    void loadMatters();

    return () => {
      active = false;
    };
  }, []);

  async function addMatter(
    titleOrMatter: string | NewMatterInput,
    description?: string,
    employeeId?: number | null,
  ): Promise<Matter | null> {
    const matter: NewMatterInput =
      typeof titleOrMatter === "string"
        ? {
            title: titleOrMatter,
            description: description || "",
            employeeId: employeeId ?? null,
            matterType: null,
            subject: titleOrMatter,
            matterLead: null,
          }
        : titleOrMatter;

    try {
      const response = await fetch("/api/matters", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: matter.title,
          description: matter.description || "",
          employeeId: matter.employeeId ?? null,
          matterType: matter.matterType ?? null,
          subject: matter.subject || matter.title,
          matterLead: matter.matterLead || null,
        }),
      });

      const result = (await response.json()) as MattersApiResponse;

      if (!response.ok || !result.success || !result.matter) {
        console.error(
          "Matter could not be saved:",
          result.error || `Request failed with status ${response.status}`,
        );

        alert(
          `Matter could not be saved: ${
            result.error || "Unknown error"
          }`,
        );

        return null;
      }

      setMatters((previous) => [result.matter as Matter, ...previous]);

      return result.matter;
    } catch (error) {
      console.error("Matter could not be saved:", error);

      alert(
        `Matter could not be saved: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );

      return null;
    }
  }

  return (
    <MatterContext.Provider
      value={{
        matters,
        setMatters,
        addMatter,
      }}
    >
      {children}
    </MatterContext.Provider>
  );
}

export function useMatters() {
  const context = useContext(MatterContext);

  if (!context) {
    throw new Error("useMatters must be used inside MatterProvider");
  }

  return context;
}