export function addDays(
  dateValue: string,
  days: number
): string {
  const date = new Date(`${dateValue}T12:00:00`);

  date.setDate(date.getDate() + days);

  return toDateInputValue(date);
}

export function addMonths(
  dateValue: string,
  months: number
): string {
  const date = new Date(`${dateValue}T12:00:00`);

  date.setMonth(date.getMonth() + months);

  return toDateInputValue(date);
}

export function toDateInputValue(date: Date): string {
  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(
    2,
    "0"
  );

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getTodayDate(): string {
  return toDateInputValue(new Date());
}

export function formatDate(dateValue: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateValue}T12:00:00`));
}