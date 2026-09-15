// Season-derivation helpers.
//
// Seasons are derived purely from a game's date (no backend changes).
// NBA seasons span October through June and are labeled by their START year:
//   Oct 2024 – Jun 2025  =>  "2024-25"
//
// Dates are parsed from their calendar date-part (YYYY-MM-DD) so this is
// immune to browser timezone shifts near the season boundary.

const getParts = (date) => {
  if (date == null) return null;

  if (date instanceof Date) {
    return { year: date.getFullYear(), month: date.getMonth() + 1 };
  }

  if (typeof date === 'number') {
    const d = new Date(date);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  }

  // Strings: assume an ISO date/datetime like "2024-10-05" or "2024-10-05T...".
  const parts = String(date).slice(0, 10).split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return null;
  return { year: parts[0], month: parts[1] };
};

export const getSeasonKey = (date) => {
  const p = getParts(date);
  if (!p) return 'Unknown';
  const start = p.month >= 10 ? p.year : p.year - 1;
  return `${start}-${String(start + 1).slice(2)}`;
};

export const getSeasonLabel = (key) => (key ? `${key} Season` : 'Season');

// Returns the distinct season keys across the given games/records, sorted
// ascending so the most recent season is the last element.
export const getAvailableSeasons = (records = []) => {
  const keys = new Set(
    records.map((r) => getSeasonKey(r.date)).filter((k) => k !== 'Unknown')
  );
  return [...keys].sort();
};