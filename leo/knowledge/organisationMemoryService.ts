import { OrganisationMemoryItem } from "./organisationMemory";

export type OrganisationMemoryServiceRecord = {
  id: string;
  organisation_id: string;
  title: string;
  content: string;
  category: string | null;
  keywords: string[] | null;
  source: string | null;
  status: string | null;
  is_active: boolean;
};

export function mapOrganisationMemoryRecords(
  records: OrganisationMemoryServiceRecord[] = []
): OrganisationMemoryItem[] {
  return records
    .filter((record) => record.is_active !== false)
    .map((record) => ({
      id: record.id,
      organisationId: record.organisation_id,
      type: "operational_rule",
      title: record.title,
      content: record.content,
      keywords: Array.isArray(record.keywords) ? record.keywords : [],
      active: true,
      source: "user_instruction",
      createdAt: undefined,
      updatedAt: undefined,
    }));
}
