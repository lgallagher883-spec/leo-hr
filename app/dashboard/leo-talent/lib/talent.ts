import {
  APPLICATION_STATUS_OPTIONS,
  APPOINTMENT_STATUS_OPTIONS,
  INTERVIEW_STATUS_OPTIONS,
  OFFER_STATUS_OPTIONS,
  TALENT_DEFAULT_PAGE_SIZE,
  VACANCY_STATUS_OPTIONS,
  getTalentOptionLabel,
} from "../constants/talent";

import type {
  ApplicationStatus,
  AppointmentStatus,
  InterviewStatus,
  OfferStatus,
  TalentActionResult,
  TalentPagination,
  VacancyStatus,
} from "../types/talent";

export function formatTalentDate(
  value: string | Date | null | undefined,
  fallback = "Not set",
): string {
  if (!value) {
    return fallback;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTalentDateTime(
  value: string | Date | null | undefined,
  fallback = "Not set",
): string {
  if (!value) {
    return fallback;
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return fallback;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatTalentCurrency(
  value: number | null | undefined,
  currency = "GBP",
  fallback = "Not set",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function formatTalentNumber(
  value: number | null | undefined,
  fallback = "0",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return new Intl.NumberFormat("en-GB").format(value);
}

export function formatTalentPercentage(
  value: number | null | undefined,
  fallback = "Not set",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return `${Math.round(value)}%`;
}

export function formatTalentHours(
  value: number | null | undefined,
  fallback = "Not set",
): string {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return fallback;
  }

  return `${value} ${value === 1 ? "hour" : "hours"}`;
}

export function formatTalentFullName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  preferredName?: string | null,
): string {
  const first = preferredName?.trim() || firstName?.trim() || "";
  const last = lastName?.trim() || "";

  const fullName = [first, last].filter(Boolean).join(" ").trim();

  return fullName || "Unnamed candidate";
}

export function formatVacancyStatus(status: VacancyStatus): string {
  return getTalentOptionLabel(VACANCY_STATUS_OPTIONS, status);
}

export function formatApplicationStatus(
  status: ApplicationStatus,
): string {
  return getTalentOptionLabel(APPLICATION_STATUS_OPTIONS, status);
}

export function formatInterviewStatus(
  status: InterviewStatus,
): string {
  return getTalentOptionLabel(INTERVIEW_STATUS_OPTIONS, status);
}

export function formatOfferStatus(status: OfferStatus): string {
  return getTalentOptionLabel(OFFER_STATUS_OPTIONS, status);
}

export function formatAppointmentStatus(
  status: AppointmentStatus,
): string {
  return getTalentOptionLabel(APPOINTMENT_STATUS_OPTIONS, status);
}

export function normaliseTalentSearchTerm(
  value: string | null | undefined,
): string {
  return value?.trim().toLowerCase() ?? "";
}

export function matchesTalentSearch(
  searchTerm: string,
  values: Array<string | number | null | undefined>,
): boolean {
  const normalisedSearch = normaliseTalentSearchTerm(searchTerm);

  if (!normalisedSearch) {
    return true;
  }

  return values.some((value) =>
    String(value ?? "")
      .toLowerCase()
      .includes(normalisedSearch),
  );
}

export function createTalentPagination(
  totalRecords: number,
  requestedPage = 1,
  requestedPageSize = TALENT_DEFAULT_PAGE_SIZE,
): TalentPagination {
  const safeTotalRecords = Math.max(0, totalRecords);

  const safePageSize = Math.min(
    100,
    Math.max(1, requestedPageSize),
  );

  const totalPages = Math.max(
    1,
    Math.ceil(safeTotalRecords / safePageSize),
  );

  const page = Math.min(
    totalPages,
    Math.max(1, requestedPage),
  );

  return {
    page,
    pageSize: safePageSize,
    totalRecords: safeTotalRecords,
    totalPages,
  };
}

export function getTalentPaginationRange(
  pagination: TalentPagination,
): {
  from: number;
  to: number;
} {
  if (pagination.totalRecords === 0) {
    return {
      from: 0,
      to: 0,
    };
  }

  const from =
    (pagination.page - 1) * pagination.pageSize + 1;

  const to = Math.min(
    pagination.page * pagination.pageSize,
    pagination.totalRecords,
  );

  return {
    from,
    to,
  };
}

export function getTalentDatabaseRange(
  page = 1,
  pageSize = TALENT_DEFAULT_PAGE_SIZE,
): {
  from: number;
  to: number;
} {
  const safePage = Math.max(1, page);
  const safePageSize = Math.min(100, Math.max(1, pageSize));

  const from = (safePage - 1) * safePageSize;
  const to = from + safePageSize - 1;

  return {
    from,
    to,
  };
}

export function calculateTalentDaysUntil(
  value: string | Date | null | undefined,
): number | null {
  if (!value) {
    return null;
  }

  const targetDate =
    value instanceof Date ? new Date(value) : new Date(value);

  if (Number.isNaN(targetDate.getTime())) {
    return null;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  targetDate.setHours(0, 0, 0, 0);

  const millisecondsPerDay = 1000 * 60 * 60 * 24;

  return Math.ceil(
    (targetDate.getTime() - today.getTime()) /
      millisecondsPerDay,
  );
}

export function describeTalentDueDate(
  value: string | Date | null | undefined,
): string {
  const daysUntil = calculateTalentDaysUntil(value);

  if (daysUntil === null) {
    return "No date set";
  }

  if (daysUntil === 0) {
    return "Due today";
  }

  if (daysUntil === 1) {
    return "Due tomorrow";
  }

  if (daysUntil > 1) {
    return `Due in ${daysUntil} days`;
  }

  if (daysUntil === -1) {
    return "Overdue by 1 day";
  }

  return `Overdue by ${Math.abs(daysUntil)} days`;
}

export function isTalentDateOverdue(
  value: string | Date | null | undefined,
): boolean {
  const daysUntil = calculateTalentDaysUntil(value);

  return daysUntil !== null && daysUntil < 0;
}

export function isTalentDateDueSoon(
  value: string | Date | null | undefined,
  days = 30,
): boolean {
  const daysUntil = calculateTalentDaysUntil(value);

  return (
    daysUntil !== null &&
    daysUntil >= 0 &&
    daysUntil <= days
  );
}

export function truncateTalentText(
  value: string | null | undefined,
  maximumLength = 120,
): string {
  const text = value?.trim() ?? "";

  if (!text) {
    return "";
  }

  if (text.length <= maximumLength) {
    return text;
  }

  return `${text.slice(0, maximumLength - 1).trim()}…`;
}

export function createTalentReference(
  prefix: string,
  sequence: number,
  date = new Date(),
): string {
  const year = date.getFullYear();

  const safePrefix = prefix
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);

  const safeSequence = Math.max(1, sequence)
    .toString()
    .padStart(5, "0");

  return `${safePrefix}-${year}-${safeSequence}`;
}

export function createCandidateInitials(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const firstInitial = firstName?.trim().charAt(0) ?? "";
  const lastInitial = lastName?.trim().charAt(0) ?? "";

  return `${firstInitial}${lastInitial}`.toUpperCase() || "C";
}

export function cleanTalentNullableString(
  value: string | null | undefined,
): string | null {
  const cleanedValue = value?.trim();

  return cleanedValue ? cleanedValue : null;
}

export function cleanTalentStringArray(
  values: Array<string | null | undefined>,
): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
}

export function safeTalentNumber(
  value: string | number | null | undefined,
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const parsedValue =
    typeof value === "number" ? value : Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

export function safeTalentInteger(
  value: string | number | null | undefined,
): number | null {
  const parsedValue = safeTalentNumber(value);

  if (parsedValue === null || !Number.isInteger(parsedValue)) {
    return null;
  }

  return parsedValue;
}

export function safeTalentBoolean(
  value: FormDataEntryValue | boolean | null | undefined,
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return false;
  }

  return ["true", "1", "on", "yes"].includes(
    value.trim().toLowerCase(),
  );
}

export function formDataToTalentObject(
  formData: FormData,
): Record<string, FormDataEntryValue | FormDataEntryValue[]> {
  const output: Record<
    string,
    FormDataEntryValue | FormDataEntryValue[]
  > = {};

  for (const [key, value] of formData.entries()) {
    const existingValue = output[key];

    if (existingValue === undefined) {
      output[key] = value;
      continue;
    }

    output[key] = Array.isArray(existingValue)
      ? [...existingValue, value]
      : [existingValue, value];
  }

  return output;
}

export function flattenTalentFieldErrors(
  fieldErrors:
    | Record<string, string[] | undefined>
    | undefined,
): Record<string, string[]> {
  if (!fieldErrors) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(fieldErrors).map(([field, messages]) => [
      field,
      messages?.filter(Boolean) ?? [],
    ]),
  );
}

export function getFirstTalentFieldError(
  fieldErrors:
    | Record<string, string[] | undefined>
    | undefined,
  field: string,
): string | undefined {
  return fieldErrors?.[field]?.[0];
}

export function createTalentSuccessResult<T>(
  message: string,
  data?: T,
): TalentActionResult<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function createTalentErrorResult(
  message: string,
  fieldErrors?: Record<string, string[]>,
): TalentActionResult {
  return {
    success: false,
    message,
    fieldErrors,
  };
}

export function getTalentErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return fallback;
}

export function isTalentUniqueConstraintError(
  error: unknown,
): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const code =
    "code" in error && typeof error.code === "string"
      ? error.code
      : "";

  return code === "23505";
}

export function isTalentForeignKeyError(
  error: unknown,
): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const code =
    "code" in error && typeof error.code === "string"
      ? error.code
      : "";

  return code === "23503";
}

export function isTalentNotFoundError(
  error: unknown,
): boolean {
  if (
    typeof error !== "object" ||
    error === null
  ) {
    return false;
  }

  const code =
    "code" in error && typeof error.code === "string"
      ? error.code
      : "";

  return code === "PGRST116";
}

export function createTalentSlug(
  value: string,
): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function sortTalentByDateDescending<
  T extends Record<string, unknown>,
>(
  records: T[],
  field: keyof T,
): T[] {
  return [...records].sort((firstRecord, secondRecord) => {
    const firstValue = firstRecord[field];
    const secondValue = secondRecord[field];

    const firstDate =
      typeof firstValue === "string" ||
      firstValue instanceof Date
        ? new Date(firstValue).getTime()
        : 0;

    const secondDate =
      typeof secondValue === "string" ||
      secondValue instanceof Date
        ? new Date(secondValue).getTime()
        : 0;

    return secondDate - firstDate;
  });
}

export function removeTalentUndefinedValues<
  T extends Record<string, unknown>,
>(
  value: T,
): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entryValue]) => entryValue !== undefined,
    ),
  ) as Partial<T>;
}