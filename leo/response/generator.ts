import { LeoCoreOutput } from "../core/router";
import { ReasoningOutput } from "../reasoning/reasoner";
import { buildAdvice } from "./advice";
import { buildGuidance } from "./guidance";
import { buildNextSteps } from "./nextSteps";

export function generateLeoResponse(
  result: LeoCoreOutput,
  reasoning?: ReasoningOutput
): string {
  const intentLabel = formatIntent(result.intent);
  const riskLabel = formatRisk(result.risk.overall);

  const guidance = buildGuidance(result, reasoning);
  const advice = buildAdvice(result, reasoning);
  const nextSteps = buildNextSteps(result, reasoning);

  if (reasoning?.shouldAskQuestionsFirst) {
    return (
      `LEO Assessment\n\n` +
      `Situation\n` +
      `This appears to be a ${intentLabel} matter, but there are additional issues Leo needs to understand before recommending a final course of action.\n\n` +
      `Risk Assessment\n` +
      `Leo has assessed this matter as presenting an overall ${riskLabel} level of risk.\n\n` +
      `Important Considerations\n` +
      formatList(reasoning.legalConsiderations) +
      `\n\n` +
      `Information Leo Needs\n` +
      formatList(reasoning.missingInformation) +
      `\n\n` +
      `Guidance\n` +
      `${guidance}\n\n` +
      `Recommended Next Step\n` +
      `Before deciding how to respond, gather the missing information above. This will help avoid making assumptions and reduce the risk of taking an unsafe or unfair approach.`
    );
  }

  return (
    `LEO Assessment\n\n` +
    `Situation\n` +
    `This appears to be a ${intentLabel} matter.\n\n` +
    `Risk Assessment\n` +
    `Leo has assessed this matter as presenting an overall ${riskLabel} level of risk.\n\n` +
    `Guidance\n` +
    `${guidance}\n\n` +
    `Advice\n` +
    `${advice}\n\n` +
    `Recommended Next Steps\n` +
    formatList(nextSteps) +
    `\n` +
    `${result.requiresMatter ? "\nThis should continue to be managed within the Leo Matter workspace." : ""}`
  );
}

function formatIntent(intent: string): string {
  return intent.replaceAll("_", " ");
}

function formatRisk(risk: string): string {
  return risk.toUpperCase();
}

function formatList(items: string[]): string {
  if (!items.length) {
    return "• No additional items identified at this stage.";
  }

  return items.map((item) => `• ${item}`).join("\n");
}