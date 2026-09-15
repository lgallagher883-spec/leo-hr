export type OnboardingConditionalItem = "dbs" | "equipment" | "learning";

export type OnboardingTemplate = {
  key: string;
  name: string;
  category: string;
  description: string;
  ownerType: "candidate" | "hr" | "employer" | "manager";
  dueOffsetDays: number;
  candidateVisible: boolean;
  candidateEditable: boolean;
  mandatory: boolean;
  conditional?: OnboardingConditionalItem;
};

export type OnboardingTemplateOptions = {
  includeDbs: boolean;
  includeEquipment: boolean;
  includeLearning: boolean;
};

export const onboardingItemTemplates: OnboardingTemplate[] = [
  { key: "candidate_details", name: "Complete starter details", category: "candidate_details", description: "Confirm the starter information required for the employment record.", ownerType: "candidate", dueOffsetDays: -5, candidateVisible: true, candidateEditable: true, mandatory: true },
  { key: "right_to_work", name: "Confirm right to work", category: "safer_recruitment", description: "Complete and record the required right to work check before employment begins.", ownerType: "hr", dueOffsetDays: -7, candidateVisible: false, candidateEditable: false, mandatory: true },
  { key: "references", name: "Confirm references", category: "safer_recruitment", description: "Confirm required references and record telephone verification where applicable.", ownerType: "hr", dueOffsetDays: -7, candidateVisible: false, candidateEditable: false, mandatory: true },
  { key: "dbs_clearance", name: "Confirm DBS or safeguarding clearance", category: "safer_recruitment", description: "Complete the required DBS, barred-list or safeguarding checks for the role.", ownerType: "hr", dueOffsetDays: -5, candidateVisible: false, candidateEditable: false, mandatory: true, conditional: "dbs" },
  { key: "contract_issue", name: "Issue employment contract", category: "documents", description: "Issue the contract and written particulars using the agreed employment terms.", ownerType: "hr", dueOffsetDays: -10, candidateVisible: true, candidateEditable: false, mandatory: true },
  { key: "contract_signature", name: "Receive signed employment contract", category: "documents", description: "Confirm the signed contract has been received and stored.", ownerType: "candidate", dueOffsetDays: -2, candidateVisible: true, candidateEditable: true, mandatory: true },
  { key: "payroll_information", name: "Collect payroll information", category: "payroll", description: "Collect bank and tax information through the approved secure process.", ownerType: "candidate", dueOffsetDays: -5, candidateVisible: true, candidateEditable: true, mandatory: true },
  { key: "payroll_setup", name: "Add starter to payroll", category: "payroll", description: "Complete payroll setup and confirm the first payroll cut-off.", ownerType: "employer", dueOffsetDays: -2, candidateVisible: false, candidateEditable: false, mandatory: true },
  { key: "equipment", name: "Prepare equipment", category: "equipment", description: "Prepare and allocate the equipment required for the role.", ownerType: "manager", dueOffsetDays: -2, candidateVisible: false, candidateEditable: false, mandatory: true, conditional: "equipment" },
  { key: "mandatory_learning", name: "Assign mandatory learning", category: "learning", description: "Assign organisation-wide and role-specific learning in Leo Learn.", ownerType: "hr", dueOffsetDays: -1, candidateVisible: true, candidateEditable: false, mandatory: true, conditional: "learning" },
  { key: "first_day_arrangements", name: "Confirm commencement arrangements", category: "induction", description: "Confirm the date of commencement, reporting arrangements, location and key contacts.", ownerType: "manager", dueOffsetDays: -3, candidateVisible: true, candidateEditable: false, mandatory: true },
];

export function addOnboardingDays(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) {
    throw new Error("The onboarding start date is invalid.");
  }
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getOnboardingTemplates(options: OnboardingTemplateOptions) {
  return onboardingItemTemplates.filter((template) => {
    if (template.conditional === "dbs") return options.includeDbs;
    if (template.conditional === "equipment") return options.includeEquipment;
    if (template.conditional === "learning") return options.includeLearning;
    return true;
  });
}
