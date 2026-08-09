export function BrandMark({className}:{className?:string}){
  return <svg className={["brand-mark",className].filter(Boolean).join(" ")} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
    <circle cx="24" cy="24" r="21"/>
    <circle cx="24" cy="17" r="3.5"/>
    <path d="M24 8v5M24 21v5M15 17h5.5M27.5 17H33M17.6 10.6l3.8 3.8M30.4 10.6l-3.8 3.8M17.6 23.4l3.8-3.8M30.4 23.4l-3.8-3.8"/>
    <path d="M10 31c4.7-3.8 9.3-3.8 14 0s9.3 3.8 14 0M12 36c4-2.7 8-2.7 12 0s8 2.7 12 0"/>
  </svg>;
}
