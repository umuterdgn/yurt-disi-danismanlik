import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { PublicNavbar } from "@/components/public-navbar";
import { PublicFooter } from "@/components/public-footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Nexa Yurt Dışı Danışmanlık",
  description: "Uluslararası eğitim danışmanlığı ve yurt dışı eğitim hizmetleri",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="tr"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* suppressHydrationWarning özelliğini body etiketine de ekledik 👇 */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <PublicNavbar />
        <div className="flex-1">
          {children}
        </div>
        <PublicFooter />
        <Toaster />
      </body>
    </html>
  );
}
