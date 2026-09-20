import type {SVGProps} from "react";

type IconProps=SVGProps<SVGSVGElement>;
const base={width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.9,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true};

export function DashboardIcon(props:IconProps){return <svg {...base} {...props}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>}
export function BikeIcon(props:IconProps){return <svg {...base} {...props}><circle cx="5.5" cy="17" r="3.5"/><circle cx="18.5" cy="17" r="3.5"/><path d="M8.8 17h4.2l3-6h-5l-2.2 6Z"/><path d="m10.5 11-2-3H6"/><path d="M14.8 8H18"/><path d="m15.2 11 3.3 6"/></svg>}
export function ImageIcon(props:IconProps){return <svg {...base} {...props}><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m4.5 17 4.8-4.8 3.3 3.3 2.2-2.2 4.7 4.7"/></svg>}
export function UsersIcon(props:IconProps){return <svg {...base} {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
export function StoreIcon(props:IconProps){return <svg {...base} {...props}><path d="M3 10h18"/><path d="M5 10v10h14V10"/><path d="m4 4-1 6a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2l-1-6H4Z"/><path d="M9 20v-5h6v5"/></svg>}
export function HeadsetIcon(props:IconProps){return <svg {...base} {...props}><path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M18 19c0 1.1-.9 2-2 2h-2"/><path d="M4 14h3v5H5a1 1 0 0 1-1-1v-4Z"/><path d="M20 14h-3v5h2a1 1 0 0 0 1-1v-4Z"/></svg>}
export function SettingsIcon(props:IconProps){return <svg {...base} {...props}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1A1.7 1.7 0 0 0 2.9 13.6H3v-4h-.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v-.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.2.36.5.72 1 .95.32.15.68.23 1.05.23H21v4h.1c-.37 0-.73.08-1.05.23-.45.23-.8.59-1.05.95Z"/></svg>}
export function PackageIcon(props:IconProps){return <svg {...base} {...props}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.3 7.5-4.3"/><path d="M12 12v9"/></svg>}
export function CheckCircleIcon(props:IconProps){return <svg {...base} {...props}><circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16.5 9"/></svg>}
export function AlertCircleIcon(props:IconProps){return <svg {...base} {...props}><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16.5h.01"/></svg>}
export function UserIcon(props:IconProps){return <svg {...base} {...props}><circle cx="12" cy="8" r="3.5"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>}
