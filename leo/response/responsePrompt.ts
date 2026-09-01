import { ResponseArchitecture } from "./responseArchitecture";

type ResponsePromptInput = {
  architecture: ResponseArchitecture;
};

export function buildResponsePrompt({
  architecture,
}: ResponsePromptInput): string {
  const instructions = [
    "Use the validated private assessment as the sole source of substantive professional judgement.",
    "This response architecture controls communication only. It must not alter the assessment's recommendation, conclusions, options, unsupported commitments or immediate next step.",
    "",
    "COMMUNICATION SETTINGS",
    `Opening style: ${architecture.openingStyle}`,
    `Response shape: ${architecture.responseShape}`,
    `Question strategy: ${architecture.questionStrategy}`,
    `Acknowledge underlying concern: ${architecture.acknowledgeUnderlyingConcern}`,
    `Summarise supplied document: ${architecture.summariseDocument}`,
    `Close with continued support: ${architecture.closeWithSupport}`,
    `Maximum conversational parts: ${architecture.maximumParts}`,
    "",
    "COMMUNICATION RULES",
    ...architecture.communicationRules.map((rule) => `- ${rule}`),
  ];

  if (architecture.avoidNumberedLists) {
    instructions.push("- Avoid numbered lists in the final response.");
  }

  return instructions.join("\n");
}