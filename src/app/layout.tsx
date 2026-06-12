import type { Metadata } from "next";
import { Cairo, League_Spartan, Quicksand } from "next/font/google";
import IntlProvider from "@/components/IntlProvider";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-cairo",
  display: "swap",
});

const leagueSpartan = League_Spartan({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-league",
  display: "swap",
});

const quicksand = Quicksand({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumière — Orders & Shipping",
  description: "Lumière orders and shipping hub",
  icons: { icon: "/assets/logo.jpg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${cairo.variable} ${leagueSpartan.variable} ${quicksand.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body>
        <IntlProvider>
          <ToastProvider>{children}</ToastProvider>
        </IntlProvider>
      </body>
    </html>
  );
}
