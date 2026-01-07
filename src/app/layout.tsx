import type { Metadata } from "next";
import { Cinzel, Crimson_Text } from "next/font/google";
import "./globals.css";

// Cinzel for headings - elegant, fantasy-inspired serif
const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Crimson Text for body - readable, classic serif
const crimsonText = Crimson_Text({
  variable: "--font-crimson",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata: Metadata = {
  title: "Commander Stadium | Play MTG Commander Online",
  description:
    "Play Magic: The Gathering Commander with friends online. A free, open tabletop for the ultimate multiplayer Magic experience.",
  keywords: [
    "MTG",
    "Magic: The Gathering",
    "Commander",
    "EDH",
    "online",
    "multiplayer",
    "tabletop",
  ],
  openGraph: {
    title: "Commander Stadium",
    description: "Play MTG Commander with friends online",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${cinzel.variable} ${crimsonText.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
