import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://helpforge.vercel.app";
const title = "Helpforge — Forge an AI support bot from your website in 30 seconds";
const description =
  "Helpforge turns your website, PDFs, and FAQs into an AI customer support chatbot with cited answers. Built with Next.js, Supabase, and OpenAI. Bring your own OpenAI key.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: title,
    template: "%s — Helpforge",
  },
  description,
  applicationName: "Helpforge",
  keywords: [
    "AI customer support",
    "RAG",
    "chatbot",
    "Next.js",
    "Supabase",
    "OpenAI",
    "BYOK",
    "vector search",
    "pgvector",
  ],
  authors: [{ name: "gmaisu", url: "https://github.com/gmaisu" }],
  creator: "gmaisu",
  openGraph: {
    type: "website",
    siteName: "Helpforge",
    title,
    description,
    url: siteUrl,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
