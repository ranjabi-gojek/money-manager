"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FileArchive, Menu, X } from "lucide-react";
import { useDb } from "@/context/DbContext";

interface NavbarProps {
  fileName?: string;
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/analytics", label: "Analytics" },
];

export default function Navbar({ fileName }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { clearDb } = useDb();
  const [open, setOpen] = useState(false);

  const handleUpload = () => {
    clearDb();
    router.push("/");
  };

  // Close menu on navigation
  useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2 flex-1">
          <FileArchive className="w-5 h-5 text-indigo-600 shrink-0" />
          <span className="font-semibold text-gray-800">Money Manager</span>

          {/* Desktop nav links */}
          <nav className="hidden sm:flex items-center gap-1 ml-2">
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

        {/* Right side: file name + upload link (desktop only) */}
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          {fileName && (
            <span className="text-sm text-gray-400">{fileName}</span>
          )}
          <button onClick={handleUpload} className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer">
            Upload another file
          </button>
        </div>

        {/* Hamburger (mobile only) */}
        <button
          onClick={() => setOpen((v) => !v)}
          className="sm:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden border-t border-gray-100 bg-white px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-indigo-50 text-indigo-700"
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <div className="border-t border-gray-100 mt-1 pt-2 flex items-center justify-between">
            {fileName && (
              <span className="text-xs text-gray-400 truncate mr-3">{fileName}</span>
            )}
            <button onClick={handleUpload} className="text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer shrink-0">
              Upload another file
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
