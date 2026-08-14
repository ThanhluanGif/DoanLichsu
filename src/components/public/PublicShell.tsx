import Link from "next/link";
import type { Locale } from "@/lib/content/types";
import { t } from "@/lib/i18n/config";
import { archivePath,correctionsPath,homePath,learnByGradePath,searchPath,sourcesPath,timelinePath } from "@/lib/public-client/paths";
import { SearchIcon } from "@/components/icons";
import { BrandMark } from "@/components/BrandMark";

export function PublicShell({locale,localeHref,children}:{locale:Locale;localeHref:string|null;children:React.ReactNode}) {
  const copy = t(locale);
  const other = locale === "vi" ? "EN" : "VI";
  return <div className="public-site" lang={locale}>
    <a className="skip-link" href="#noi-dung">{copy.skip}</a>
    <header className="site-header">
      <Link className="brand" href={homePath(locale)} aria-label={`Quân Sử Việt, ${copy.home.toLowerCase()}`}>
        <BrandMark/>
        <span><strong>Quân Sử Việt</strong><small>{copy.brandSubtitle}</small></span>
      </Link>
      <nav className="primary-nav" aria-label={locale === "vi" ? "Điều hướng chính" : "Primary navigation"}>
        <Link href={homePath(locale)}>{copy.home}</Link>
        <Link href={timelinePath(locale)}>{copy.navTimeline}</Link>
        <Link href={learnByGradePath(locale)}>{copy.navCurriculum}</Link>
        <Link href={searchPath(locale)}>{copy.navExplore}</Link>
        <Link href={sourcesPath(locale)}>{copy.navSources}</Link>
        <Link href={archivePath(locale)}>{locale === "vi" ? "Kho tư liệu" : "Archive"}</Link>
      </nav>
      <div className="header-actions">
        <Link className="header-search" href={searchPath(locale)} aria-label={copy.search}><SearchIcon/></Link>
        {localeHref ? <Link className="language-button" href={localeHref} hrefLang={locale === "vi" ? "en" : "vi"} aria-label={copy.switchLabel}>{locale.toUpperCase()} <span aria-hidden="true">/</span> {other}</Link>
          : <span className="language-button disabled" aria-disabled="true" title={copy.alternateMissing}>{locale.toUpperCase()} <span aria-hidden="true">/</span> {other}</span>}
      </div>
    </header>
    {children}
    <footer className="site-footer">
      <div className="footer-identity"><Link className="brand" href={homePath(locale)}><BrandMark/><span><strong>Quân Sử Việt</strong><small>{locale === "vi" ? "Dự án học tập song ngữ" : "A bilingual learning project"}</small></span></Link><p>{copy.footer}</p></div>
      <div className="footer-editorial"><p>{locale === "vi" ? "Dành cho đội ngũ biên tập" : "For the editorial team"}</p><Link className="text-link" href="/admin/login">{locale === "vi" ? "Đăng nhập không gian biên tập" : "Sign in to the editorial workspace"}</Link><Link className="text-link" href={correctionsPath(locale)}>{locale === "vi" ? "Báo lỗi hoặc đính chính" : "Report a correction"}</Link><Link className="text-link" href={`/${locale}/privacy`}>{locale === "vi" ? "Riêng tư và an toàn AI" : "Privacy and AI safety"}</Link><small>{locale === "vi" ? "Tài khoản do quản trị viên cấp; không có đăng ký công khai." : "Accounts are issued by an administrator; public registration is not available."}</small></div>
    </footer>
  </div>;
}
