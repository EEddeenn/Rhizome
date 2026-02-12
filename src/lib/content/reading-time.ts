const WORDS_PER_MINUTE = 200;

export function estimateReadingTime(text: string): {
  wordCount: number;
  minutes: number;
} {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE);
  return { wordCount, minutes };
}
