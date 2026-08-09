import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.leohr.co.uk"),
  title: "LEO HR™ Platform",
  description: "AI-powered HR platform for UK employers.",
  openGraph: {
    title: "LEO HR™ Platform",
    description: "AI-powered HR platform for UK employers.",
    url: "https://app.leohr.co.uk",
    type: "website",
    images: [
      {
        url: "/images/leo-og-image.png",
        width: 1200,
        height: 630,
        alt: "LEO HR platform social preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LEO HR™ Platform",
    description: "AI-powered HR platform for UK employers.",
    images: ["/images/leo-og-image.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  <html lang="en" className="font-sans">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}