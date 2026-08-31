// Central filter that removes "missingInformation" questions already substantively
// answered somewhere in the Matter context (description, transcript, metadata), so
// reasoning modules never need their own bespoke context-awareness. New categories can
// be added here without touching individual reasoning modules.
type AnsweredCategory = {
  name: string;
  // Matches when a missingInformation question belongs to this category.
  questionPattern: RegExp;
  // Matches when the supplied context already substantively answers this category.
  answeredPattern: RegExp;
};

const ANSWERED_CATEGORIES: AnsweredCategory[] = [
  {
    name: "duration",
    questionPattern: /how long|since when|when did .*(start|begin|first)/i,
    answeredPattern:
      /\b(\d+\s*(day|week|month|year)s?\b|since (last|early|mid|late)?\s*\w+|for (the past|about|around|over|nearly|almost)|a (couple|few) of (days|weeks|months|years)|recently|last (week|month|year))\b/i,
  },
  {
    name: "priorHistory",
    questionPattern:
      /previously (performed|behaved|met|attended|succeeded)|history of|prior (performance|conduct|attendance|record)|has (the employee|this) (previously|ever)/i,
    answeredPattern:
      /\b(reliable|used to be|historically|previously (been|performed|had)|no (previous|prior) (concerns|issues)|good (record|history)|until (recently|now))\b/i,
  },
  {
    name: "feedbackGiven",
    questionPattern:
      /been (given|provided with)? ?feedback|informed of the concern|made aware|told (the employee|them) about|raised (it|this|the concern) with|spoken to (the employee|them)/i,
    answeredPattern:
      /\b(spoke to|spoken to|had a (word|chat|conversation)|informal(ly)? (spoke|discussed|raised|chat)|raised (it|this) with|told (her|him|them)|mentioned (it|this) to|discussed (it|this) with)\b/i,
  },
  {
    name: "personalOrHealthFactors",
    questionPattern:
      /health|disability|workload|reasonable adjustment|personal (circumstances|issues)|wellbeing|contributing factor/i,
    answeredPattern:
      /\b(struggl(ing|es)|sleep(ing)?|concentrat(e|ion)|mental health|anxiety|stress(ed)?|things? (going on )?at home|personal (circumstances|matters|issues)|bereavement|caring responsib)\b/i,
  },
  {
    name: "witnesses",
    questionPattern: /witness/i,
    answeredPattern:
      /\bwitness(ed|es)?\b|\bsaw\b.*(happen|incident)|\b(colleague|manager|team member)s? (saw|witnessed|confirmed)/i,
  },
  {
    name: "evidence",
    questionPattern: /what evidence|evidence (is|available|demonstrates)/i,
    answeredPattern:
      /\b(evidence|records?|emails?|messages?|logs?|reports?|documented|written record|cctv|timesheet)\b/i,
  },
  {
    name: "policyOrContract",
    questionPattern: /\bpolicy\b|\bprocedure\b|contract(ual)? (term|provision)/i,
    answeredPattern: /\b(policy|procedure|handbook|contract (says|states)|written statement)\b/i,
  },
  {
    name: "datesGiven",
    questionPattern: /when\b.{0,25}\b(was|did|were)\b|what date/i,
    answeredPattern:
      /\b(\d{1,2}(st|nd|rd|th)?\s+\w+|\d{4}|last (week|month)|yesterday|today|on \w+day)\b/i,
  },
  {
    name: "businessImpact",
    questionPattern:
      /impact (on|is)|business (impact|effect)|affecting (the team|customers|colleagues)/i,
    answeredPattern:
      /\b(team (is|are) (having to|struggling)|pick(ing)? up (the )?(work|slack)|customers?|delay(s|ed)?|cost|productivity|service)\b/i,
  },
  {
    name: "natureOfConcern",
    questionPattern:
      /what specific aspect|what exactly|what conduct is alleged|what behaviour is alleged|what is (the employee|the) (complaining|alleging)/i,
    answeredPattern:
      /\b(missed?|missing|mistakes?|errors?|late|delay|fail(ed|ing)?|refus(ed|ing)|absent|rude|shout(ed|ing)|swear|threat|harass|bully|steal(ing)?|stole|theft|breach|complain(ed|t)?|took|taking|removed|caught|without (paying|permission))\b/i,
  },
];

/**
 * Removes questions from `questions` that are already substantively answered in
 * `contextText`. A question is only removed when it matches a known category AND
 * the context contains that category's specific answered-signal - a bare mention of a
 * related keyword is not enough. Questions matching no known category are always kept.
 */
export function filterAnsweredInformation(
  questions: string[],
  contextText: string
): string[] {
  if (!questions.length || !contextText.trim()) {
    return questions;
  }

  return questions.filter((question) => {
    const matchedCategories = ANSWERED_CATEGORIES.filter((category) =>
      category.questionPattern.test(question)
    );

    if (matchedCategories.length === 0) {
      return true;
    }

    const alreadyAnswered = matchedCategories.some((category) =>
      category.answeredPattern.test(contextText)
    );

    return !alreadyAnswered;
  });
}
