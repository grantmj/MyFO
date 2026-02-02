"use client";

import { type ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import { ToastProvider } from "./ui/Toast";

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
    </ToastProvider>
  );
}
