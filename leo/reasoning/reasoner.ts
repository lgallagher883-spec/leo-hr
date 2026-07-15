import { LeoCoreOutput } from "../core/router";

export type ReasoningOutput = {
  primaryIssue: string;
  secondaryIssues: string[];
  legalConsiderations: string[];
  businessConsiderations: string[];
  policyConsiderations: string[];
  missingInformation: string[];
  recommendedApproach: string;
  recommendedSteps: string[];
  triggeredModules: string[];
  shouldAskQuestionsFirst: boolean;

  professionalReality: string;
  professionalOpening: string;
  professionalInsight: string;
  professionalContext: string[];
  seriousnessAssessment: string;
  employerRisks: string[];
  professionalRecommendation: string;
  immediateNextStep: string;
};

export function runLeoReasoning(
  result: LeoCoreOutput,
  matterContext: string
): ReasoningOutput {
  const moduleResults = result.reasoningModules;

  const secondaryIssues = unique(
    moduleResults.flatMap(
      (module) => module.issues
    )
  );

  const legalConsiderations = unique(
    moduleResults.flatMap(
      (module) => module.legalConsiderations
    )
  );

  const businessConsiderations = unique(
    moduleResults.flatMap(
      (module) => module.businessConsiderations
    )
  );

  const policyConsiderations = unique(
    moduleResults.flatMap(
      (module) => module.policyConsiderations
    )
  );

  const missingInformation = unique(
    moduleResults.flatMap(
      (module) => module.missingInformation
    )
  );

  const recommendedSteps = unique(
    moduleResults.flatMap(
      (module) => module.recommendedSteps
    )
  );

  const triggeredModules = unique(
    moduleResults.map(
      (module) => module.module
    )
  );

  const primaryIssue =
    formatIntent(result.intent);

  const professionalReality =
    buildProfessionalReality(
      matterContext,
      primaryIssue
    );

  const professionalOpening =
    buildProfessionalOpening(
      matterContext,
      primaryIssue
    );

  const professionalInsight =
    buildProfessionalInsight(
      matterContext,
      primaryIssue,
      businessConsiderations,
      legalConsiderations,
      missingInformation
    );

  const professionalContext =
    buildProfessionalContext(
      matterContext,
      businessConsiderations,
      missingInformation
    );

  const seriousnessAssessment =
    buildSeriousnessAssessment(
      result.risk.overall
    );

  const employerRisks = unique([
    ...businessConsiderations,
    ...legalConsiderations,
  ]).slice(0, 6);

  const professionalRecommendation =
    buildProfessionalRecommendation(
      matterContext,
      missingInformation,
      recommendedSteps
    );

  const immediateNextStep =
    buildImmediateNextStep(
      matterContext,
      missingInformation,
      recommendedSteps
    );

  return {
    primaryIssue,
    secondaryIssues,
    legalConsiderations,
    businessConsiderations,
    policyConsiderations,
    missingInformation,

    recommendedApproach:
      professionalRecommendation,

    recommendedSteps,
    triggeredModules,

    shouldAskQuestionsFirst:
      missingInformation.length > 0,

    professionalReality,
    professionalOpening,
    professionalInsight,
    professionalContext,
    seriousnessAssessment,
    employerRisks,
    professionalRecommendation,
    immediateNextStep,
  };
}

function buildProfessionalOpening(
  message: string,
  primaryIssue: string
): string {
  const normalised = message.toLowerCase();

  if (
    includesAny(normalised, [
      "accused",
      "allegation",
      "alleged",
      "stealing",
      "stolen",
      "theft",
      "says they saw",
    ])
  ) {
    return "At this stage, you have an allegation rather than an established fact. The seriousness of the accusation should not rush you into deciding that theft has occurred before the evidence and both employees' accounts have been considered.";
  }

  if (
    includesAny(normalised, [
      "off sick",
      "signed off",
      "fit note",
      "stress",
      "replace them",
      "long-term sickness",
      "long term sickness",
    ])
  ) {
    return "There are two issues to manage here: an employee who is currently unwell and a business dealing with an absence that has no clear end point. Replacing the employee may eventually become a consideration, but it is not the decision you need to make today.";
  }

  if (
    includesAny(normalised, [
      "grievance",
      "formal complaint",
    ])
  ) {
    return "Receiving a grievance does not mean that the manager has done anything wrong, but it does mean the employee's concerns now need to be acknowledged and considered promptly, fairly and impartially.";
  }

  if (
    includesAny(normalised, [
      "further fit note",
      "another four weeks",
      "further four weeks",
      "work-related stress",
      "work related stress",
    ])
  ) {
    return "Emma has confirmed that she remains unwell and has been signed off for a further four weeks. The important point is that there is still no clear indication of when she may be able to return, so the uncertainty now needs to be managed alongside her wellbeing.";
  }

  if (
    includesAny(normalised, [
      "resignation",
      "resign",
    ])
  ) {
    return "Mark's resignation appears clear and should be acknowledged professionally. After six years of service, however, it is also worth understanding whether he is simply ready to move on or whether there is anything the business should learn before he leaves.";
  }

  if (
    includesAny(normalised, [
      "confidential concern",
      "safety checks",
      "staff and customers at risk",
      "whistleblowing",
      "whistleblower",
    ])
  ) {
    return "This is more than a general workplace complaint. A concern has been raised that safety records may be inaccurate and that staff or customers could be exposed to risk, so the safety issue needs checking promptly while the reporting employee's identity is protected as far as possible.";
  }

  if (
    includesAny(normalised, [
      "work from home",
      "working from home",
      "flexible working",
      "childcare",
      "home working",
    ])
  ) {
    return "The decision is not whether childcare is a reasonable concern. The question is whether the role can still be carried out effectively under the arrangement requested, and whether another workable arrangement could meet both the employee's needs and the business requirements.";
  }

  if (
    includesAny(normalised, [
      "performance",
      "capability",
      "twelve years",
      "12 years",
      "feel awful",
      "business to run",
      "not capable",
    ])
  ) {
    return "You are balancing two legitimate responsibilities: recognising what this employee has contributed over many years and ensuring that the role is performed to the standard the business now needs. Wanting to be fair does not mean that you have to avoid addressing the problem.";
  }

  return `This appears to be a ${primaryIssue.toLowerCase()} matter. Before deciding what action to take, the sensible starting point is to separate what is known from what remains uncertain.`;
}

function buildProfessionalReality(
  message: string,
  primaryIssue: string
): string {
  const normalised = message.toLowerCase();

  if (
    includesAny(normalised, [
      "accused",
      "allegation",
      "alleged",
      "says they saw",
      "reported",
      "stealing",
      "stolen",
      "theft",
    ])
  ) {
    return "At this stage, an allegation has been raised but the relevant facts have not yet been established. No conclusion should be reached until the available evidence and accounts have been considered fairly.";
  }

  if (
    includesAny(normalised, [
      "grievance",
      "formal complaint",
    ])
  ) {
    return "A formal workplace concern has been raised and now requires a prompt, fair and impartial response. The grievance establishes that the employee has concerns requiring consideration; it does not establish that wrongdoing has occurred.";
  }

  if (
    includesAny(normalised, [
      "fit note",
      "signed off",
      "off sick",
      "sickness",
      "stress",
      "long-term absence",
      "long term absence",
    ])
  ) {
    return "This has become both an employee wellbeing matter and a business continuity matter. The employee remains unwell, while the employer is also managing uncertainty about the likely duration of the absence and its operational impact.";
  }

  if (
    includesAny(normalised, [
      "resignation",
      "resign",
    ])
  ) {
    return "The employee has communicated a clear intention to leave. The immediate practical position now depends on confirming the resignation, notice arrangements and whether anything important should be understood before their departure.";
  }

  if (
    includesAny(normalised, [
      "work from home",
      "working from home",
      "flexible working",
      "childcare",
      "home working",
    ])
  ) {
    return "The employee has made a request that needs to be considered fairly, but the decision must also reflect the genuine operational requirements of the role and the business.";
  }

  if (
    includesAny(normalised, [
      "safety checks",
      "staff and customers at risk",
      "confidential concern",
      "whistleblowing",
      "whistleblower",
      "reported wrongdoing",
    ])
  ) {
    return "A confidential concern has been raised about practices that may place staff or customers at risk. The concern requires prompt attention while protecting the reporting employee from avoidable disclosure or retaliation.";
  }

  if (
    includesAny(normalised, [
      "performance",
      "capability",
      "not capable",
      "declined significantly",
      "not meeting expectations",
    ])
  ) {
    return "This is not simply a performance process question. The employer is balancing the employee's contribution and length of service against the need for the role to be performed to the standard the business now requires.";
  }

  return `This appears to be a ${primaryIssue.toLowerCase()} matter. The professional starting point is to establish what has happened, what remains uncertain and what should not yet be assumed.`;
}

function buildProfessionalInsight(
  message: string,
  primaryIssue: string,
  businessConsiderations: string[],
  legalConsiderations: string[],
  missingInformation: string[]
): string {
  const normalised = message.toLowerCase();

  if (
    includesAny(normalised, [
      "accused",
      "allegation",
      "alleged",
      "stealing",
      "stolen",
      "theft",
    ])
  ) {
    return "The greatest risk at this stage is not the allegation itself, but allowing the seriousness of it to push the employer into a disciplinary conclusion before the facts have been properly established.";
  }

  if (
    includesAny(normalised, [
      "off sick",
      "fit note",
      "signed off",
      "stress",
      "replace them",
      "long-term absence",
      "long term absence",
    ])
  ) {
    return "Replacing the employee is unlikely to be the first decision. The more important question is whether the absence is likely to be temporary or prolonged, because that will shape both the support offered and the practical options available to the business.";
  }

  if (
    includesAny(normalised, [
      "grievance",
      "formal complaint",
    ])
  ) {
    return "The grievance is not proof that the manager has acted improperly. It is a formal request for the employer to examine the concerns objectively and ensure the employee feels safe and heard while that happens.";
  }

  if (
    includesAny(normalised, [
      "resignation",
      "resign",
      "six years",
      "long-serving",
      "long serving",
    ])
  ) {
    return "The resignation itself may be straightforward to process, but understanding why a long-serving employee has chosen to leave may be more valuable to the business than the administration of their departure.";
  }

  if (
    includesAny(normalised, [
      "safety checks",
      "staff and customers at risk",
      "confidential concern",
      "whistleblowing",
      "whistleblower",
    ])
  ) {
    return "The priority is protecting people and preserving confidence in the reporting process, not identifying who raised the concern. A poor response could discourage future reporting and allow the underlying risk to continue.";
  }

  if (
    includesAny(normalised, [
      "work from home",
      "working from home",
      "flexible working",
      "childcare",
      "home working",
    ])
  ) {
    return "The decision is not whether childcare is a good reason. The real question is whether the role can still be carried out effectively under the arrangement requested, and whether any workable alternative could meet both needs.";
  }

  if (
    includesAny(normalised, [
      "performance",
      "capability",
      "twelve years",
      "12 years",
      "feel awful",
      "business to run",
    ])
  ) {
    return "Wanting to be fair does not mean avoiding a difficult conversation. In many cases, addressing the issue openly and supportively is fairer to the employee, the wider team and the business than allowing the position to drift.";
  }

  if (missingInformation.length > 0) {
    return "The current uncertainty could materially change the advice. Before the employer commits to a course of action, the missing facts need to be reduced enough to support a fair and defensible decision.";
  }

  if (businessConsiderations.length > 0) {
    return "The issue should not be viewed only as an HR process. The employer also needs to consider the practical effect on the business, while ensuring that any response remains fair and proportionate.";
  }

  if (legalConsiderations.length > 0) {
    return "The legal position matters, but it should validate the employer's professional judgement rather than replace it. The next step should remain practical, proportionate and grounded in the facts.";
  }

  return `The correct response depends less on the label attached to the ${primaryIssue.toLowerCase()} matter and more on what is established, what remains uncertain and what proportionate action is justified now.`;
}

function buildProfessionalContext(
  message: string,
  businessConsiderations: string[],
  missingInformation: string[]
): string[] {
  const normalised = message.toLowerCase();

  const context: string[] = [];

  if (
    includesAny(normalised, [
      "why",
      "reason",
      "because",
      "stress",
      "childcare",
      "pressure",
      "health",
      "wellbeing",
      "feel awful",
    ])
  ) {
    context.push(
      "The reasons and circumstances behind the employee's position may materially affect the appropriate response."
    );
  }

  if (businessConsiderations.length > 0) {
    context.push(
      ...businessConsiderations.slice(0, 3)
    );
  }

  if (missingInformation.length > 0) {
    context.push(
      `Important context remains unknown, including: ${missingInformation
        .slice(0, 3)
        .join("; ")}.`
    );
  }

  if (context.length === 0) {
    context.push(
      "The employee's rationale, intent and surrounding circumstances should be understood before the employer reaches a final view."
    );
  }

  return unique(context);
}

function buildSeriousnessAssessment(
  risk: LeoCoreOutput["risk"]["overall"]
): string {
  const normalisedRisk =
    String(risk).toLowerCase();

  switch (normalisedRisk) {
    case "critical":
      return "The matter may require immediate safeguards or escalation because the potential consequences are significant.";

    case "high":
      return "The matter is potentially serious and should be handled promptly, carefully and with a clear written record.";

    case "medium":
      return "The matter requires a measured response and sufficient fact-finding before decisive action is taken.";

    default:
      return "The matter appears manageable through a proportionate response, provided the relevant facts are confirmed.";
  }
}

function buildProfessionalRecommendation(
  message: string,
  missingInformation: string[],
  recommendedSteps: string[]
): string {
  const normalised = message.toLowerCase();

  if (
    includesAny(normalised, [
      "accused",
      "allegation",
      "alleged",
      "stealing",
      "stolen",
      "theft",
    ])
  ) {
    return "Carry out a fair fact-finding investigation before deciding whether formal disciplinary action is appropriate.";
  }

  if (
    includesAny(normalised, [
      "off sick",
      "fit note",
      "signed off",
      "stress",
      "replace them",
    ])
  ) {
    return "Maintain appropriate supportive contact while obtaining enough information to understand the likely duration of the absence and any support that may assist the employee.";
  }

  if (
    includesAny(normalised, [
      "grievance",
      "formal complaint",
    ])
  ) {
    return "Acknowledge the grievance promptly, protect impartiality and begin planning how the concerns will be investigated fairly.";
  }

  if (
    includesAny(normalised, [
      "resignation",
      "resign",
    ])
  ) {
    return "Acknowledge the resignation professionally, confirm the practical arrangements and consider whether an exit discussion would help the business understand the employee's decision.";
  }

  if (
    includesAny(normalised, [
      "safety checks",
      "staff and customers at risk",
      "confidential concern",
      "whistleblowing",
    ])
  ) {
    return "Treat the disclosure seriously, preserve confidentiality as far as reasonably possible and begin a proportionate investigation into the safety concern.";
  }

  if (
    includesAny(normalised, [
      "work from home",
      "working from home",
      "flexible working",
      "childcare",
      "home working",
    ])
  ) {
    return "Assess the request fairly against the actual requirements of the role, explore whether the proposed arrangement would work and consider practical alternatives before reaching a decision.";
  }

  if (
    includesAny(normalised, [
      "performance",
      "capability",
      "feel awful",
      "business to run",
    ])
  ) {
    return "Clarify what support, expectations and opportunities to improve have already been provided before deciding whether a formal capability process is now appropriate.";
  }

  if (missingInformation.length > 0) {
    return "Do not reach a final conclusion yet. Reduce the important uncertainty first, then decide the next proportionate course of action using the facts and context established.";
  }

  if (recommendedSteps.length > 0) {
    return recommendedSteps[0];
  }

  return "Proceed with the least intrusive action that remains fair, practical and appropriate to the facts currently available.";
}

function buildImmediateNextStep(
  message: string,
  missingInformation: string[],
  recommendedSteps: string[]
): string {
  const normalised = message.toLowerCase();

  if (
    includesAny(normalised, [
      "accused",
      "allegation",
      "alleged",
      "stealing",
      "stolen",
      "theft",
    ])
  ) {
    return "Begin with the reporting employee's account and any available records or evidence, then speak separately with the accused employee and give them a fair opportunity to respond.";
  }

  if (
    includesAny(normalised, [
      "off sick",
      "fit note",
      "signed off",
      "stress",
      "replace them",
    ])
  ) {
    return "Arrange a supportive welfare conversation and establish what medical information is available about the likely duration of the absence and any possible support or adjustments.";
  }

  if (
    includesAny(normalised, [
      "grievance",
      "formal complaint",
    ])
  ) {
    return "Acknowledge receipt of the grievance promptly and decide who can handle the matter impartially.";
  }

  if (
    includesAny(normalised, [
      "resignation",
      "resign",
    ])
  ) {
    return "Confirm receipt of the resignation, check the contractual notice period and establish the proposed final working day.";
  }

  if (
    includesAny(normalised, [
      "safety checks",
      "staff and customers at risk",
      "confidential concern",
      "whistleblowing",
    ])
  ) {
    return "Secure the relevant safety records immediately and establish whether any current risk requires urgent corrective action before beginning the wider investigation.";
  }

  if (
    includesAny(normalised, [
      "work from home",
      "working from home",
      "flexible working",
      "childcare",
      "home working",
    ])
  ) {
    return "Clarify the role's supervision requirements and identify which duties genuinely require the employee to be physically present.";
  }

  if (
    includesAny(normalised, [
      "performance",
      "capability",
      "feel awful",
      "business to run",
    ])
  ) {
    return "Review what concerns, expectations, support and improvement opportunities have already been clearly documented before deciding the next formal step.";
  }

  if (recommendedSteps.length > 0) {
    return recommendedSteps[0];
  }

  if (missingInformation.length > 0) {
    return `Clarify the most important missing information before reaching a conclusion: ${missingInformation[0]}`;
  }

  return "Confirm the facts and identify the next proportionate action.";
}

function formatIntent(
  intent: unknown
): string {
  return String(intent)
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (character) =>
      character.toUpperCase()
    );
}

function includesAny(
  value: string,
  terms: string[]
): boolean {
  return terms.some((term) =>
    value.includes(term)
  );
}

function unique(
  values: string[]
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}