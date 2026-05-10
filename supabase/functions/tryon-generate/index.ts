/**
 * tryon-generate — Virtual try-on edge function.
 *
 * Uses Replicate's hosted OOTDiffusion model (viktorfa/oot_diffusion)
 * to generate a photorealistic image of a person wearing the supplied garment.
 *
 * Inputs (JSON body):
 *   - personImage:  data URL (data:image/...;base64,...)
 *   - garmentImage: data URL (data:image/...;base64,...)
 *   - category?:    "upperbody" | "lowerbody" | "dress"  (default: "upperbody")
 */
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface TryOnRequest {
  personImage: string;
  garmentImage: string;
  category?: "upperbody" | "lowerbody" | "dress";
}

const REPLICATE_MODEL = "viktorfa/oot_diffusion";
const POLL_INTERVAL_MS = 1500;
const MAX_POLL_MS = 120_000; // 2 min safety cap

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const REPLICATE_API_TOKEN = Deno.env.get("REPLICATE_API_TOKEN");
    if (!REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN is not configured");
    }

    const body = (await req.json()) as TryOnRequest;
    const { personImage, garmentImage } = body;
    const category = body.category ?? "upperbody";

    if (!personImage || !garmentImage) {
      return new Response(
        JSON.stringify({ error: "Both personImage and garmentImage are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Kick off the prediction. Using the model-scoped predictions endpoint
    // means Replicate will run the model's default published version.
    const createRes = await fetch(
      `https://api.replicate.com/v1/models/${REPLICATE_MODEL}/predictions`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json",
          Prefer: "wait=60", // ask Replicate to wait up to 60s before returning
        },
        body: JSON.stringify({
          input: {
            model_image: personImage,
            garment_image: garmentImage,
            category,
            steps: 20,
            guidance_scale: 2,
            seed: 0,
          },
        }),
      },
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      console.error("Replicate create error:", createRes.status, errText);
      if (createRes.status === 401 || createRes.status === 403) {
        return new Response(
          JSON.stringify({ error: "Invalid Replicate API token." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (createRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "Replicate credits exhausted. Add billing on replicate.com." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (createRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited by Replicate. Please retry shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: "Replicate API error", details: errText.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let prediction = await createRes.json();

    // Poll until the prediction finishes (succeeded / failed / canceled).
    const start = Date.now();
    while (
      prediction.status !== "succeeded" &&
      prediction.status !== "failed" &&
      prediction.status !== "canceled"
    ) {
      if (Date.now() - start > MAX_POLL_MS) {
        return new Response(
          JSON.stringify({ error: "Try-on generation timed out. Please try again." }),
          { status: 504, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));

      const pollRes = await fetch(prediction.urls.get, {
        headers: { Authorization: `Token ${REPLICATE_API_TOKEN}` },
      });
      if (!pollRes.ok) {
        const t = await pollRes.text();
        console.error("Replicate poll error:", pollRes.status, t);
        return new Response(
          JSON.stringify({ error: "Failed polling Replicate prediction." }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      prediction = await pollRes.json();
    }

    if (prediction.status !== "succeeded") {
      console.error("Replicate prediction failed:", prediction.error, prediction.logs);
      return new Response(
        JSON.stringify({
          error: "Try-on generation failed.",
          details: prediction.error ?? "Unknown model error",
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // OOTDiffusion returns either a single URL string or an array of URLs.
    const output = prediction.output;
    const imageUrl: string | undefined = Array.isArray(output) ? output[0] : output;

    if (!imageUrl || typeof imageUrl !== "string") {
      console.error("No image in Replicate output:", JSON.stringify(output).slice(0, 500));
      return new Response(
        JSON.stringify({ error: "Model did not return an image. Please retry." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch the image and convert to a base64 data URL so the frontend
    // (which expects `image` as a data URL, like the previous Gemini flow)
    // doesn't need any changes.
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return new Response(
        JSON.stringify({ error: "Failed to download generated image." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    const contentType = imgRes.headers.get("content-type") ?? "image/png";
    const buf = new Uint8Array(await imgRes.arrayBuffer());
    // Encode in chunks to avoid call-stack issues on large images.
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
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
