import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SmolAccount - Financial Management for Tradies",
  description: "Simple, powerful financial management platform built for tradies",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
