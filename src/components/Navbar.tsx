"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileArchive } from "lucide-react";

interface NavbarProps {
  fileName?: string;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
];

export default function Navbar({ fileName }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
        {/* Logo + nav links */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 shrink-0">
            <FileArchive className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-gray-800">Money Manager</span>
          </div>

          <nav className="flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-indigo-50 text-indigo-700"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right side: file name + upload link */}
        <div className="flex items-center gap-3 shrink-0">
          {fileName && (
            <span className="text-sm text-gray-400 hidden sm:inline">{fileName}</span>
          )}
          <Link
            href="/"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            Upload another file
          </Link>
        </div>
      </div>
    </header>
  );
}
