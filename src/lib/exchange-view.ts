import type { PublicNameCard } from "./public-card";

export const exchangeViews = [
  "all",
  "accepted",
  "incoming",
  "outgoing",
  "history",
  "archived",
] as const;
export type ExchangeView = (typeof exchangeViews)[number];
export type ExchangeFilters = { q: string; view: ExchangeView; page: number };
export const pageSize = 30;
export type Connection = {
  id: string;
  status: string;
  event: string;
  incoming: boolean;
  card: PublicNameCard;
  note: string;
  sync_status: string;
  canSync: boolean;
  archived: boolean;
  created_at: string;
};

export function parseExchangeFilters(params: URLSearchParams): ExchangeFilters {
  const view = params.get("view");
  const rawPage = Number(params.get("page") || 1);
  return {
    q: (params.get("q") || "").trim().slice(0, 120),
    view: exchangeViews.includes(view as ExchangeView)
      ? (view as ExchangeView)
      : "all",
    page:
      Number.isSafeInteger(rawPage) && rawPage > 0
        ? Math.min(rawPage, 10000)
        : 1,
  };
}

export function exchangeQuery(filters: ExchangeFilters) {
  return new URLSearchParams({
    q: filters.q,
    view: filters.view,
    page: String(filters.page),
  }).toString();
}
