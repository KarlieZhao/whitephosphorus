import type { Metadata } from "next"
import "./globals.css";
import { GoogleAnalytics } from '@next/third-parties/google'

const GA_TRACKING_ID = 'G-1SBDTJSVCG';

export const metadata: Metadata = {
  title: `White Phosphorus`,
  description: `Geolocating, mapping, and documenting Israeli military's use of white phosphorus in Lebanon between 2023 and 2026.`,
  openGraph: {
    images: ["/favicon/thumbnail.jpg"],
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" />
        {/* The vector comes first: a browser that understands it draws the mark
            crisply at any size, which is what the 64px raster could never do. The
            png stays for the ones that do not, and for Google's crawler. */}
        <link rel="icon" type="image/svg+xml" href="/favicon/favicon.svg" />
        <link
          rel="icon"
          type="image/png"
          sizes="192x192"
          href="/favicon/favicon.png"
        />
        <link rel="manifest" href="/favicon/site.webmanifest" />
        <link rel="shortcut icon" href="/favicon/favicon.png" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta
          name="msapplication-config"
          content="/favicon/browserconfig.xml"
        />
        <meta name="theme-color" content="#000" />
        <link rel="alternate" type="application/rss+xml" href="/feed.xml" />
      </head>
      <body>
        <div className="min-h-screen">{children}</div>
        <GoogleAnalytics gaId={GA_TRACKING_ID} />
      </body>
    </html>
  );
}
