export type MatterStatus =
  | "open"
  | "in_review"
  | "escalated"
  | "closed";

export type MatterRisk =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type Matter = {
  id: string;
  title: string;
  description: string;
  intent: string;
  risk: MatterRisk;
  status: MatterStatus;
  createdAt: string;
  updatedAt: string;
};

const matters: Matter[] = [];

export function createMatter(input: Omit<Matter, "id" | "createdAt" | "updatedAt" | "status">): Matter {
  const matter: Matter = {
    id: `MAT-${Date.now()}`,
    status: "open",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...input
  };

  matters.push(matter);
  return matter;
}

export function getMatters(): Matter[] {
  return matters;
}

export function getMatterById(id: string): Matter | undefined {
  return matters.find(m => m.id === id);
}

export function updateMatter(id: string, updates: Partial<Matter>): Matter | undefined {
  const matter = matters.find(m => m.id === id);

  if (!matter) return undefined;

  Object.assign(matter, updates, {
    updatedAt: new Date().toISOString()
  });

  return matter;
}