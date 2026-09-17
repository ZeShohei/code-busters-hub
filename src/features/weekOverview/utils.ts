import type { RotationAssignment } from "@/types/team";

const parseDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);

  return new Date(year, month - 1, day);
};

const normalizeDate = (date: Date) => {
  const normalizedDate = new Date(date);

  normalizedDate.setHours(0, 0, 0, 0);

  return normalizedDate;
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

export const getCurrentRotation = (
  rotations: RotationAssignment[],
  date = new Date(),
): RotationAssignment | undefined => {
  return rotations.find((rotation) =>
    isDateInRange(rotation.startDate, rotation.endDate, date),
  );
};

export const getWeekDays = (date = new Date()) => {
  const currentDate = normalizeDate(date);

  const day = currentDate.getDay();

  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(currentDate);

  monday.setDate(currentDate.getDate() + diffToMonday);

  return Array.from({ length: 5 }, (_, index) => {
    const weekDay = new Date(monday);

    weekDay.setDate(monday.getDate() + index);

    return weekDay;
  });
};

export const addWeeks = (date: Date, amount: number) => {
  const result = new Date(date);

  result.setDate(result.getDate() + amount * 7);

  return result;
};

export const isSameDay = (firstDate: Date, secondDate: Date) => {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  );
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
