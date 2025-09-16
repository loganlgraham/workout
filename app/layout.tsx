import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "30-Min Gym Checklist (Beginner, RPE ~6)",
  description: "Beginner-friendly 30 minute gym workout checklist with auto-save and weekly archive"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
