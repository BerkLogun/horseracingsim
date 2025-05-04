import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import MapInitializer from "./components/MapInitializer";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: "Horse Racing Simulation",
  description: "A fun browser-based horse racing game with physics simulation",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-neutral-200 bg-white dark:bg-neutral-800 dark:border-neutral-700">
            <div className="container mx-auto py-4 px-4 sm:px-6">
              <h1 className="text-2xl font-bold text-center">🏇 Horse Racing Simulation</h1>
            </div>
          </header>
          
          <main className="flex-grow py-6 px-4 sm:px-6">
            <MapInitializer />
            {children}
          </main>
          
          <footer className="mt-auto border-t border-neutral-200 dark:border-neutral-700 py-4 px-4 sm:px-6">
            <div className="container mx-auto text-center text-sm text-neutral-600 dark:text-neutral-400">
              &copy; {new Date().getFullYear()} Horse Racing Simulation
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
