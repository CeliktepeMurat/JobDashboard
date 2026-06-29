"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Feed" },
  { href: "/tracker", label: "Tracker" },
  { href: "/stats", label: "Stats" },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-slate-100 shadow-sm sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-semibold text-slate-800 tracking-tight">
          Job Dashboard
        </span>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
