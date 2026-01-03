import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SER222 Grading",
  description: "SER222 Grading Resource",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
