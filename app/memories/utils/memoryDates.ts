export function getLocalDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function isDateKey(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function getMemoryDateKey(
  memoryDate?: string | null,
  createdAt?: string | null,
) {
  if (isDateKey(memoryDate)) {
    return memoryDate;
  }

  if (createdAt) {
    return getLocalDateKey(new Date(createdAt));
  }

  return getLocalDateKey(new Date());
}

export function getMemoryDisplayDate(
  memoryDate?: string | null,
  createdAt?: string | null,
) {
  const dateKey = getMemoryDateKey(memoryDate, createdAt);
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

export function combineDateKeyWithCurrentTime(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  const now = new Date();
  const combined = new Date(
    year,
    month - 1,
    day,
    now.getHours(),
    now.getMinutes(),
    now.getSeconds(),
    now.getMilliseconds(),
  );

  return combined.toISOString();
}
