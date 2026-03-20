import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { DbProvider } from "@/context/DbContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Money Manager Viewer",
  description: "View and analyze your Money Manager backup (.mmbak) in the browser",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-gray-50 text-gray-900">
        <DbProvider>{children}</DbProvider>
      </body>
    </html>
  );
}
