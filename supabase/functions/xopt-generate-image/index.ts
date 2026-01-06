import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// インフォグラフィック用のプロンプト最適化
function optimizePromptForInfographic(postContent: string): string {
  return `Create a professional infographic illustration for this social media content:

"${postContent}"

Design Requirements:
- Style: Clean, minimalist infographic with flat design elements
- Visual Elements: Icons, simple charts, arrows, geometric shapes that represent the concept
- Color Palette: Professional blue tones (#1e3a5f, #3b82f6), white, and subtle accent colors
- Layout: Visual hierarchy with clear focal points
- Icons: Use simple, recognizable icons to represent key concepts
- DO NOT include any text, words, letters, or numbers in the image
- Focus purely on visual storytelling through icons and graphics
- Make it suitable for Twitter/X social media post
- Aspect ratio optimized for social media (16:9)

The image should visually convey the message and emotion of the content through graphics alone.`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { prompt, postContent, ideaId } = await req.json();

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }

    // Supabaseクライアント（サービスロールキー使用）
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // インフォグラフィック用に最適化されたプロンプト
    const imagePrompt = prompt || optimizePromptForInfographic(postContent);

    // gemini-3-pro-image-preview モデルを使用（nanobanana pro）
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: imagePrompt
                }
              ]
            }
          ],
          generationConfig: {
            responseModalities: ["IMAGE", "TEXT"],
            temperature: 1.0
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_ONLY_HIGH"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_ONLY_HIGH"
            }
          ]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    const data = await response.json();
    console.log("Gemini response received");

    // 画像データを抽出
    const parts = data.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find(
      (part: any) => part.inlineData?.mimeType?.startsWith("image/")
    );

    if (!imagePart?.inlineData) {
      const textPart = parts.find((part: any) => part.text);
      if (textPart) {
        console.log("Text response instead of image:", textPart.text);
      }
      throw new Error("No image generated. Please try a different prompt.");
    }

    // Base64をバイナリに変換
    const base64Data = imagePart.inlineData.data;
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Supabase Storageにアップロード
    const fileName = `${ideaId || 'img'}-${Date.now()}.png`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('xopt-post-images')
      .upload(fileName, bytes, {
        contentType: imagePart.inlineData.mimeType || 'image/png',
        upsert: true,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    // 公開URLを取得
    const { data: urlData } = supabase.storage
      .from('xopt-post-images')
      .getPublicUrl(fileName);

    const imageUrl = urlData.publicUrl;
    console.log("Image uploaded:", imageUrl);

    return new Response(
      JSON.stringify({
        imageUrl,
        prompt: imagePrompt,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
