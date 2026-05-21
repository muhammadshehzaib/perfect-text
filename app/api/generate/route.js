// Server-side route. The Imagine API token lives here and NEVER reaches the browser.
// The browser calls /api/generate; this route calls Imagine and returns just the image.

export const runtime = "nodejs";

const IMAGINE_ENDPOINT = "https://api.vyro.ai/v2/image/generations";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { prompt, aspectRatio = "1:1", style = "imagine-turbo" } = body;

  if (!prompt || typeof prompt !== "string") {
    return Response.json({ error: "A prompt is required." }, { status: 400 });
  }

  const token = process.env.IMAGINE_TOKEN;
  if (!token) {
    return Response.json(
      { error: "Server is missing IMAGINE_TOKEN. Add it to .env.local." },
      { status: 500 }
    );
  }

  // Imagine's text-to-image endpoint expects multipart/form-data.
  // Note: the live API also requires `variation=txt2img`, which is missing
  // from the published docs — discovered by probing the endpoint.
  const form = new FormData();
  form.append("prompt", prompt);
  form.append("style", style);
  form.append("aspect_ratio", aspectRatio);
  form.append("variation", "txt2img");

  let apiRes;
  try {
    apiRes = await fetch(IMAGINE_ENDPOINT, {
      method: "POST",
      headers: { Authorization: token }, // token already includes "Bearer "
      body: form,
    });
  } catch {
    return Response.json(
      { error: "Could not reach the Imagine API. Check your connection." },
      { status: 502 }
    );
  }

  if (!apiRes.ok) {
    const detail = await apiRes.text().catch(() => "");
    return Response.json(
      { error: `Imagine API error (${apiRes.status}): ${detail || apiRes.statusText}` },
      { status: apiRes.status }
    );
  }

  // The endpoint returns a binary image. Convert it to a data URL for the canvas.
  const buffer = await apiRes.arrayBuffer();
  const contentType = apiRes.headers.get("content-type") || "image/png";
  const base64 = Buffer.from(buffer).toString("base64");

  return Response.json({ image: `data:${contentType};base64,${base64}` });
}
