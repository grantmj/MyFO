import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Layout from "@/components/Layout";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "MyFO - My Financial Officer",
  description: "Your AI-powered student financial health copilot. Plan your semester budget, track spending, and make informed financial decisions.",
  keywords: ["student budget", "financial planning", "college finance", "budget tracker", "AI financial advisor"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={inter.className}>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}
