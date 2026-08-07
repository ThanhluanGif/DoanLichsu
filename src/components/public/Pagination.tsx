import Link from "next/link";
import type { Locale,PageMeta } from "@/lib/public-client/types";
import { t } from "@/lib/i18n/config";
import { withQuery } from "@/lib/public-client/paths";

export function Pagination({meta,locale,path,query}:{meta:PageMeta;locale:Locale;path:string;query:Record<string,string|number|undefined>}) {
  if (meta.totalPages <= 1) return null;
  const copy = t(locale);
  return <nav className="pagination" aria-label={locale === "vi" ? "Phân trang" : "Pagination"}>
    {meta.page > 1 ? <Link rel="prev" href={withQuery(path,{...query,page:meta.page-1})}>{copy.previous}</Link> : <span aria-disabled="true">{copy.previous}</span>}
    <strong>{copy.page} {meta.page} / {meta.totalPages}</strong>
    {meta.page < meta.totalPages ? <Link rel="next" href={withQuery(path,{...query,page:meta.page+1})}>{copy.next}</Link> : <span aria-disabled="true">{copy.next}</span>}
  </nav>;
}
