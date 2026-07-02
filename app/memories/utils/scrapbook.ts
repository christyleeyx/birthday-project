export interface ScrapbookEntry {
  label: string;
  text: string;
  badgeClassName: string;
  cardClassName: string;
  timestamp: string;
}

const palette = [
  {
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    card: "border-rose-200 bg-rose-50",
  },
  {
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    card: "border-amber-200 bg-amber-50",
  },
  {
    badge: "border-violet-200 bg-violet-50 text-violet-700",
    card: "border-violet-200 bg-violet-50",
  },
  {
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    card: "border-sky-200 bg-sky-50",
  },
] as const;

function getPaletteStyle(author: string, index: number) {
  if (!author) {
    return palette[index % palette.length];
  }

  let hash = 0;
  for (const character of author.toLowerCase()) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return palette[hash % palette.length];
}

function inferLabel(author: string, index: number) {
  if (!author) {
    return index % 2 === 0 ? "You" : "Partner";
  }

  const normalized = author.trim().toLowerCase();

  if (["you", "me", "i"].includes(normalized)) {
    return "You";
  }

  if (["partner", "them", "they", "he", "she", "us", "we"].includes(normalized)) {
    return "Partner";
  }

  return author.trim();
}

export function buildScrapbookParagraph(author: string, text: string, timestamp: string = new Date().toISOString()) {
  const trimmedAuthor = author.trim();
  const trimmedText = text.trim();

  if (!trimmedAuthor || !trimmedText) {
    return trimmedText;
  }

  return `[${timestamp}] ${trimmedAuthor}: ${trimmedText}`;
}

function getFallbackTimestamp(baseTimestamp: string, index: number) {
  const baseTime = new Date(baseTimestamp).getTime();
  const safeBaseTime = Number.isNaN(baseTime) ? 0 : baseTime;

  return new Date(safeBaseTime + index).toISOString();
}

export function parseScrapbookEntries(
  content: string | null,
  fallbackTimestamp = "1970-01-01T00:00:00.000Z",
): ScrapbookEntry[] {
  if (!content) {
    return [];
  }

  return content
    .split(/\n\s*\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((paragraph, index) => {
      // Match format: [TIMESTAMP] Author: text
      const timestampMatch = paragraph.match(/^\[([^\]]+)\]\s*/);
      const parsedTimestamp = timestampMatch?.[1];
      const timestamp =
        parsedTimestamp && !Number.isNaN(new Date(parsedTimestamp).getTime())
          ? parsedTimestamp
          : getFallbackTimestamp(fallbackTimestamp, index);
      const contentWithoutTimestamp = paragraph.replace(/^\[[^\]]+\]\s*/, "");

      const match = contentWithoutTimestamp.match(/^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .''/-]+)\s*[:—-]\s*(.+)$/);
      const author = match?.[1]?.trim() ?? "";
      const text = match?.[2]?.trim() ?? contentWithoutTimestamp;
      const style = getPaletteStyle(author, index);

      return {
        label: inferLabel(author, index),
        text,
        badgeClassName: style.badge,
        cardClassName: style.card,
        timestamp,
      };
    });
}
