import { ImageResponse } from "next/og";

// Generates the link-preview card shown when the demo URL is shared
// (in a DM, on social, etc.). Next.js wires this file in automatically.

export const runtime = "edge";
export const alt = "Perfect Text — AI posters where the text never garbles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0c0d11 0%, #1a1633 100%)",
          color: "#e8e9ed",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 26,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#9183ff",
          }}
        >
          Built on the Imagine API
        </div>
        <div style={{ fontSize: 110, fontWeight: 800, marginTop: 16 }}>
          Perfect Text
        </div>
        <div style={{ fontSize: 38, color: "#8b8f9c", marginTop: 12, maxWidth: 900 }}>
          AI posters where the text never garbles. The AI makes the image — the
          code locks the text.
        </div>
      </div>
    ),
    size
  );
}
