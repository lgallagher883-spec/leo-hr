export type FoundationSection =
  | "Company Profile"
  | "Organisation Structure"
  | "Employment Framework"
  | "HR Resources"
  | "Company Knowledge";

export type WelcomeStage =
  | "business_overview"
  | "working_locations"
  | "workforce_profile"
  | "management_structure"
  | "employment_basics"
  | "pay_benefits"
  | "people_management"
  | "approvals_escalation"
  | "regulation_compliance"
  | "hr_resources"
  | "company_knowledge";

export type StageConfiguration = {
  allowedKeys: Partial<
    Record<FoundationSection, readonly string[]>
  >;

  instructions: string;
};

export const WELCOME_STAGES =
  new Set<WelcomeStage>([
    "business_overview",
    "working_locations",
    "workforce_profile",
    "management_structure",
    "employment_basics",
    "pay_benefits",
    "people_management",
    "approvals_escalation",
    "regulation_compliance",
    "hr_resources",
    "company_knowledge",
  ]);

export const ALLOWED_FOUNDATION_SECTIONS =
  new Set<FoundationSection>([
    "Company Profile",
    "Organisation Structure",
    "Employment Framework",
    "HR Resources",
    "Company Knowledge",
  ]);

export const FOUNDATION_NUMBER_WORDS: Record<
  number,
  string
> = {
  1: "One",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
};

export const FOUNDATION_KEY_ALIASES: Record<
  string,
  string
> = {
  "organisation type": "Business type",
  "organization type": "Business type",
  "business description": "Services provided",
  "service provided": "Services provided",
  services: "Services provided",

  "management reporting lines": "Reporting lines",
  "managers / leadership structure":
    "Management structure",

  "role-specific checks":
    "Other pre-employment checks",
  "role specific checks":
    "Other pre-employment checks",
  "pre-employment checks":
    "Other pre-employment checks",
  "pre employment checks":
    "Other pre-employment checks",

  "right to work checks":
    "Right to Work requirements",
  "right-to-work checks":
    "Right to Work requirements",
  "right to work requirements":
    "Right to Work requirements",

  "dbs checks": "DBS requirements",
  "dbs check requirements":
    "DBS requirements",

  "barred list requirements":
    "Barred-list requirements",
  "barred-list checks":
    "Barred-list requirements",

  "professional registrations":
    "Professional registration requirements",
  "professional registration":
    "Professional registration requirements",

  qualifications:
    "Qualification requirements",
  "role qualifications":
    "Qualification requirements",

  "driving requirements":
    "Licence requirements",
  "licence requirement":
    "Licence requirements",
  "license requirements":
    "Licence requirements",
  "licence checks":
    "Licence requirements",
  "driving licence requirements":
    "Licence requirements",

  "mileage policy":
    "Mileage arrangements",
  "mileage reimbursement":
    "Mileage arrangements",

  "working days": "Working pattern",
  "normal working pattern":
    "Working pattern",

  "recruitment authority":
    "Recruitment approval",
  "dismissal authority":
    "Dismissal approval",
  "disciplinary authority":
    "Disciplinary sanction approval",
  "disciplinary approval":
    "Disciplinary sanction approval",
  "pay approval": "Pay change approval",
  "leave approval":
    "Annual leave approval",

  "regulator notifications":
    "Regulator notification requirements",
  "notification requirements":
    "Regulator notification requirements",

  "record keeping":
    "Record-keeping requirements",
  "record keeping requirements":
    "Record-keeping requirements",

  "informal resolution approach":
    "Informal resolution preference",
};

export const FOUNDATION_STAGE_CONFIG: Record<
  WelcomeStage,
  StageConfiguration
> = {
  business_overview: {
    allowedKeys: {
      "Company Profile": [
        "Business type",
        "Sector / industry",
        "Services provided",
        "Number of employees",
        "Number of sites",
        "Location / region",
        "Regulator",
        "Ownership structure",
      ],
    },

    instructions: `
Use Company Profile only.

Capture:

- the general type of business
- its sector or industry
- the services or products it provides
- approximate workforce size
- number of sites, branches, settings or operating locations
- geographical operating area
- regulators
- ownership or governance structure where stated

Keep these facts separate:

- Business type describes what kind of employer it is.
- Sector / industry describes the wider industry.
- Services provided describes what it supplies or delivers.
- Number of sites must contain only the number.
- Number of employees must contain only the number where a clear number is stated.

Examples:

Business type:
Independent accountancy practice

Sector / industry:
Professional services

Services provided:
Accountancy, payroll and tax advisory services

Number of employees:
42

Number of sites:
Two

Do not make the extraction sector-specific.
`,
  },

  working_locations: {
    allowedKeys: {
      "Organisation Structure": [
        "Site working pattern",
        "Cross-site working",
        "Remote working",
        "Home working",
        "Hybrid working",
        "Employee travel",
        "Mileage arrangements",
        "Working pattern",
        "Shift arrangements",
        "Overnight working",
        "On-call arrangements",
        "Opening hours",
        "Location-specific arrangements",
      ],
    },

    instructions: `
Use Organisation Structure only.

Capture:

- where employees normally work
- whether employees work across several sites
- remote, home or hybrid working
- travel between sites or locations during working hours
- mileage reimbursement for use of personal vehicles
- normal working days or recurring location patterns
- shifts
- overnight work
- on-call arrangements
- actual opening hours where clock times are stated
- material differences between locations

Important distinctions:

- Employee travel describes whether work-related travel occurs.
- Mileage arrangements describes reimbursement or expenses.
- Working pattern describes recurring working days or arrangements, such as Monday to Friday.
- Opening hours must only be used where actual opening or operating times are stated.
- Do not infer opening hours from working days alone.
- Remote working means fully remote work.
- Home working means a specific working-from-home arrangement.
- Hybrid working means work is deliberately divided between workplace and remote locations.
- Employee travel and Mileage arrangements must remain separate.
`,
  },

  workforce_profile: {
    allowedKeys: {
      "Organisation Structure": [
        "Workforce composition",
        "Employment types",
        "Full-time workforce",
        "Part-time workforce",
        "Temporary staff",
        "Casual staff",
        "Zero-hours staff",
        "Agency workers",
        "Contractors",
        "Apprentices",
        "Volunteers",
        "Trade union recognition",
        "Employee representatives",
      ],

      "Company Knowledge": [
        "Right to Work requirements",
        "DBS requirements",
        "Barred-list requirements",
        "Licence requirements",
        "Security clearance requirements",
        "Medical clearance requirements",
        "Professional registration requirements",
        "Qualification requirements",
        "Safeguarding requirements",
        "Other pre-employment checks",
      ],
    },

    instructions: `
Use Organisation Structure for workforce composition.

Use Company Knowledge for checks, licences, qualifications, registrations and role requirements.

Capture:

- permanent, fixed-term, full-time, part-time, temporary, casual and zero-hours arrangements
- agency workers
- contractors
- apprentices
- volunteers
- trade union recognition
- employee or workforce representatives
- Right to Work requirements
- DBS requirements
- barred-list checks
- licences required to perform particular roles
- professional registrations
- qualification requirements
- safeguarding clearance
- security clearance
- medical clearance
- genuinely separate pre-employment checks

Avoid duplication:

- Store Right to Work under Right to Work requirements.
- Store DBS under DBS requirements.
- Store barred-list checks under Barred-list requirements.
- Store forklift, HGV, driving, operator, SIA and similar licences under Licence requirements.
- Store professional registrations under Professional registration requirements.
- Store qualifications under Qualification requirements.
- Use Other pre-employment checks only when no more specific key applies.
- Never repeat a specific check under Other pre-employment checks.
`,
  },

  management_structure: {
    allowedKeys: {
      "Organisation Structure": [
        "Management structure",
        "Reporting lines",
        "Departments / teams",
        "Site managers",
        "Leadership structure",
        "HR responsibility",
        "Internal HR support",
        "External HR support",
      ],

      "Company Knowledge": [
        "Recruitment approval",
        "Disciplinary sanction approval",
        "Dismissal approval",
        "Organisational change approval",
        "Formal decision authority",
      ],
    },

    instructions: `
Use Organisation Structure for reporting lines, teams, management roles and HR support.

Use Company Knowledge only for formal decision authority.

Capture:

- who employees report to
- who manages sites, teams or departments
- leadership structure
- who holds day-to-day HR responsibility
- whether internal HR support exists
- whether external HR support exists
- who approves recruitment
- who approves disciplinary sanctions
- who approves dismissals
- who approves organisational change

Keep responsibilities separate:

- Reporting lines describes who reports to whom.
- HR responsibility identifies who holds responsibility for HR.
- Internal HR support identifies internal HR resource.
- External HR support identifies external HR advisers or consultants.
- Recruitment approval identifies who authorises recruitment.
- Disciplinary sanction approval identifies who authorises formal sanctions.
- Dismissal approval identifies who authorises dismissal.
- Organisational change approval identifies who authorises restructuring or other organisational change.

Where one sentence contains both HR responsibility and external HR support, return two separate facts.
`,
  },

  employment_basics: {
    allowedKeys: {
      "Employment Framework": [
        "Holiday year",
        "Probation period",
        "Probation extension",
        "Usual working week",
        "Working pattern",
        "Shift patterns",
        "Breaks",
        "Notice periods",
        "Contract types",
        "Contractual differences",
        "Place of work",
        "Mobility requirements",
      ],
    },

    instructions: `
Use Employment Framework only.

Capture:

- holiday year
- standard probation period
- permitted probation extensions
- normal weekly hours
- recurring working days or working pattern
- shift arrangements
- breaks
- notice periods
- contract types
- material contractual differences between roles or workforce groups
- contractual place of work
- mobility requirements

Keep separate:

- Probation period is the normal initial probation.
- Probation extension explains whether and how probation can be extended.
- Usual working week describes weekly hours.
- Working pattern describes when those hours are normally worked.
- Shift patterns describes formal rotating or fixed shifts.
- Place of work describes the contractual or normal work location.
- Mobility requirements describes obligations to work elsewhere.

Do not use Opening hours in this stage.
Do not infer opening hours from Monday-to-Friday working.
`,
  },

  pay_benefits: {
    allowedKeys: {
      "Employment Framework": [
        "Pay frequency",
        "Overtime arrangements",
        "Time off in lieu",
        "Sick pay",
        "Maternity pay",
        "Paternity pay",
        "Adoption pay",
        "Shared parental pay",
        "Parental leave arrangements",
        "Bonus arrangements",
        "Commission arrangements",
        "Allowances",
        "Pension arrangements",
        "Other benefits",
        "Expenses",
        "Mileage arrangements",
      ],
    },

    instructions: `
Use Employment Framework only.

Capture:

- pay frequency
- overtime payment arrangements
- time off in lieu
- contractual or enhanced sick pay
- maternity pay
- paternity pay
- adoption pay
- shared parental pay
- other parental leave arrangements
- bonuses
- commission
- allowances
- pension arrangements
- expenses
- mileage reimbursement
- other contractual benefits

Use "Statutory minimum" only where the employer clearly states that no enhancement is offered.

Keep separate:

- Overtime arrangements and Time off in lieu.
- Expenses and Mileage arrangements.
- Bonus arrangements and Commission arrangements.
- Each family-pay entitlement.
`,
  },

  people_management: {
    allowedKeys: {
      "Company Knowledge": [
        "Absence management approach",
        "Return-to-work practice",
        "Performance management approach",
        "Probation review approach",
        "Probation extension practice",
        "Disciplinary approach",
        "Grievance approach",
        "Informal resolution preference",
        "Mediation practice",
        "Coaching approach",
        "Occupational Health approach",
        "Medical referral practice",
        "Support before formal action",
      ],

      "Employment Framework": [
        "Absence trigger points",
        "Probation review schedule",
        "Performance review process",
      ],
    },

instructions: `
Use Company Knowledge for management practices, preferred approaches and the usual way people matters are handled.

Use Employment Framework only for defined trigger points, formal schedules or structured review arrangements.

Extract every clearly stated people-management practice separately.

Capture:

- absence management approach
- return-to-work practice
- absence trigger points
- performance management approach
- performance review process
- probation review approach
- probation review schedule
- probation extension practice
- disciplinary approach
- grievance approach
- informal resolution preference
- mediation practice
- coaching approach
- Occupational Health approach
- medical referral practice
- support before formal action

Important separation rules:

- Performance management approach describes the organisation's overall method for handling performance concerns.
- Coaching approach describes coaching as a specific support method.
- Performance review process describes a defined or formal review structure.
- Probation review approach describes how probation is normally managed.
- Probation review schedule records specific review dates or intervals.
- Support before formal action describes the support or discussion normally provided before a formal process begins.
- Informal resolution preference describes a stated preference to resolve concerns informally where appropriate.

Where one sentence clearly contains more than one of these concepts, return a separate fact for each applicable key.

Example:

Employer statement:
"Performance concerns are managed through regular coaching and review meetings before any formal capability process begins."

Return:

- Performance management approach:
  Performance concerns are addressed through review meetings before formal capability action.

- Coaching approach:
  Coaching is used to support improvement before formal capability action.

- Support before formal action:
  Support and review meetings are normally provided before formal capability action.

Do not collapse performance management, coaching and support before formal action into a single fact.

Do not turn a general aspiration into a confirmed organisational practice.

Only store a practice where the employer states that it is normally, routinely, consistently, formally or generally followed.

Do not invent trigger points, timescales, review stages or formal procedures that the employer has not stated.
`,
  },

  approvals_escalation: {
    allowedKeys: {
      "Company Knowledge": [
        "Annual leave approval",
        "Overtime approval",
        "Recruitment approval",
        "Pay change approval",
        "Bonus approval",
        "Disciplinary sanction approval",
        "Dismissal approval",
        "Organisational change approval",
        "HR escalation route",
        "Director escalation route",
        "Owner escalation route",
        "Trustee escalation route",
        "Legal advice escalation",
        "Other approval routes",
      ],
    },

instructions: `
Use Company Knowledge only.

This stage captures formal approval authority and escalation routes.

Every approval or escalation stated by the employer must be returned as a separate Foundation fact.

Never stop after extracting only a few approvals.

If the employer states seven approval routes, return seven separate facts.

Capture separately:

- Annual leave approval
- Overtime approval
- Recruitment approval
- Pay change approval
- Bonus approval
- Disciplinary sanction approval
- Dismissal approval
- Organisational change approval
- HR escalation route
- Director escalation route
- Owner escalation route
- Trustee escalation route
- Legal advice escalation
- Other approval routes

Important rules:

- Recruitment approval includes authority to recruit, appoint or hire staff.
- Disciplinary sanction approval includes authority for written warnings, final written warnings or other formal disciplinary sanctions.
- Dismissal approval includes authority to approve or authorise dismissals.
- Organisational change approval includes restructures, reorganisations and significant organisational change.
- HR escalation route describes when managers must consult HR.
- Legal advice escalation describes when legal advice must be sought.
- Director, Owner and Trustee escalation routes should only be used where specifically stated.

Do not merge different approvals into one fact.

Do not replace a specific approval with a generic approval.

Examples:

Employer statement:
"Line managers approve annual leave and overtime."

Return:

- Annual leave approval:
  Line managers approve annual leave.

- Overtime approval:
  Line managers approve overtime.

Employer statement:
"Permanent recruitment requires approval from the Operations Director."

Return:

- Recruitment approval:
  Permanent recruitment requires approval from the Operations Director.

Employer statement:
"Formal written warnings require approval from the HR Director."

Return:

- Disciplinary sanction approval:
  Formal written warnings require approval from the HR Director.

Employer statement:
"Dismissals require approval from the Managing Director."

Return:

- Dismissal approval:
  Dismissals require approval from the Managing Director.

Every distinct approval or escalation route must become its own Foundation fact.
`,
  },

  regulation_compliance: {
    allowedKeys: {
      "Company Knowledge": [
        "Compliance requirements",
        "Sector-specific obligations",
        "Safeguarding requirements",
        "DBS requirements",
        "Barred-list requirements",
        "Right to Work requirements",
        "Licence requirements",
        "Professional registration requirements",
        "Qualification requirements",
        "Mandatory training",
        "Health and safety responsibilities",
        "Staffing ratios",
        "Regulator notification requirements",
        "Record-keeping requirements",
        "Audit requirements",
      ],
    },

instructions: `
Use Company Knowledge only.

This stage records ongoing legal, regulatory and compliance obligations.

It does not record the identity of the regulator.

The regulator belongs in Company Profile and should normally already exist.

Extract every distinct compliance obligation separately.

Capture:

- Compliance requirements
- Sector-specific obligations
- Safeguarding requirements
- DBS requirements
- Barred-list requirements
- Right to Work requirements
- Licence requirements
- Qualification requirements
- Professional registration requirements
- Mandatory training
- Health and safety responsibilities
- Staffing ratios
- Regulator notification requirements
- Record-keeping requirements
- Audit requirements

Important rules:

- Do not create or duplicate Regulator.
- Every licence requirement must become Licence requirements.
- Every professional registration requirement must become Professional registration requirements.
- Every qualification requirement must become Qualification requirements.
- Every safeguarding obligation must become Safeguarding requirements.
- Every Right to Work obligation must become Right to Work requirements.
- Every DBS obligation must become DBS requirements.

Do not merge several compliance obligations into one fact.

Examples:

Employer statement:
"Forklift operators must hold a valid forklift licence."

Return:

- Licence requirements:
  Forklift operators must hold a valid forklift licence.

Employer statement:
"Electrical engineers must maintain their professional registration."

Return:

- Professional registration requirements:
  Electrical engineers must maintain their professional registration.

Employer statement:
"Employees working with children require an enhanced DBS check."

Return:

- DBS requirements:
  Employees working with children require an enhanced DBS check.

Employer statement:
"Serious accidents must be reported to the Health and Safety Executive."

Return:

- Regulator notification requirements:
  Serious accidents must be reported to the Health and Safety Executive.

Return a separate Foundation fact for every distinct compliance obligation.
`,
  },

  hr_resources: {
    allowedKeys: {
      "HR Resources": [
        "Employee handbook",
        "Policies",
        "Procedures",
        "Contract templates",
        "Standard letters",
        "Forms / templates",
        "Risk assessments",
        "Training materials",
        "Collective agreements",
        "HR systems",
        "HR records",
        "Document storage",
      ],
    },

    instructions: `
Use HR Resources only.

This stage records what resources currently exist.

It does not analyse, validate or summarise the full contents of documents.

Capture:

- employee handbook
- policies
- procedures
- contract templates
- standard letters
- forms and templates
- risk assessments
- training materials
- collective agreements
- HR systems
- HR records
- document-storage arrangements

Keep HR systems and HR records separate:

- HR systems identifies named systems or platforms.
- HR records describes how or where employee records are kept.

Do not claim that Leo has read, indexed or verified a document merely because the employer says it exists.
`,
  },

  company_knowledge: {
    allowedKeys: {
      "Company Knowledge": [
        "Operational rules",
        "Internal practices",
        "Management preferences",
        "Cultural expectations",
        "Operational restrictions",
        "Escalation expectations",
        "Informal resolution preference",
        "Senior approval requirements",
        "Recurring working practices",
        "Things Leo should remember",
        "Organisation memory",
      ],
    },

 instructions: `
Use Company Knowledge only.

This stage captures the organisation's unique culture, operating philosophy and internal ways of working.

Only store information that would help Leo make better HR decisions in future.

Do not repeat information already stored under Company Profile, Organisation Structure, Employment Framework or HR Resources.

Capture:

- Operational rules
- Internal practices
- Management preferences
- Cultural expectations
- Operational restrictions
- Escalation expectations
- Informal resolution preference
- Senior approval requirements
- Recurring working practices
- Things Leo should remember
- Organisation memory

Important rules:

- A stated organisational principle should be recorded where it describes how the organisation normally wants managers to behave.
- A preference to resolve issues informally should always become Informal resolution preference.
- A leadership preference to be consulted should become Senior approval requirements.
- A recurring expectation about manager behaviour should become Escalation expectations.
- A balancing principle or management philosophy should become Management preferences.
- Operational limits or restrictions should become Operational restrictions.
- Use Things Leo should remember only when no more specific key applies.
- Use Organisation memory only for long-term organisation-specific knowledge that does not naturally fit another key.

Do not merge different concepts into one fact.

Examples:

Employer statement:
"One of our core principles is to resolve workplace issues informally wherever possible before starting formal procedures."

Return:

- Informal resolution preference:
  Workplace issues are normally resolved informally wherever appropriate before formal procedures begin.

Employer statement:
"The Managing Director prefers to be consulted before any dismissal recommendation is finalised."

Return:

- Senior approval requirements:
  The Managing Director prefers to be consulted before dismissal recommendations are finalised.

Employer statement:
"Managers are expected to speak to employees early rather than allowing problems to escalate."

Return:

- Escalation expectations:
  Managers are expected to address concerns early before they escalate.

Employer statement:
"Operational decisions should balance commercial needs with employee wellbeing."

Return:

- Management preferences:
  Operational decisions should balance commercial needs with employee wellbeing.

Do not store:

- employee-specific personal information
- temporary situations
- one-off opinions
- speculation
- generic legal requirements
- information already captured under another Foundation key
`,
  },
};

export function resolveWelcomeStage(
  stageValue: unknown
): WelcomeStage {
  if (
    typeof stageValue === "string" &&
    WELCOME_STAGES.has(
      stageValue as WelcomeStage
    )
  ) {
    return stageValue as WelcomeStage;
  }

  return "business_overview";
}

export function getAllowedKeysForStage(
  stage: WelcomeStage,
  section: FoundationSection
): readonly string[] {
  return (
    FOUNDATION_STAGE_CONFIG[stage]
      .allowedKeys[section] || []
  );
}

export function normaliseFoundationKey(
  key: string
): string {
  const trimmedKey = key
    .trim()
    .replace(/\s+/g, " ");

  return (
    FOUNDATION_KEY_ALIASES[
      trimmedKey.toLowerCase()
    ] || trimmedKey
  );
}

export function isAllowedFoundationSection(
  value: string
): value is FoundationSection {
  return ALLOWED_FOUNDATION_SECTIONS.has(
    value as FoundationSection
  );
}