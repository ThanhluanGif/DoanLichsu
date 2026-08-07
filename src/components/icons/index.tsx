import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;
const base = {width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.8,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};

export function SearchIcon(props:IconProps) { return <svg {...base} {...props}><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>; }
export function ArrowRightIcon(props:IconProps) { return <svg {...base} {...props}><path d="M5 12h14M13 6l6 6-6 6"/></svg>; }
export function LinkIcon(props:IconProps) { return <svg {...base} {...props}><path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/></svg>; }
export function CheckIcon(props:IconProps) { return <svg {...base} {...props}><path d="m5 12 4 4L19 6"/></svg>; }
export function BookIcon(props:IconProps) { return <svg {...base} {...props}><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M8 7h8M8 11h6"/></svg>; }
export function CalendarIcon(props:IconProps) { return <svg {...base} {...props}><path d="M6 3v3M18 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z"/></svg>; }
