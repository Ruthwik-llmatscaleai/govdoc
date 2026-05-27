import type { Metadata } from "next";
import { Fraunces, Tinos, Inter_Tight, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const tinos = Tinos({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-tinos",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GovDoc",
  description: "Document intelligence platform — LLM at Scale.AI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${tinos.variable} ${interTight.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <div className="govdoc-desktop-required hidden max-[1023px]:flex" role="status" aria-live="polite">
          <div className="govdoc-desktop-required__panel">
            <div className="govdoc-desktop-required__brand">
              <span className="govdoc-desktop-required__mark" />
              <span>GovDoc</span>
            </div>
            <h1>Desktop Workspace Required</h1>
            <p>
              GovDoc is a governed review console built for wide desktop screens.
              Please open it on a desktop browser.
            </p>
          </div>
        </div>
        <div className="govdoc-app-shell max-[1023px]:hidden">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
