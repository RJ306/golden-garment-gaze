/**
 * tryon-generate — Virtual try-on edge function (FREE tier).
 *
 * Calls the public Hugging Face Space `levihsu/OOTDiffusion` via its
 * Gradio API. No API key required, but the Space is shared/queued so
 * generations can be slow (30s – a few minutes) and may fail when the
 * Space is asleep or rate-limited.
 *
 * Request body:
 *   - personImage:  data URL (data:image/...;base64,...)
 *   - garmentImage: data URL (data:image/...;base64,...)
 *   - category?:    "Upper-body" | "Lower-body" | "Dress"  (default: "Upper-body")
 */
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface TryOnRequest {
  personImage: string;
  garmentImage: string;
  category?: "Upper-body" | "Lower-body" | "Dress";
}

const SPACE_BASE = "https://levihsu-ootdiffusion.hf.space";
const MAX_WAIT_MS = 240_000; // 4 min cap (cold starts can be brutal)

// Convert a data URL to a Blob we can upload to the Gradio Space.
function dataUrlToBlob(dataUrl: string): { blob: Blob; filename: string } {
  const match = dataUrl.match(/^data:(.+?);base64,(.*)$/);
  if (!match) throw new Error("Invalid data URL");
  const mime = match[1];
  const b64 = match[2];
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  const ext = mime.split("/")[1] || "png";
  return { blob: new Blob([bytes], { type: mime }), filename: `image.${ext}` };
}

// Upload a file to the Gradio Space and return the server-side path.
async function uploadToSpace(blob: Blob, filename: string): Promise<string> {
  const fd = new FormData();
  fd.append("files", blob, filename);
  const res = await fetch(`${SPACE_BASE}/upload`, { method: "POST", body: fd });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`HF upload failed [${res.status}]: ${t.slice(0, 300)}`);
  }
  const arr = (await res.json()) as string[];
  if (!Array.isArray(arr) || !arr[0]) throw new Error("HF upload returned no path");
  return arr[0];
}

// Call a Gradio fn via the /call endpoint and poll the SSE result stream.
async function gradioCall(fnName: string, data: unknown[]): Promise<unknown[]> {
  const startRes = await fetch(`${SPACE_BASE}/call/${fnName}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data }),
  });
  if (!startRes.ok) {
    const t = await startRes.text();
    throw new Error(`HF Space rejected request [${startRes.status}]: ${t.slice(0, 300)}`);
  }
  const { event_id } = (await startRes.json()) as { event_id: string };
  if (!event_id) throw new Error("HF Space returned no event_id");

  // Stream the result. Gradio returns SSE: lines like `event: complete\ndata: [...]`.
  const streamCtrl = new AbortController();
  const timeout = setTimeout(() => streamCtrl.abort(), MAX_WAIT_MS);
  let streamRes: Response;
  try {
    streamRes = await fetch(`${SPACE_BASE}/call/${fnName}/${event_id}`, {
      signal: streamCtrl.signal,
    });
  } catch (e) {
    clearTimeout(timeout);
    throw new Error(`HF Space timed out or unreachable: ${(e as Error).message}`);
  }
  if (!streamRes.ok || !streamRes.body) {
    clearTimeout(timeout);
    throw new Error(`HF Space stream error [${streamRes.status}]`);
  }

  const reader = streamRes.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let lastEvent = "";
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split("\n");
      buf = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("event:")) {
          lastEvent = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();
          if (lastEvent === "complete") {
            clearTimeout(timeout);
            try {
              return JSON.parse(payload) as unknown[];
            } catch {
              throw new Error("HF Space returned invalid JSON payload");
            }
          }
          if (lastEvent === "error") {
            clearTimeout(timeout);
            throw new Error(`HF Space error: ${payload.slice(0, 300)}`);
          }
        }
      }
    }
  } finally {
    clearTimeout(timeout);
  }
  throw new Error("HF Space stream ended without a result (Space may be asleep or overloaded)");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as TryOnRequest;
    const { personImage, garmentImage } = body;
    // Always use "Dress" category for OOTDiffusion (full-body garment model).
    const category = "Dress";

    if (!personImage || !garmentImage) {
      return new Response(
        JSON.stringify({ error: "Both personImage and garmentImage are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 1. Upload both images to the Space.
    const person = dataUrlToBlob(personImage);
    const garment = dataUrlToBlob(garmentImage);
    const [personPath, garmentPath] = await Promise.all([
      uploadToSpace(person.blob, `person_${person.filename}`),
      uploadToSpace(garment.blob, `garment_${garment.filename}`),
    ]);

    const fileRef = (path: string, mime: string) => ({
      path,
      url: `${SPACE_BASE}/file=${path}`,
      orig_name: path.split("/").pop() ?? "image.png",
      mime_type: mime,
      meta: { _type: "gradio.FileData" },
    });

    // 2. Run the Gradio function. The Space exposes:
    //    - process_hd  (Upper-body half model, 2 inputs)
    //    - process_dc  (Full Garment model, takes a category)
    // We use process_dc so we can support all garment types.
    //
    // Inputs for process_dc:
    //   [vton_img, garm_img, category, n_samples, n_steps, image_scale, seed]
    const result = await gradioCall("process_dc", [
      fileRef(personPath, person.blob.type),
      fileRef(garmentPath, garment.blob.type),
      category,
      1,    // n_samples
      20,   // n_steps
      2,    // image_scale (guidance)
      -1,   // seed (random)
    ]);

    // Gradio returns a Gallery: [[{image: {url}, caption}, ...]]
    let imageUrl: string | undefined;
    const first = Array.isArray(result) ? result[0] : undefined;
    if (Array.isArray(first) && first.length > 0) {
      const item = first[0] as Record<string, unknown>;
      const img = (item?.image ?? item) as Record<string, unknown>;
      // Prefer `path` (stable) over `url` (which can be a relative `file=...` that
      // resolves incorrectly against the /call/ endpoint).
      if (typeof img?.path === "string") {
        imageUrl = `${SPACE_BASE}/file=${img.path}`;
      } else if (typeof img?.url === "string") {
        imageUrl = img.url as string;
      }
    }

    if (!imageUrl) {
      console.error("Unexpected HF result shape:", JSON.stringify(result).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Model did not return an image. Please retry." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 3. Download the image and return as base64 data URL (frontend-compatible).
    // Normalize: extract the underlying server path (e.g. /tmp/gradio/.../image.webp)
    // so we can try multiple Gradio file-serving URL prefixes.
    let serverPath = imageUrl;
    serverPath = serverPath.replace(/^https?:\/\/[^/]+/, ""); // strip origin
    serverPath = serverPath.replace("/call/file=", "/file=");
    const fileMatch = serverPath.match(/file=(.+)$/);
    const rawPath = fileMatch ? fileMatch[1] : serverPath.replace(/^\/+/, "");

    // Try every known Gradio file endpoint in order. Different Gradio
    // versions serve files at different paths.
    const candidates = [
      `${SPACE_BASE}/gradio_api/file=${rawPath}`,
      `${SPACE_BASE}/file=${rawPath}`,
      `${SPACE_BASE}/file/${rawPath.replace(/^\//, "")}`,
      imageUrl.startsWith("http") ? imageUrl : `${SPACE_BASE}${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`,
    ];

    let imgRes: Response | null = null;
    let finalUrl = "";
    for (const url of candidates) {
      console.log("Trying image URL:", url);
      try {
        const r = await fetch(url, {
          headers: { Referer: SPACE_BASE + "/", "User-Agent": "Mozilla/5.0" },
        });
        if (r.ok) {
          imgRes = r;
          finalUrl = url;
          break;
        }
        console.log("  -> failed", r.status);
      } catch (e) {
        console.log("  -> threw", (e as Error).message);
      }
    }

    if (!imgRes) {
      return new Response(
        JSON.stringify({ error: `Failed to download generated image from any known Gradio endpoint.`, tried: candidates }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    console.log("Downloaded from:", finalUrl);
    const contentType = imgRes.headers.get("content-type") ?? "image/png";
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    let binary = "";
    const chunk = 0x8000;
    for (let i = 0; i < buf.length; i += chunk) {
      binary += String.fromCharCode(...buf.subarray(i, i + chunk));
    }
    const dataUrl = `data:${contentType};base64,${btoa(binary)}`;

    return new Response(
      JSON.stringify({ image: dataUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("tryon-generate error:", e);
    const msg = e instanceof Error ? e.message : "Unknown error";
    // Most user-visible failures here = HF Space asleep / queued / rate limited.
    return new Response(
      JSON.stringify({
        error:
          "Free try-on service is busy or asleep. This is normal for the free Hugging Face Space — please wait ~30s and try again.",
        details: msg,
      }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
