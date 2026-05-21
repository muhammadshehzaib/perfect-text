"use client";

import { useState, useRef, useEffect, useCallback } from "react";

// Aspect ratios the Imagine API accepts (per its API reference).
const ASPECTS = {
  "1:1": "Square",
  "3:4": "Portrait",
  "9:16": "Story",
  "16:9": "Wide",
};

// Font stacks rendered on the canvas (resolved by the viewer's browser).
const FONTS = {
  sans: { label: "Bold Sans", stack: "'Arial Black', Helvetica, sans-serif" },
  serif: { label: "Serif", stack: "Georgia, 'Times New Roman', serif" },
  impact: { label: "Impact", stack: "Impact, 'Arial Black', sans-serif" },
};

// One-click presets — fill the whole form so the demo is instant.
const TEMPLATES = [
  {
    name: "☕ Coffee Shop",
    scene:
      "A cozy coffee shop interior, warm morning light, wooden tables, hanging plants",
    headline: "BLOOM COFFEE",
    subtext: "Open Daily · 8AM – 6PM",
    aspect: "3:4",
    font: "serif",
    color: "#fff7ec",
    headlineSize: 9,
    pos: { x: 0.5, y: 0.85 },
  },
  {
    name: "💪 Gym Sale",
    scene: "A modern gym with dramatic lighting, dark walls, rows of dumbbells",
    headline: "50% OFF",
    subtext: "January Membership Sale",
    aspect: "1:1",
    font: "impact",
    color: "#ffd633",
    headlineSize: 15,
    pos: { x: 0.5, y: 0.5 },
  },
  {
    name: "🎉 Event",
    scene:
      "A vibrant outdoor music festival stage at sunset, colorful lights, crowd",
    headline: "SUMMER FEST",
    subtext: "Aug 12 · Riverside Park",
    aspect: "9:16",
    font: "sans",
    color: "#ffffff",
    headlineSize: 8,
    pos: { x: 0.5, y: 0.17 },
  },
  {
    name: "🛍️ Product Drop",
    scene: "A minimal studio scene, soft shadows, pastel background",
    headline: "NEW ARRIVAL",
    subtext: "Shop the Spring Collection",
    aspect: "1:1",
    font: "sans",
    color: "#1a1a1a",
    headlineSize: 9,
    pos: { x: 0.5, y: 0.82 },
  },
];

export default function Home() {
  // --- image inputs ---
  const [scene, setScene] = useState(
    "A cozy coffee shop interior, warm morning light, wooden tables, hanging plants"
  );
  const [aspect, setAspect] = useState("3:4");

  // --- text inputs ---
  const [headline, setHeadline] = useState("BLOOM COFFEE");
  const [subtext, setSubtext] = useState("Open Daily  ·  8AM – 6PM");

  // --- text styling ---
  const [font, setFont] = useState("serif");
  const [textPos, setTextPos] = useState({ x: 0.5, y: 0.85 }); // fractions
  const [headlineSize, setHeadlineSize] = useState(9); // % of image height
  const [color, setColor] = useState("#fff7ec");
  const [shade, setShade] = useState(true);

  // --- state ---
  const [imageSrc, setImageSrc] = useState(null); // clean background
  const [rawImage, setRawImage] = useState(null); // AI's own garbled attempt
  const [compare, setCompare] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragging, setDragging] = useState(false);

  const canvasRef = useRef(null);
  const imgRef = useRef(null);

  function applyTemplate(t) {
    setScene(t.scene);
    setHeadline(t.headline);
    setSubtext(t.subtext);
    setAspect(t.aspect);
    setFont(t.font);
    setColor(t.color);
    setHeadlineSize(t.headlineSize);
    setTextPos(t.pos);
  }

  async function callApi(prompt) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt, aspectRatio: aspect, style: "imagine-turbo" }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generation failed.");
    return data.image;
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setRawImage(null);
    try {
      // "Clean" prompt — steer the model away from rendering its own text.
      const cleanPrompt =
        `${scene}. Professional poster background, clean composition, ` +
        `generous empty space for a text overlay. ` +
        `No text, no letters, no words, no typography, no captions.`;

      if (compare) {
        // "Raw" prompt — ask the model to render the text itself, so the
        // before/after shows exactly the garbling problem this tool fixes.
        const rawPrompt =
          `${scene}. Designed as a finished poster with the large headline ` +
          `text "${headline}"` +
          (subtext.trim() ? ` and the smaller text "${subtext}"` : "") +
          ` written prominently on it.`;
        const [clean, raw] = await Promise.all([
          callApi(cleanPrompt),
          callApi(rawPrompt),
        ]);
        setImageSrc(clean);
        setRawImage(raw);
      } else {
        setImageSrc(await callApi(cleanPrompt));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Redraw the canvas: AI image first, then crisp text on top.
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !img.complete || img.naturalWidth === 0) return;

    const W = img.naturalWidth;
    const H = img.naturalHeight;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(img, 0, 0, W, H);

    const cx = textPos.x * W;
    const cy = textPos.y * H;
    const hSize = (headlineSize / 100) * H;
    const sSize = hSize * 0.4;
    const hasSub = subtext.trim().length > 0;

    // Readability band behind the text.
    if (shade) {
      const bandH = hSize * (hasSub ? 3.4 : 2.4);
      const g = ctx.createLinearGradient(0, cy - bandH / 2, 0, cy + bandH / 2);
      g.addColorStop(0, "rgba(0,0,0,0)");
      g.addColorStop(0.5, "rgba(0,0,0,0.6)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, cy - bandH / 2, W, bandH);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.shadowColor = "rgba(0,0,0,0.55)";

    // Headline — real, crisp, correctly spelled text drawn by code.
    ctx.shadowBlur = hSize * 0.06;
    ctx.font = `bold ${hSize}px ${FONTS[font].stack}`;
    ctx.fillText(headline.toUpperCase(), cx, hasSub ? cy - hSize * 0.55 : cy);

    if (hasSub) {
      ctx.shadowBlur = sSize * 0.1;
      ctx.font = `${sSize}px ${FONTS[font].stack}`;
      ctx.fillText(subtext, cx, cy + hSize * 0.5);
    }
    ctx.shadowBlur = 0;
  }, [headline, subtext, font, textPos, headlineSize, color, shade]);

  // Redraw whenever the image or any styling control changes.
  useEffect(() => {
    draw();
  }, [draw, imageSrc, rawImage]);

  // --- drag to position text ---
  function pointerFraction(e) {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const src = e.touches && e.touches[0] ? e.touches[0] : e;
    return {
      x: Math.min(1, Math.max(0, (src.clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (src.clientY - rect.top) / rect.height)),
    };
  }
  function startDrag(e) {
    setDragging(true);
    setTextPos(pointerFraction(e));
  }
  function moveDrag(e) {
    if (!dragging) return;
    e.preventDefault();
    setTextPos(pointerFraction(e));
  }
  function endDrag() {
    setDragging(false);
  }

  function download() {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;
    const a = document.createElement("a");
    a.download = "perfect-text-poster.png";
    a.href = canvas.toDataURL("image/png");
    a.click();
  }

  const canvasProps = {
    ref: canvasRef,
    onMouseDown: startDrag,
    onMouseMove: moveDrag,
    onMouseUp: endDrag,
    onMouseLeave: endDrag,
    onTouchStart: startDrag,
    onTouchMove: moveDrag,
    onTouchEnd: endDrag,
  };

  return (
    <div className="wrap">
      <header className="header">
        <span className="badge">Built on the Imagine API</span>
        <h1>Perfect Text</h1>
        <p>
          AI image tools mangle text on posters and logos. Perfect Text fixes
          it — the AI generates the image, then the code locks the text on top.
          Always sharp. Always spelled right.
        </p>
      </header>

      <div className="grid">
        {/* ---------- controls ---------- */}
        <div className="panel">
          <div className="field">
            <label>Start from a template</label>
            <div className="templates">
              {TEMPLATES.map((t) => (
                <button key={t.name} onClick={() => applyTemplate(t)}>
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>
              Scene <span className="hint">— what the background shows</span>
            </label>
            <textarea
              value={scene}
              onChange={(e) => setScene(e.target.value)}
              placeholder="A cozy coffee shop interior, warm morning light…"
            />
          </div>

          <div className="field">
            <label>Format</label>
            <div className="seg">
              {Object.entries(ASPECTS).map(([key, label]) => (
                <button
                  key={key}
                  className={aspect === key ? "active" : ""}
                  onClick={() => setAspect(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <label className="check">
            <input
              type="checkbox"
              checked={compare}
              onChange={(e) => setCompare(e.target.checked)}
            />
            <span>
              Show Before / After <span className="hint">(uses 1 extra credit)</span>
            </span>
          </label>

          <button className="btn" onClick={generate} disabled={loading}>
            {loading ? "Generating…" : imageSrc ? "Regenerate image" : "Generate image"}
          </button>

          <div className="section-title">Text overlay</div>

          <div className="field">
            <label>Headline</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="BLOOM COFFEE"
            />
          </div>

          <div className="field">
            <label>
              Sub-text <span className="hint">— optional</span>
            </label>
            <input
              type="text"
              value={subtext}
              onChange={(e) => setSubtext(e.target.value)}
              placeholder="Open Daily · 8AM – 6PM"
            />
          </div>

          <div className="field">
            <label>Font</label>
            <div className="seg">
              {Object.entries(FONTS).map(([key, f]) => (
                <button
                  key={key}
                  className={font === key ? "active" : ""}
                  onClick={() => setFont(key)}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div className="field">
            <label>
              Position <span className="hint">— or drag the text on the poster</span>
            </label>
            <div className="seg">
              <button onClick={() => setTextPos({ x: 0.5, y: 0.16 })}>Top</button>
              <button onClick={() => setTextPos({ x: 0.5, y: 0.5 })}>Center</button>
              <button onClick={() => setTextPos({ x: 0.5, y: 0.84 })}>Bottom</button>
            </div>
          </div>

          <div className="field">
            <label>Headline size — {headlineSize}%</label>
            <input
              type="range"
              min="4"
              max="16"
              value={headlineSize}
              onChange={(e) => setHeadlineSize(Number(e.target.value))}
            />
          </div>

          <div className="field row">
            <div>
              <label>Text color</label>
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
            <div>
              <label>Backdrop</label>
              <div className="seg">
                <button
                  className={shade ? "active" : ""}
                  onClick={() => setShade(true)}
                >
                  On
                </button>
                <button
                  className={!shade ? "active" : ""}
                  onClick={() => setShade(false)}
                >
                  Off
                </button>
              </div>
            </div>
          </div>

          <div className="field" style={{ marginTop: 18 }}>
            <button className="btn ghost" onClick={download} disabled={!imageSrc}>
              Download PNG
            </button>
          </div>
        </div>

        {/* ---------- preview ---------- */}
        <div className="panel preview">
          {loading && (
            <div className="empty">
              <div className="spinner" />
              <div>Generating{compare ? " both versions" : ""}…</div>
            </div>
          )}

          {!loading && !imageSrc && (
            <div className="empty">
              <div className="big">🅣</div>
              <div>Your poster preview will appear here.</div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                Pick a template or describe a scene, then hit{" "}
                <strong>Generate image</strong>.
              </div>
            </div>
          )}

          {/* single view */}
          {!loading && imageSrc && !rawImage && (
            <>
              <div className="canvas-shell">
                <canvas {...canvasProps} />
              </div>
              <div className="draghint">
                Tip: drag the text on the poster to reposition it.
              </div>
            </>
          )}

          {/* before / after view */}
          {!loading && imageSrc && rawImage && (
            <>
              <div className="compare">
                <div className="shot">
                  <div className="shot-label">
                    <span className="tag bad">Before</span> AI renders the text
                    itself
                  </div>
                  <img src={rawImage} alt="AI's own attempt at the text" />
                </div>
                <div className="shot">
                  <div className="shot-label">
                    <span className="tag good">After</span> Perfect Text —
                    code-locked
                  </div>
                  <canvas {...canvasProps} />
                </div>
              </div>
              <div className="draghint">
                Tip: drag the text on the “After” poster to reposition it.
              </div>
            </>
          )}

          {error && <div className="error">{error}</div>}
        </div>
      </div>

      {/* Hidden loader image — its onLoad triggers the first canvas draw. */}
      {imageSrc && (
        <img
          ref={imgRef}
          src={imageSrc}
          alt=""
          onLoad={draw}
          style={{ display: "none" }}
        />
      )}

      <p className="footer">
        The headline you see is real text drawn by code — not generated by the
        model — so it never garbles, blurs, or misspells.
      </p>
    </div>
  );
}
