import type { ContentType,Locale,PeriodView } from "@/lib/public-client/types";
import { contentTypeLabels,t } from "@/lib/i18n/config";
import { searchPath } from "@/lib/public-client/paths";
import { SearchIcon } from "@/components/icons";

export function SearchForm({locale,periods,state}:{locale:Locale;periods:PeriodView[];state:{q?:string;type?:ContentType;period?:string;sort?:string}}) {
  const copy=t(locale);
  return <form className="search-form" action={searchPath(locale)} method="get" role="search">
    <label className="search-label" htmlFor="public-search">{copy.search}</label>
    <div className="search-input-row"><SearchIcon/><input id="public-search" name="q" defaultValue={state.q} placeholder={copy.searchPlaceholder}/><button className="button primary" type="submit">{copy.search}</button></div>
    <div className="filter-grid">
      <label>{copy.filterType}<select name="type" defaultValue={state.type ?? ""}><option value="">{copy.all}</option>{(["EVENT","PERSON","ARTIFACT","TOPIC","PERIOD"] as ContentType[]).map((type)=><option value={type} key={type}>{contentTypeLabels[locale][type]}</option>)}</select></label>
      <label>{copy.filterPeriod}<select name="period" defaultValue={state.period ?? ""}><option value="">{copy.all}</option>{periods.map((period)=><option value={period.slug} key={period.id}>{period.title}</option>)}</select></label>
      <label>{copy.sort}<select name="sort" defaultValue={state.sort ?? ""}><option value="">{copy.sortRelevance}</option><option value="chronology">{copy.sortChronology}</option><option value="updated">{copy.sortUpdated}</option><option value="title">{copy.sortTitle}</option></select></label>
    </div>
  </form>;
}
