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
    <header className="border-b border-zinc-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <span className="font-semibold text-zinc-900 tracking-tight">
          Job Dashboard
        </span>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                pathname === l.href
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100"
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
