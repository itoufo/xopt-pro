import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { targetPersona, whatToDeliver, futurePromise, achievements, careerHistory } = await req.json();

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    const prompt = `あなたはX（Twitter）のプロフィール作成の専門家です。以下の情報を基に、魅力的で効果的なXプロフィール文を生成してください。

## 入力情報
- ターゲットペルソナ: ${targetPersona || "未設定"}
- 提供する価値: ${whatToDeliver || "未設定"}
- 約束する未来: ${futurePromise || "未設定"}
- 実績: ${achievements || "未設定"}
- 経歴: ${careerHistory || "未設定"}

## 要件
1. プロフィール文は160文字以内
2. ターゲットに響く言葉を使用
3. 実績や権威性を適切に表現
4. 行動を促すCTAを含める
5. 絵文字は控えめに使用（最大2-3個）

## 出力形式
以下のJSON形式で出力してください：
{
  "profileText": "生成したプロフィール文",
  "headerCopy": "ヘッダー画像用のキャッチコピー（20文字以内）",
  "fixedTweet": "固定ツイート用の文章（280文字以内）"
}

JSONのみを出力し、他の説明は不要です。`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to parse response JSON");
    }

    const result = JSON.parse(jsonMatch[0]);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
