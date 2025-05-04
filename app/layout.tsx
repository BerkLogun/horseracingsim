import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MapInitializer from "./components/MapInitializer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Horse Racing Simulation",
  description: "A fun browser-based horse racing game",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <MapInitializer />
        {children}
      </body>
    </html>
  );
}
