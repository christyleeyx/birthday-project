import type { Metadata } from "next";
import "./globals.css";

// Page metadata is used by the browser and search engines.
export const metadata: Metadata = {
  title: "Birthday Memory Book",
  description: "A private memory app for your birthday gift",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
