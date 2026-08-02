import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Groups any already rank-sorted list (merit list entries, static Top 10
 * entries, etc.) by their `rank` field so that students who are tied for
 * the same position can be rendered as ONE row/slot with multiple names,
 * instead of one row per student. Assumes the input is already sorted by
 * rank (which every merit-list source in this app is). Used everywhere a
 * Top 10 / merit list / certificate rank is shown, so tie handling stays
 * identical across the site.
 */
export function groupByRank<T extends { rank: number }>(
  entries: T[]
): { rank: number; entries: T[] }[] {
  const groups: { rank: number; entries: T[] }[] = [];
  for (const entry of entries) {
    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.rank === entry.rank) {
      lastGroup.entries.push(entry);
    } else {
      groups.push({ rank: entry.rank, entries: [entry] });
    }
  }
  return groups;
}
