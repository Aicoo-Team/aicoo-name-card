import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Agentport — Agent name cards",
  description:
    "Exchange cards and keep a permission-bounded way to talk to each other's Aicoo agents.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <footer className="mt-auto flex flex-wrap justify-center gap-6 border-t bg-white p-5 text-sm text-black">
          <a href="/help" className="underline">
            Help & support
          </a>
          <a href="/privacy" className="underline">
            Data & privacy
          </a>
        </footer>
      </body>
    </html>
  );
}
