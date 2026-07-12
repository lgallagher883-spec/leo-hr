"use client";

import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

import { createClient } from "@supabase/supabase-js";

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
    employeeId?: number | null
  ) => Promise<void>;
};

const MatterContext = createContext<MatterContextType | undefined>(undefined);

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function MatterProvider({ children }: { children: ReactNode }) {
  const [matters, setMatters] = useState<Matter[]>([]);

  useEffect(() => {
    loadMatters();
  }, []);

  async function loadMatters() {
    const { data, error } = await supabase
      .from("matters")
      .select(
        "id, title, status, description, employee_id, matter_type, subject, matter_lead, created_at"
      )
      .order("id", { ascending: false });

    if (error) {
      console.error("Error loading matters:", JSON.stringify(error, null, 2));
      return;
    }

    setMatters(
      (data || []).map((m: any) => ({
        id: m.id,
        title: m.title,
        status: m.status || "Open",
        description: m.description || "",
        employee_id: m.employee_id || null,
        matter_type: m.matter_type || null,
        subject: m.subject || null,
        matter_lead: m.matter_lead || null,
        created_at: m.created_at || null,
      }))
    );
  }

  async function addMatter(
    titleOrMatter: string | NewMatterInput,
    description?: string,
    employeeId?: number | null
  ) {
    const matter: NewMatterInput =
      typeof titleOrMatter === "string"
        ? {
            title: titleOrMatter,
            description: description || "",
            employeeId: employeeId || null,
            matterType: null,
            subject: titleOrMatter,
            matterLead: null,
          }
        : titleOrMatter;

    const { data, error } = await supabase
      .from("matters")
      .insert([
        {
          title: matter.title,
          status: "Open",
          description: matter.description || "",
          employee_id: matter.employeeId || null,
          matter_type: matter.matterType || null,
          subject: matter.subject || matter.title,
          matter_lead: matter.matterLead || null,
        },
      ])
      .select(
        "id, title, status, description, employee_id, matter_type, subject, matter_lead, created_at"
      )
      .single();

    if (error) {
      console.error("Supabase insert error:", JSON.stringify(error, null, 2));
      alert(`Matter could not be saved: ${error.message || "Unknown error"}`);
      return;
    }

    const newMatter: Matter = {
      id: data.id,
      title: data.title,
      status: data.status || "Open",
      description: data.description || "",
      employee_id: data.employee_id || null,
      matter_type: data.matter_type || null,
      subject: data.subject || null,
      matter_lead: data.matter_lead || null,
      created_at: data.created_at || null,
    };

    setMatters((prev) => [newMatter, ...prev]);
  }

  return (
    <MatterContext.Provider value={{ matters, setMatters, addMatter }}>
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