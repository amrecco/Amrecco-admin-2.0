import type { Metadata } from "next";
import {  Inter } from "next/font/google";
import "./globals.css";
import Footer from "../components/layout/footer";
import ErrorBoundary from "../components/shared/ErrorBoundary";
import Script from "next/script";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
  preload: true,
});
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://amrecco.com' : 'http://localhost:3000'),
  title: "Top Sales Talent for Freight Forwarding & Logistics Companies | Amrecco",
  description: "Connect freight forwarding, logistics, and SaaS logistics companies with experienced sales professionals. Specialized recruiting for the transportation and logistics industry.",
  keywords: "freight forwarding, logistics sales, SaaS logistics, sales talent, recruiting, hiring, transportation, supply chain",
  authors: [{ name: "Amrecco" }],
  icons: {
    icon: "/vercel.svg",
    shortcut: "/vercel.svg",
    apple: "/vercel.svg",
  },
  openGraph: {
    title: "Top Sales Talent for Freight Forwarding & Logistics Companies",
    description: "Connect freight forwarding, logistics, and SaaS logistics companies with experienced sales professionals. Specialized recruiting for the transportation industry.",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/vercel.svg",
        width: 1200,
        height: 630,
        alt: "Freight Forwarding & Logistics Sales Recruiting",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Top Sales Talent for Freight Forwarding & Logistics Companies",
    description: "Specialized recruiting for freight forwarding, logistics, and SaaS logistics companies.",
    images: ["/vercel.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
          strategy="beforeInteractive"
        />
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
          strategy="beforeInteractive"
        />
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js"
          strategy="beforeInteractive"
        />
        <Script id="pdfjs-setup" strategy="beforeInteractive">
          {`
            if (typeof window !== 'undefined' && window.pdfjsLib) {
              window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
                'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
          `}
        </Script>
      </head>
      <body className={`${inter.className} font-sans antialiased`}>
          <div className="min-h-screen flex flex-col">
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </div>
      </body>
    </html>
  );
}