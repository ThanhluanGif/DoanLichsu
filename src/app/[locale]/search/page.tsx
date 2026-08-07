import type { Metadata } from "next";
import { SearchResultsPage } from "@/components/public/SearchResultsPage";
export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Search the archive",description:"Search published Vietnamese military history content.",robots:{index:false,follow:true}};
export default async function Page({params,searchParams}:{params:Promise<{locale:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {locale}=await params;return <SearchResultsPage locale={locale} searchParams={searchParams}/>;}
