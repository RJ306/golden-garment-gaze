/**
 * tryon-generate — Virtual try-on edge function.
 *
 * Accepts a person image and a garment image (both base64 data URLs),
 * sends them to the Lovable AI Gateway using Google's Gemini image model,
 * and returns the generated composite of the person wearing the garment.
 */
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

interface TryOnRequest {
  personImage: string;  // data URL: data:image/...;base64,...
  garmentImage: string; // data URL: data:image/...;base64,...
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { personImage, garmentImage } = (await req.json()) as TryOnRequest;

    if (!personImage || !garmentImage) {
      return new Response(
        JSON.stringify({ error: "Both personImage and garmentImage are required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Label each image inline so the model can tell them apart and is
    // forced to swap the person's outfit for the NEW garment.
    const systemInstruction =
      "You are a virtual try-on image generator. Output exactly ONE photorealistic image (no text). " +
      "You will receive two reference images: the PERSON and the NEW GARMENT. " +
      "Your task: render the SAME person from the PERSON image now WEARING the NEW GARMENT, " +
      "fully REPLACING whatever clothing they are currently wearing. " +
      "Identity: preserve face, skin tone, hair, body shape, and pose from the PERSON image. " +
      "Background: keep the original background and lighting from the PERSON image. " +
      "Garment: the output MUST clearly show the NEW GARMENT — do NOT keep the original outfit. " +
      "Match the new garment's exact color, pattern, embroidery, fabric texture, neckline, sleeves and silhouette. " +
      "Render realistic drape, folds and shadows so the garment looks naturally worn on this person.";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: systemInstruction },
              { type: "text", text: "REFERENCE 1 — PERSON (keep identity, pose, background, lighting):" },
              { type: "image_url", image_url: { url: personImage } },
              { type: "text", text: "REFERENCE 2 — NEW GARMENT (this is the clothing item to put ON the person, replacing whatever they are currently wearing):" },
              { type: "image_url", image_url: { url: garmentImage } },
              { type: "text", text: "Now generate the final image: the person from REFERENCE 1 wearing the garment from REFERENCE 2. Their original outfit must be entirely replaced by the new garment. Output only the image." },
            ],
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits exhausted. Please add funds to your Lovable AI workspace.",
          }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const errText = await response.text();
      console.error("AI gateway error:", response.status, errText);
      return new Response(
        JSON.stringify({ error: "AI gateway error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const data = await response.json();
    // Gemini image models return the generated image as a base64 data URL
    // inside choices[0].message.images[0].image_url.url
    const generated: string | undefined =
      data?.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!generated) {
      console.error("No image returned from gateway:", JSON.stringify(data).slice(0, 800));
      return new Response(
        JSON.stringify({ error: "Model did not return an image. Please retry." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(
      JSON.stringify({ image: generated }),
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
