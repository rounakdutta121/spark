import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/providers/app-providers";
import { APP_NAME, APP_TAGLINE } from "@/lib/constants";
import { resolveAppUrl } from "@/lib/app-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const appUrl = resolveAppUrl();

export const viewport: Viewport = {
  themeColor: "#FF4458",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: `${APP_NAME} — Social Network`,
    template: `%s | ${APP_NAME}`,
  },
  description: APP_TAGLINE,
  keywords: ["social", "posts", "community", "spark", "connections"],
  applicationName: APP_NAME,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: appUrl,
    siteName: APP_NAME,
    title: `${APP_NAME} — Social Network`,
    description: APP_TAGLINE,
  },
  twitter: {
    card: "summary_large_image",
    title: `${APP_NAME} — Social Network`,
    description: APP_TAGLINE,
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
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
