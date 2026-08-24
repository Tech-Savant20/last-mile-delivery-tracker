import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LastMile IQ - Intelligent Logistics & Delivery Management Platform",
  description: "End-to-end last-mile delivery tracking, dynamic volumetric rate calculation, intelligent agent auto-assignment, and customer rescheduling.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-[#ffffff] text-[#222222] min-h-screen selection:bg-[#ffd1da] selection:text-[#ff385c]`}
      >
        {children}
      </body>
    </html>
  );
}
