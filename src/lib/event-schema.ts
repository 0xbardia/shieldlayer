export const AIRLINES = ["BA", "AA", "DL", "UA", "LH", "AF"] as const;
export const STORM_LOCATIONS = [
  "MIA",
  "NYC",
  "LON",
  "TYO",
  "BER",
  "PAR",
  "DXB",
  "SIN",
  "LAX",
  "CHI",
] as const;
export const COMPANIES = [
  "AAPL",
  "MSFT",
  "GOOG",
  "AMZN",
  "META",
  "TSLA",
  "NVDA",
  "JPM",
  "XOM",
  "BAC",
] as const;

const FLIGHT_RE = /^[A-Z]{2,3}[0-9]{1,4}[A-Z]?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export type PolicyKind = "flight_delay" | "storm" | "bankruptcy";

export type FlightFields = { flight: string; date: string; hours: number };
export type StormFields = { location: string; date: string; wind_kmh: number };
export type CompanyFields = { company: string; date: string };

export function validateEvent(
  type: PolicyKind,
  fields: Record<string, string | number>,
): { ok: true; payload: string } | { ok: false; error: string } {
  const date = String(fields.date ?? "");
  if (!DATE_RE.test(date)) return { ok: false, error: "Date must be YYYY-MM-DD" };

  if (type === "flight_delay") {
    const flight = String(fields.flight ?? "").toUpperCase();
    const hours = Number(fields.hours ?? 3);
    if (!FLIGHT_RE.test(flight)) return { ok: false, error: "Invalid flight number" };
    if (hours < 1 || hours > 48) return { ok: false, error: "Hours must be 1–48" };
    const payload: FlightFields = { flight, date, hours };
    return { ok: true, payload: JSON.stringify(payload) };
  }
  if (type === "storm") {
    const location = String(fields.location ?? "").toUpperCase();
    const wind = Number(fields.wind_kmh ?? 80);
    if (!(STORM_LOCATIONS as readonly string[]).includes(location)) {
      return { ok: false, error: "Location is not in the allowlist" };
    }
    if (wind < 40 || wind > 300) return { ok: false, error: "Wind must be 40–300" };
    const payload: StormFields = { location, date, wind_kmh: wind };
    return { ok: true, payload: JSON.stringify(payload) };
  }
  const company = String(fields.company ?? "").toUpperCase();
  if (!(COMPANIES as readonly string[]).includes(company)) {
    return { ok: false, error: "Company is not in the allowlist" };
  }
  const payload: CompanyFields = { company, date };
  return { ok: true, payload: JSON.stringify(payload) };
}
