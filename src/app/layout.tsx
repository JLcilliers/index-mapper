import type { Metadata } from "next";
import { Oswald, Roboto } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const roboto = Roboto({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const oswald = Oswald({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400"],
});

export const metadata: Metadata = {
  title: "Index Mapper — Golden Proportions Marketing",
  description: "Multi-client SEO content mapping and index-bloat management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${roboto.variable} ${oswald.variable} antialiased`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
