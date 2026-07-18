import { z } from "zod";

const optionalTrimmedString = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""));

const optionalNullableString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .or(z.literal(""));

const optionalDateString = z
  .string()
  .trim()
  .optional()
  .nullable()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) {
        return true;
      }

      return !Number.isNaN(Date.parse(value));
    },
    {
      message: "Enter a valid date.",
    },
  );

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .nullable()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) {
        return true;
      }

      return z.string().email().safeParse(value).success;
    },
    {
      message: "Enter a valid email address.",
    },
  );

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .nullable()
  .or(z.literal(""))
  .refine(
    (value) => {
      if (!value) {
        return true;
      }

      return /^[+\d][\d\s()-]{6,24}$/.test(value);
    },
    {
      message: "Enter a valid telephone number.",
    },
  );

const optionalPositiveNumber = z
  .union([
    z.number(),
    z
      .string()
      .trim()
      .transform((value) => {
        if (value === "") {
          return undefined;
        }

        return Number(value);
      }),
  ])
  .optional()
  .refine(
    (value) => {
      if (value === undefined) {
        return true;
      }

      return Number.isFinite(value) && value >= 0;
    },
    {
      message: "Enter a valid positive number.",
    },
  );

const optionalPositiveInteger = z
  .union([
    z.number(),
    z
      .string()
      .trim()
      .transform((value) => {
        if (value === "") {
          return undefined;
        }

        return Number(value);
      }),
  ])
  .optional()
  .refine(
    (value) => {
      if (value === undefined) {
        return true;
      }

      return Number.isInteger(value) && value >= 0;
    },
    {
      message: "Enter a valid whole number.",
    },
  );

export const vacancyEmploymentTypeSchema = z.enum([
  "permanent",
  "fixed_term",
  "temporary",
  "casual",
  "zero_hours",
  "apprenticeship",
  "internship",
  "contractor",
  "volunteer",
  "other",
]);

export const salaryPeriodSchema = z.enum([
  "hour",
  "day",
  "week",
  "month",
  "year",
  "fixed",
]);

export const vacancyStatusSchema = z.enum([
  "draft",
  "approval_required",
  "approved",
  "open",
  "paused",
  "closed",
  "filled",
  "cancelled",
  "archived",
]);

export const approvalStatusSchema = z.enum([
  "not_required",
  "pending",
  "approved",
  "returned",
  "declined",
]);

export const applicationStatusSchema = z.enum([
  "draft",
  "submitted",
  "active",
  "on_hold",
  "withdrawn",
  "rejected",
  "unsuccessful",
  "offered",
  "appointed",
  "archived",
]);

export const applicationRecommendationSchema = z.enum([
  "strong_proceed",
  "proceed",
  "hold",
  "do_not_proceed",
  "manual_review_required",
]);

export const interviewTypeSchema = z.enum([
  "telephone",
  "video",
  "in_person",
  "panel",
  "practical",
  "assessment",
  "presentation",
  "structured",
  "other",
]);

export const interviewStatusSchema = z.enum([
  "draft",
  "scheduled",
  "invited",
  "confirmed",
  "reschedule_requested",
  "cancelled",
  "completed",
  "no_show",
]);

export const interviewOutcomeSchema = z.enum([
  "proceed",
  "hold",
  "additional_stage",
  "offer",
  "unsuccessful",
  "withdrawn",
]);

export const offerTypeSchema = z.enum([
  "conditional",
  "unconditional",
  "verbal",
  "revised",
]);

export const offerStatusSchema = z.enum([
  "draft",
  "approval_required",
  "approved",
  "sent",
  "viewed",
  "accepted",
  "declined",
  "withdrawn",
  "expired",
  "superseded",
]);

export const appointmentStatusSchema = z.enum([
  "pre_employment",
  "checks_in_progress",
  "ready_to_start",
  "employee_creation_pending",
  "employee_created",
  "started",
  "withdrawn",
  "cancelled",
]);

export const dbsLevelSchema = z.enum([
  "basic",
  "standard",
  "enhanced",
  "enhanced_barred_list",
]);

export const verificationStatusSchema = z.enum([
  "not_checked",
  "pending",
  "verified",
  "rejected",
  "expired",
  "not_applicable",
]);

export const talentPoolStatusSchema = z.enum([
  "not_added",
  "active",
  "do_not_contact",
  "withdrawn",
  "archived",
]);

export const createVacancySchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Enter a vacancy title.")
      .max(160, "The vacancy title must be 160 characters or fewer."),

    department: optionalNullableString,

    location_name: optionalNullableString,

    site_id: optionalNullableString,

    hiring_manager_name: optionalNullableString,

    hiring_manager_user_id: optionalNullableString,

    employment_type: vacancyEmploymentTypeSchema,

    work_pattern: optionalNullableString,

    hours_per_week: optionalPositiveNumber,

    salary_min: optionalPositiveNumber,

    salary_max: optionalPositiveNumber,

    salary_period: salaryPeriodSchema.optional().nullable(),

    salary_currency: z
      .string()
      .trim()
      .min(3, "Enter a valid currency code.")
      .max(3, "Enter a valid currency code.")
      .default("GBP"),

    salary_visible: z.boolean().default(true),

    number_of_positions: z
      .union([
        z.number(),
        z
          .string()
          .trim()
          .transform((value) => Number(value)),
      ])
      .refine(
        (value) => Number.isInteger(value) && value >= 1,
        {
          message: "Enter at least one position.",
        },
      ),

    role_summary: optionalNullableString,

    responsibilities: optionalNullableString,

    essential_criteria: optionalNullableString,

    desirable_criteria: optionalNullableString,

    benefits: optionalNullableString,

    advert_text: optionalNullableString,

    status: vacancyStatusSchema.default("draft"),

    approval_status: approvalStatusSchema.default("not_required"),

    approval_notes: optionalNullableString,

    opening_date: optionalDateString,

    closing_date: optionalDateString,

    target_start_date: optionalDateString,

    recruitment_lead_name: optionalNullableString,

    recruitment_lead_user_id: optionalNullableString,

    is_internal_only: z.boolean().default(false),

    accepts_internal_candidates: z.boolean().default(true),

    blind_review_enabled: z.boolean().default(false),

    ai_screening_enabled: z.boolean().default(false),

    safer_recruitment_required: z.boolean().default(false),

    regulated_role: z.boolean().default(false),

    requires_dbs: z.boolean().default(false),

    dbs_level: dbsLevelSchema.optional().nullable(),

    requires_driving: z.boolean().default(false),

    requires_qualification_checks: z.boolean().default(false),

    required_reference_count: optionalPositiveInteger.default(0),

    overseas_check_required_if_applicable: z.boolean().default(false),

    application_form_template_id: optionalNullableString,

    interview_template_id: optionalNullableString,

    onboarding_template_id: optionalNullableString,
  })
  .superRefine((data, context) => {
    if (
      data.salary_min !== undefined &&
      data.salary_max !== undefined &&
      data.salary_max < data.salary_min
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salary_max"],
        message:
          "The maximum salary cannot be lower than the minimum salary.",
      });
    }

    if (
      data.opening_date &&
      data.closing_date &&
      new Date(data.closing_date) < new Date(data.opening_date)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["closing_date"],
        message:
          "The closing date cannot be earlier than the opening date.",
      });
    }

    if (data.requires_dbs && !data.dbs_level) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["dbs_level"],
        message: "Select the required DBS level.",
      });
    }

    if (
      data.status === "open" &&
      (!data.role_summary ||
        !data.essential_criteria ||
        !data.advert_text)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["status"],
        message:
          "A vacancy cannot be opened until the role summary, essential criteria and advert text are complete.",
      });
    }
  });

export const updateVacancySchema = createVacancySchema.extend({
  id: z.string().uuid("A valid vacancy ID is required."),
});

export const archiveVacancySchema = z.object({
  id: z.string().uuid("A valid vacancy ID is required."),
  archive_reason: z
    .string()
    .trim()
    .min(3, "Enter a reason for archiving this vacancy.")
    .max(500, "The archive reason must be 500 characters or fewer."),
});

export const createCandidateSchema = z
  .object({
    first_name: z
      .string()
      .trim()
      .min(1, "Enter the candidate's first name.")
      .max(100, "The first name must be 100 characters or fewer."),

    middle_names: optionalNullableString,

    last_name: z
      .string()
      .trim()
      .min(1, "Enter the candidate's last name.")
      .max(100, "The last name must be 100 characters or fewer."),

    preferred_name: optionalNullableString,

    email: optionalEmail,

    phone: optionalPhone,

    address_line_1: optionalNullableString,

    address_line_2: optionalNullableString,

    town_city: optionalNullableString,

    county_region: optionalNullableString,

    postcode: optionalNullableString,

    country: optionalNullableString,

    is_internal_candidate: z.boolean().default(false),

    existing_employee_id: optionalPositiveInteger,

    source: optionalNullableString,

    source_detail: optionalNullableString,

    talent_pool_status: talentPoolStatusSchema.default("not_added"),

    consent_to_contact: z.boolean().default(false),

    privacy_notice_version: optionalNullableString,

    data_retention_review_date: optionalDateString,

    do_not_contact: z.boolean().default(false),

    do_not_contact_reason: optionalNullableString,

    summary: optionalNullableString,

    skills: z.array(z.string().trim().min(1)).default([]),
  })
  .superRefine((data, context) => {
    if (!data.email && !data.phone) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["email"],
        message:
          "Enter at least an email address or telephone number.",
      });
    }

    if (data.is_internal_candidate && !data.existing_employee_id) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["existing_employee_id"],
        message:
          "Select the employee record for an internal candidate.",
      });
    }

    if (data.do_not_contact && !data.do_not_contact_reason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["do_not_contact_reason"],
        message:
          "Enter a reason why the candidate must not be contacted.",
      });
    }
  });

export const updateCandidateSchema = createCandidateSchema.extend({
  id: z.string().uuid("A valid candidate ID is required."),
});

export const createApplicationSchema = z.object({
  vacancy_id: z.string().uuid("Select a valid vacancy."),

  candidate_id: z.string().uuid("Select a valid candidate."),

  current_stage_key: z
    .string()
    .trim()
    .min(1, "Select an application stage.")
    .default("new_application"),

  status: applicationStatusSchema.default("submitted"),

  source: optionalNullableString,

  blind_review_enabled: z.boolean().default(false),

  ai_screening_enabled: z.boolean().default(false),
});

export const updateApplicationStatusSchema = z.object({
  id: z.string().uuid("A valid application ID is required."),

  status: applicationStatusSchema,

  reason: optionalTrimmedString,

  current_stage_key: optionalTrimmedString,
});

export const applicationReviewSchema = z.object({
  application_id: z.string().uuid("A valid application ID is required."),

  manual_score: z
    .number()
    .min(0, "The score cannot be below zero.")
    .max(100, "The score cannot exceed 100.")
    .optional()
    .nullable(),

  recommendation: applicationRecommendationSchema.optional().nullable(),

  recommendation_reason: optionalNullableString,

  review_notes: optionalNullableString,

  knockout_failed: z.boolean().default(false),

  knockout_details: z.array(z.string().trim().min(1)).default([]),
});

export const createInterviewSchema = z
  .object({
    application_id: z.string().uuid("Select a valid application."),

    vacancy_id: z.string().uuid("Select a valid vacancy."),

    candidate_id: z.string().uuid("Select a valid candidate."),

    template_id: z.string().uuid().optional().nullable(),

    stage_number: z
      .union([
        z.number(),
        z
          .string()
          .trim()
          .transform((value) => Number(value)),
      ])
      .refine(
        (value) => Number.isInteger(value) && value >= 1,
        {
          message: "Enter a valid interview stage number.",
        },
      ),

    stage_name: z
      .string()
      .trim()
      .min(1, "Enter the interview stage name.")
      .max(160, "The stage name must be 160 characters or fewer."),

    interview_type: interviewTypeSchema,

    status: interviewStatusSchema.default("draft"),

    scheduled_start: optionalDateString,

    scheduled_end: optionalDateString,

    timezone_name: z
      .string()
      .trim()
      .min(1, "Enter a timezone.")
      .default("Europe/London"),

    location: optionalNullableString,

    meeting_url: z
      .string()
      .trim()
      .optional()
      .nullable()
      .or(z.literal(""))
      .refine(
        (value) => {
          if (!value) {
            return true;
          }

          return z.string().url().safeParse(value).success;
        },
        {
          message: "Enter a valid meeting URL.",
        },
      ),

    candidate_instructions: optionalNullableString,

    internal_instructions: optionalNullableString,
  })
  .superRefine((data, context) => {
    if (
      data.scheduled_start &&
      data.scheduled_end &&
      new Date(data.scheduled_end) <= new Date(data.scheduled_start)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduled_end"],
        message:
          "The interview end time must be later than the start time.",
      });
    }

    if (
      ["scheduled", "invited", "confirmed"].includes(data.status) &&
      (!data.scheduled_start || !data.scheduled_end)
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["scheduled_start"],
        message:
          "A scheduled interview requires a start and end time.",
      });
    }

    if (
      data.interview_type === "video" &&
      !data.meeting_url
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["meeting_url"],
        message:
          "A video interview requires a meeting URL.",
      });
    }

    if (
      data.interview_type === "in_person" &&
      !data.location
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["location"],
        message:
          "An in-person interview requires a location.",
      });
    }
  });

export const updateInterviewSchema = createInterviewSchema.extend({
  id: z.string().uuid("A valid interview ID is required."),
});

export const interviewOutcomeFormSchema = z.object({
  interview_id: z.string().uuid("A valid interview ID is required."),

  outcome: interviewOutcomeSchema,

  outcome_reason: z
    .string()
    .trim()
    .min(3, "Enter a reason for the interview outcome.")
    .max(3000, "The outcome reason must be 3,000 characters or fewer."),

  overall_score: z
    .number()
    .min(0, "The score cannot be below zero.")
    .max(100, "The score cannot exceed 100.")
    .optional()
    .nullable(),
});

export const createOfferSchema = z
  .object({
    application_id: z.string().uuid("Select a valid application."),

    vacancy_id: z.string().uuid("Select a valid vacancy."),

    candidate_id: z.string().uuid("Select a valid candidate."),

    offer_type: offerTypeSchema.default("conditional"),

    status: offerStatusSchema.default("draft"),

    job_title: z
      .string()
      .trim()
      .min(2, "Enter the job title.")
      .max(160, "The job title must be 160 characters or fewer."),

    department: optionalNullableString,

    location_name: optionalNullableString,

    manager_name: optionalNullableString,

    manager_user_id: optionalNullableString,

    employment_type: z
      .string()
      .trim()
      .min(1, "Select an employment type."),

    proposed_start_date: optionalDateString,

    hours_per_week: optionalPositiveNumber,

    work_pattern: optionalNullableString,

    salary_amount: optionalPositiveNumber,

    salary_period: salaryPeriodSchema.optional().nullable(),

    salary_currency: z
      .string()
      .trim()
      .length(3, "Enter a valid currency code.")
      .default("GBP"),

    probation_months: optionalPositiveInteger,

    holiday_allowance_days: optionalPositiveNumber,

    notice_period: optionalNullableString,

    conditions: z.array(z.string().trim().min(1)).default([]),

    approval_status: approvalStatusSchema.default("not_required"),

    approval_notes: optionalNullableString,

    response_deadline: optionalDateString,
  })
  .superRefine((data, context) => {
    if (
      data.salary_amount !== undefined &&
      !data.salary_period
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["salary_period"],
        message:
          "Select the salary period for the offered salary.",
      });
    }

    if (
      data.offer_type === "conditional" &&
      data.conditions.length === 0
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["conditions"],
        message:
          "A conditional offer must include at least one condition.",
      });
    }

    if (
      ["sent", "viewed"].includes(data.status) &&
      !data.response_deadline
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["response_deadline"],
        message:
          "A sent offer requires a response deadline.",
      });
    }
  });

export const updateOfferSchema = createOfferSchema.extend({
  id: z.string().uuid("A valid offer ID is required."),
});

export const offerResponseSchema = z
  .object({
    offer_id: z.string().uuid("A valid offer ID is required."),

    response: z.enum(["accepted", "declined"]),

    response_notes: optionalNullableString,

    decline_reason: optionalNullableString,
  })
  .superRefine((data, context) => {
    if (
      data.response === "declined" &&
      !data.decline_reason
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["decline_reason"],
        message:
          "Enter the candidate's reason for declining the offer.",
      });
    }
  });

export const archiveTalentRecordSchema = z.object({
  id: z.string().uuid("A valid record ID is required."),

  record_type: z.enum([
    "vacancy",
    "candidate",
    "application",
    "interview",
    "offer",
    "appointment",
  ]),

  archive_reason: z
    .string()
    .trim()
    .min(3, "Enter a reason for archiving this record.")
    .max(500, "The archive reason must be 500 characters or fewer."),
});

export const talentNoteSchema = z.object({
  parent_id: z.string().uuid("A valid parent record ID is required."),

  parent_type: z.enum([
    "vacancy",
    "candidate",
    "application",
    "interview",
    "offer",
    "appointment",
  ]),

  note: z
    .string()
    .trim()
    .min(1, "Enter a note.")
    .max(10000, "The note must be 10,000 characters or fewer."),

  visibility: z
    .enum(["internal", "restricted"])
    .default("internal"),
});

export const talentDocumentSchema = z.object({
  parent_id: z.string().uuid("A valid parent record ID is required."),

  parent_type: z.enum([
    "vacancy",
    "candidate",
    "application",
    "interview",
    "offer",
    "appointment",
  ]),

  title: z
    .string()
    .trim()
    .min(1, "Enter a document title.")
    .max(200, "The document title must be 200 characters or fewer."),

  document_category: z
    .string()
    .trim()
    .min(1, "Select a document category."),

  file_name: z
    .string()
    .trim()
    .min(1, "A file name is required."),

  file_path: z
    .string()
    .trim()
    .min(1, "A file path is required."),

  file_type: optionalNullableString,

  notes: optionalNullableString,
});

export const talentListFiltersSchema = z.object({
  search: optionalTrimmedString,

  status: optionalTrimmedString,

  vacancyId: z.string().uuid().optional().or(z.literal("")),

  candidateId: z.string().uuid().optional().or(z.literal("")),

  applicationId: z.string().uuid().optional().or(z.literal("")),

  dateFrom: optionalDateString,

  dateTo: optionalDateString,

  archived: z.boolean().default(false),

  page: z.coerce.number().int().min(1).default(1),

  pageSize: z.coerce
    .number()
    .int()
    .min(10)
    .max(100)
    .default(25),
});

export type CreateVacancyInput = z.infer<
  typeof createVacancySchema
>;

export type UpdateVacancyInput = z.infer<
  typeof updateVacancySchema
>;

export type ArchiveVacancyInput = z.infer<
  typeof archiveVacancySchema
>;

export type CreateCandidateInput = z.infer<
  typeof createCandidateSchema
>;

export type UpdateCandidateInput = z.infer<
  typeof updateCandidateSchema
>;

export type CreateApplicationInput = z.infer<
  typeof createApplicationSchema
>;

export type UpdateApplicationStatusInput = z.infer<
  typeof updateApplicationStatusSchema
>;

export type ApplicationReviewInput = z.infer<
  typeof applicationReviewSchema
>;

export type CreateInterviewInput = z.infer<
  typeof createInterviewSchema
>;

export type UpdateInterviewInput = z.infer<
  typeof updateInterviewSchema
>;

export type InterviewOutcomeInput = z.infer<
  typeof interviewOutcomeFormSchema
>;

export type CreateOfferInput = z.infer<
  typeof createOfferSchema
>;

export type UpdateOfferInput = z.infer<
  typeof updateOfferSchema
>;

export type OfferResponseInput = z.infer<
  typeof offerResponseSchema
>;

export type ArchiveTalentRecordInput = z.infer<
  typeof archiveTalentRecordSchema
>;

export type TalentNoteInput = z.infer<
  typeof talentNoteSchema
>;

export type TalentDocumentInput = z.infer<
  typeof talentDocumentSchema
>;

export type TalentListFiltersInput = z.infer<
  typeof talentListFiltersSchema
>;