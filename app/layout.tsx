import type { Metadata } from "next";
import { Fraunces } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GovDoc",
  description: "Document intelligence platform — LLM at Scale.AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fraunces.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
