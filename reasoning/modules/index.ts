import { runAbsenceReasoning } from "./absence";
import { runAppealReasoning } from "./appeal";
import { runBullyingReasoning } from "./bullying";
import { runCapabilityReasoning } from "./capability";
import { runDbsReasoning } from "./dbs";
import { runDisabilityReasoning } from "./disability";
import { runDisciplinaryReasoning } from "./disciplinary";
import { runDrivingComplianceReasoning } from "./drivingCompliance";
import { runEqualityDiscriminationReasoning } from "./equalityDiscrimination";
import { runFamilyLeaveReasoning } from "./familyLeave";
import { runFlexibleWorkingReasoning } from "./flexibleWorking";
import { runGrievanceReasoning } from "./grievance";
import { runHarassmentReasoning } from "./harassment";
import { runHealthSafetyWellbeingReasoning } from "./healthSafetyWellbeing";
import { runInvestigationReasoning } from "./investigation";
import { runOnboardingReasoning } from "./onboarding";
import { runPayAndIncentivesReasoning } from "./payAndIncentives";
import { runPerformanceReasoning } from "./performance";
import { runProbationReasoning } from "./probation";
import { runRecruitmentReasoning } from "./recruitment";
import { runRedundancyReasoning } from "./redundancy";
import { runRightToWorkReasoning } from "./rightToWork";
import { runSaferRecruitmentReasoning } from "./saferRecruitment";
import { runTupeReasoning } from "./tupe";
import { runWhistleblowingReasoning } from "./whistleblowing";

import {
  ReasoningModuleInput,
  ReasoningModuleOutput,
} from "./types";

export function runReasoningModules(
  input: ReasoningModuleInput
): ReasoningModuleOutput[] {
  return [
    runAbsenceReasoning(input),
    runAppealReasoning(input),
    runBullyingReasoning(input),
    runCapabilityReasoning(input),
    runDbsReasoning(input),
    runDisabilityReasoning(input),
    runDisciplinaryReasoning(input),
    runDrivingComplianceReasoning(input),
    runEqualityDiscriminationReasoning(input),
    runFamilyLeaveReasoning(input),
    runFlexibleWorkingReasoning(input),
    runGrievanceReasoning(input),
    runHarassmentReasoning(input),
    runHealthSafetyWellbeingReasoning(input),
    runInvestigationReasoning(input),
    runOnboardingReasoning(input),
    runPayAndIncentivesReasoning(input),
    runPerformanceReasoning(input),
    runProbationReasoning(input),
    runRecruitmentReasoning(input),
    runRedundancyReasoning(input),
    runRightToWorkReasoning(input),
    runSaferRecruitmentReasoning(input),
    runTupeReasoning(input),
    runWhistleblowingReasoning(input),
  ].filter((moduleResult) => moduleResult.triggered);
}