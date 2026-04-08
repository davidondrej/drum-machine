import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Drum Machine",
  description: "A neon drum machine with step sequencer",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
