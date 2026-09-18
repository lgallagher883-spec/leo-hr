export type MatterAdministrationEvidence = {
  source: "matter_timeline" | "matter_document" | "employee_record" | "manager";
  label: string;
  recordedAt?: string | null;
};

export type MatterAdministrationPlan = {
  maintainChronology: boolean;
  indexNewEvidence: boolean;
  identifyMissingProceduralInformation: boolean;
  prepareApprovedTemplates: boolean;
  refreshMatterBundle: boolean;
  advanceAdministrativeSteps: boolean;
  needsHumanInput: boolean;
  blockFindingOrCredibilityAssessment: boolean;
  blockSensitiveCorrespondence: boolean;
  blockProcessOutcome: boolean;
  blockDismissalExecution: boolean;
  evidence: MatterAdministrationEvidence[];
  reasons: string[];
};

function prepareTraceableMatterEvidence(
  evidence: MatterAdministrationEvidence[] = [],
): MatterAdministrationEvidence[] {
  const seen = new Set<string>();

  return evidence.flatMap((item) => {
    const label = item.label.trim();
    const recordedAt = item.recordedAt?.trim() || null;
    const key = `${item.source}:${label.toLocaleLowerCase()}:${recordedAt || ""}`;

    if (!label || seen.has(key)) return [];
    seen.add(key);

    return [{ source: item.source, label, recordedAt }];
  });
}

export function planMatterAdministration(args: {
  processOpen: boolean;
  newEvidenceAvailable: boolean;
  proceduralInformationComplete: boolean;
  approvedTemplateAvailable: boolean;
  administrativePrerequisitesSatisfied: boolean;
  bundleRefreshRequired: boolean;
  findingOrCredibilityAssessmentRequested: boolean;
  sensitiveCorrespondenceRequested: boolean;
  processOutcomeRequested: boolean;
  dismissalExecutionRequested: boolean;
  evidence?: MatterAdministrationEvidence[];
}): MatterAdministrationPlan {
  const reasons: string[] = [];

  if (!args.processOpen) reasons.push("No open HR process is available for administration.");
  if (args.processOpen && !args.proceduralInformationComplete) {
    reasons.push("Procedural information is missing and requires employer input.");
  }
  if (args.processOpen && !args.approvedTemplateAvailable) {
    reasons.push("No approved template is available for the requested administration.");
  }
  if (args.findingOrCredibilityAssessmentRequested) {
    reasons.push("Findings and credibility assessments require human judgement.");
  }
  if (args.sensitiveCorrespondenceRequested) {
    reasons.push("Sensitive correspondence requires human approval.");
  }
  if (args.processOutcomeRequested) {
    reasons.push("A disciplinary, grievance or other HR process outcome requires human judgement.");
  }
  if (args.dismissalExecutionRequested) {
    reasons.push("Dismissal execution is blocked.");
  }

  const judgementRequested =
    args.findingOrCredibilityAssessmentRequested ||
    args.sensitiveCorrespondenceRequested ||
    args.processOutcomeRequested ||
    args.dismissalExecutionRequested;

  return {
    maintainChronology: args.processOpen,
    indexNewEvidence: args.processOpen && args.newEvidenceAvailable,
    identifyMissingProceduralInformation: args.processOpen,
    prepareApprovedTemplates:
      args.processOpen &&
      args.approvedTemplateAvailable &&
      args.proceduralInformationComplete,
    refreshMatterBundle: args.processOpen && args.bundleRefreshRequired,
    advanceAdministrativeSteps:
      args.processOpen &&
      args.administrativePrerequisitesSatisfied &&
      args.proceduralInformationComplete &&
      !judgementRequested,
    needsHumanInput:
      (args.processOpen &&
        (!args.proceduralInformationComplete ||
          !args.approvedTemplateAvailable ||
          !args.administrativePrerequisitesSatisfied)) ||
      judgementRequested,
    blockFindingOrCredibilityAssessment:
      args.findingOrCredibilityAssessmentRequested,
    blockSensitiveCorrespondence: args.sensitiveCorrespondenceRequested,
    blockProcessOutcome: args.processOutcomeRequested,
    blockDismissalExecution: args.dismissalExecutionRequested,
    evidence: prepareTraceableMatterEvidence(args.evidence),
    reasons,
  };
}
