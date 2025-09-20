import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Fitmotion Trainer · 30-Min Gym Checklist (RPE ~6)",
  description:
    "Stay on track with the Fitmotion beginner checklist — auto-saving workouts, shareable progress, and a MongoDB archive."
};

export default function RootLayout({
  children
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
