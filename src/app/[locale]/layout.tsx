import { notFound } from "next/navigation";
import { isPublicLocale } from "@/lib/i18n/config";

export default async function LocaleLayout({children,params}:{children:React.ReactNode;params:Promise<{locale:string}>}) {
  const {locale}=await params;
  if(!isPublicLocale(locale)) notFound();
  return <><script dangerouslySetInnerHTML={{__html:`document.documentElement.lang=${JSON.stringify(locale)}`}}/>{children}</>;
}
