import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import PageTransition from "@/components/PageTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "Swethank: AI. Products. Motion. Frame.",
  description:
    "IIT Bombay. Research systems, AI products, motion design, and video. Built and crafted with equal precision.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body className="antialiased">
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}
