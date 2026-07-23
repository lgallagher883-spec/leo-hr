"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { createClient } from "@/lib/supabase/client";

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

const MatterContext = createContext<MatterContextType | undefined>(undefined);

export function MatterProvider({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [matters, setMatters] = useState<Matter[]>([]);

  useEffect(() => {
    let active = true;

    async function loadMatters() {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!active) return;

      if (userError || !user) {
        console.error(
          "Error loading matters: no authenticated user session was available.",
          userError,
        );
        setMatters([]);
        return;
      }

      const { data, error } = await supabase
        .from("matters")
        .select(
          "id, title, status, description, employee_id, matter_type, subject, matter_lead, created_at",
        )
        .order("id", {
          ascending: false,
        });

      if (!active) return;

      if (error) {
        console.error(
          "Error loading matters:",
          JSON.stringify(error, null, 2),
        );
        setMatters([]);
        return;
      }

      setMatters(
        (data || []).map((matter) => ({
          id: matter.id,
          title: matter.title,
          status: matter.status || "Open",
          description: matter.description || "",
          employee_id: matter.employee_id ?? null,
          matter_type: matter.matter_type ?? null,
          subject: matter.subject ?? null,
          matter_lead: matter.matter_lead ?? null,
          created_at: matter.created_at ?? null,
        })),
      );
    }

    void loadMatters();

    return () => {
      active = false;
    };
  }, [supabase]);

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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(
        "Matter could not be saved because no authenticated user session was available.",
        userError,
      );

      alert("Matter could not be saved because your session is unavailable.");
      return null;
    }

    const { data, error } = await supabase
      .from("matters")
      .insert([
        {
          title: matter.title,
          status: "Open",
          description: matter.description || "",
          employee_id: matter.employeeId ?? null,
          matter_type: matter.matterType ?? null,
          subject: matter.subject || matter.title,
          matter_lead: matter.matterLead || null,
        },
      ])
      .select(
        "id, title, status, description, employee_id, matter_type, subject, matter_lead, created_at",
      )
      .single();

    if (error || !data) {
      console.error(
        "Supabase insert error:",
        JSON.stringify(error, null, 2),
      );

      alert(
        `Matter could not be saved: ${
          error?.message || "Unknown error"
        }`,
      );

      return null;
    }

    const newMatter: Matter = {
      id: data.id,
      title: data.title,
      status: data.status || "Open",
      description: data.description || "",
      employee_id: data.employee_id ?? null,
      matter_type: data.matter_type ?? null,
      subject: data.subject ?? null,
      matter_lead: data.matter_lead ?? null,
      created_at: data.created_at ?? null,
    };

    setMatters((previous) => [newMatter, ...previous]);

    return newMatter;
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