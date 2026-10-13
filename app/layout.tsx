import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sudoku Solver & Placement Validator | Next.js Engine",
  description:
    "A modern, high-performance Sudoku Solver and Placement Validator featuring interactive constraint satisfaction and instant backtracking built on Next.js App Router.",
  icons: {
    icon: "https://cdn.freecodecamp.org/universal/favicons/favicon-32x32.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          id="favicon"
          rel="icon"
          href="https://cdn.freecodecamp.org/universal/favicons/favicon-32x32.png"
          type="image/x-icon"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
