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
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
