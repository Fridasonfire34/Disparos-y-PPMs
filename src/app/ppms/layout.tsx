import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PPMs Internos",
  description: "Sistema de gestion de PPMs internos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
