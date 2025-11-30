import { LayoutWrapper } from "@/components/LayoutWrapper";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Convex Logging",
  description: "Convex logging dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark font-sans">
      <body className="antialiased">
        <LayoutWrapper>{children}</LayoutWrapper>
      </body>
    </html>
  );
}
