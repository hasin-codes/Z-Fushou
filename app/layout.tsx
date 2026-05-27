import type { Metadata } from "next";
import { Suspense } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { AuthGate } from "@/components/auth/auth-gate";
import { ThemeSync } from "@/components/shared/theme-sync";
import { ShellLayout } from "@/components/shell/shell-layout";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Z Fushou",
  description: "Internal monitoring and governance tool",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: import("next").Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} antialiased`}
    >
      <body className="h-dvh overflow-hidden bg-base text-text-primary select-none">
        <Suspense>
          <NuqsAdapter>
            <TooltipProvider delayDuration={125}>
              <AuthGate>
                <ThemeSync />
                <ShellLayout>{children}</ShellLayout>
              </AuthGate>
            </TooltipProvider>
          </NuqsAdapter>
        </Suspense>
      </body>
    </html>
  );
}
