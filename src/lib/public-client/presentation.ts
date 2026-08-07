import type { ContentListItem,ContentType,DatePrecision,Locale,TimelineItem } from "@/lib/content/types";
import { contentTypeLabels } from "@/lib/i18n/config";

const dateLocales: Record<Locale,string> = {vi:"vi-VN",en:"en-GB"};

export function formatDate(value:string|null,precision:DatePrecision|null,locale:Locale) {
  if (!value) return locale === "vi" ? "Chưa rõ niên đại" : "Date unknown";
  const [year,month,day] = value.split("-").map(Number);
  if (precision === "YEAR" || precision === "APPROXIMATE") return `${precision === "APPROXIMATE" ? (locale === "vi" ? "Khoảng " : "c. ") : ""}${year}`;
  if (precision === "MONTH") return new Intl.DateTimeFormat(dateLocales[locale],{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(year,month-1,1)));
  return new Intl.DateTimeFormat(dateLocales[locale],{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"}).format(new Date(Date.UTC(year,month-1,day)));
}

export function formatDateRange(item:Pick<TimelineItem|ContentListItem,"startDate"|"endDate"|"datePrecision">,locale:Locale) {
  const start = formatDate(item.startDate,item.datePrecision,locale);
  if (!item.endDate || item.endDate === item.startDate) return start;
  return `${start} – ${formatDate(item.endDate,item.datePrecision,locale)}`;
}

export function typeLabel(locale:Locale,type:ContentType) { return contentTypeLabels[locale][type]; }

export function formatIsoDate(value:string,locale:Locale) {
  return new Intl.DateTimeFormat(dateLocales[locale],{day:"2-digit",month:"2-digit",year:"numeric",timeZone:"UTC"}).format(new Date(value));
}
