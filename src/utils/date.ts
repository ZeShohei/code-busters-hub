import type { RotationAssignment } from "@/types/team";

export const parseDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
};

export const normalizeDate = (date: Date) => {
  const normalizedDate = new Date(date);

  normalizedDate.setHours(0, 0, 0, 0);

  return normalizedDate;
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parseDate(dateString));
};

export const formatWeekDay = (date: Date) => {
  return new Intl.DateTimeFormat("de-AT", {
    weekday: "short",
  }).format(date);
};

export const formatDayMonth = (date: Date) => {
  return new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
};

export const formatWeekRange = (startDate: Date, endDate: Date) => {
  const start = new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
  }).format(startDate);

  const end = new Intl.DateTimeFormat("de-AT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(endDate);

  return `${start} – ${end}`;
};

export const isDateInRange = (
  startDate: string,
  endDate: string,
  date = new Date(),
) => {
  const currentDate = normalizeDate(date);
  const start = normalizeDate(parseDate(startDate));
  const end = normalizeDate(parseDate(endDate));

  return currentDate >= start && currentDate <= end;
};

export const isDateAfter = (
  dateString: string,
  comparisonDate = new Date(),
) => {
  const date = normalizeDate(parseDate(dateString));
  const comparison = normalizeDate(comparisonDate);

  return date > comparison;
};

export const isSameDay = (firstDate: Date, secondDate: Date) => {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
};

export const addDays = (date: Date, amount: number) => {
  const result = new Date(date);

  result.setDate(result.getDate() + amount);

  return result;
};

export const addWeeks = (date: Date, amount: number) => {
  return addDays(date, amount * 7);
};

export const getMonday = (date: Date) => {
  const result = normalizeDate(date);

  const day = result.getDay();

  const diffToMonday = day === 0 ? -6 : 1 - day;

  result.setDate(result.getDate() + diffToMonday);

  return result;
};

export const getWeekDays = (date = new Date()) => {
  const monday = getMonday(date);

  return Array.from({ length: 5 }, (_, index) => addDays(monday, index));
};

export const getCurrentRotation = (
  rotations: RotationAssignment[],
  date = new Date(),
): RotationAssignment | undefined => {
  return rotations.find((rotation) =>
    isDateInRange(rotation.startDate, rotation.endDate, date),
  );
};

export const getCalendarWeek = (dateString: string) => {
  const parsedDate = parseDate(dateString);

  const date = new Date(
    Date.UTC(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate(),
    ),
  );

  const dayNumber = date.getUTCDay() || 7;

  date.setUTCDate(date.getUTCDate() + 4 - dayNumber);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));

  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
};
