import "./globals.css";

// metadataBase lets relative OG image URLs resolve. Update it to your real
// deployed URL after deploying (e.g. https://perfect-text.vercel.app).
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://perfect-text.vercel.app";

const title = "Perfect Text — AI posters without the garbled text";
const description =
  "AI image tools mangle text on posters. Perfect Text fixes it: the AI makes the image, the code locks the text on top — always sharp, always spelled right.";

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  openGraph: {
    title,
    description,
    url: SITE_URL,
    siteName: "Perfect Text",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
