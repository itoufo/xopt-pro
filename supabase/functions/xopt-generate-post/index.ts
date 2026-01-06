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
    const { theme, category, existingIdeas, tone, profileDesign, brandStrategy } = await req.json();

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    const categoryLabel = category === "useful" ? "有益系" : category === "empathy" ? "共感系" : "その他";

    // プロフィール設計からの情報
    const profileSection = profileDesign ? `
## プロフィール情報
- ターゲットペルソナ: ${profileDesign.targetPersona || "未設定"}
- 提供する価値: ${profileDesign.whatToDeliver || "未設定"}
- 約束する未来: ${profileDesign.futurePromise || "未設定"}
- 実績: ${profileDesign.achievements || "未設定"}
` : "";

    // 全体設計からの情報を構築
    const brandStrategySection = brandStrategy ? `
## 全体設計（ブランド戦略）
### 事業コンセプト
- ミッション: ${brandStrategy.mission || "未設定"}
- ビジョン: ${brandStrategy.vision || "未設定"}
- 価値観: ${brandStrategy.values || "未設定"}

### ペルソナの悩み・願望
- 悩み・課題: ${brandStrategy.persona_pain_points || "未設定"}
- 願望・理想: ${brandStrategy.persona_desires || "未設定"}

### 提供価値
- 特徴: ${brandStrategy.unique_features || "未設定"}
- 差別化: ${brandStrategy.differentiation || "未設定"}
- ビフォーアフター: ${brandStrategy.transformation || "未設定"}

### コンテンツ戦略
- コンテンツの柱: ${brandStrategy.content_pillars || "未設定"}
- 投稿戦略: ${brandStrategy.posting_strategy || "未設定"}

### なぜやるのか
- 想い・情熱: ${brandStrategy.passion || "未設定"}
` : "";

    const prompt = `あなたはX（Twitter）投稿の専門家です。以下の情報を基に、エンゲージメントの高い投稿文を生成してください。
${profileSection}${brandStrategySection}
## 入力情報
- テーマ/キーワード: ${theme || "未設定"}
- カテゴリ: ${categoryLabel}
- トーン: ${tone || "プロフェッショナル"}
${existingIdeas ? `- 参考にする既存の投稿アイデア:\n${existingIdeas}` : ""}

## カテゴリ別の特徴
- 有益系: 具体的なノウハウ、数字を使った説得力、学びがある内容
- 共感系: 感情に訴える、「わかる」と思わせる、日常の気づき

## 要件
1. 280文字以内（日本語）
2. 冒頭でフックを作る（読み手の興味を引く）
3. 改行を効果的に使う
4. ハッシュタグは0-2個まで
5. 絵文字は控えめに（0-2個）

## 出力形式
以下のJSON形式で出力してください：
{
  "content": "生成した投稿文",
  "title": "投稿のタイトル（管理用、20文字以内）",
  "tags": ["タグ1", "タグ2"],
  "characterCount": 文字数
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
