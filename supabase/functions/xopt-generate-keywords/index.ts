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
    const {
      targetPersona,
      whatToDeliver,
      futurePromise,
      achievements,
      careerHistory,
      existingKeywords,
      brandStrategy
    } = await req.json();

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    // 全体設計からの情報を構築
    const brandStrategySection = brandStrategy ? `
## 全体設計（ブランド戦略）
### 事業コンセプト
- ミッション: ${brandStrategy.mission || "未設定"}
- ビジョン: ${brandStrategy.vision || "未設定"}
- 価値観: ${brandStrategy.values || "未設定"}

### 権威性・実績
- 社会的証明: ${brandStrategy.social_proof || "未設定"}
- 権威性: ${brandStrategy.authority || "未設定"}

### ペルソナ詳細
- 悩み・課題: ${brandStrategy.persona_pain_points || "未設定"}
- 願望・理想: ${brandStrategy.persona_desires || "未設定"}
- 行動トリガー: ${brandStrategy.persona_triggers || "未設定"}

### 提供価値
- 特徴: ${brandStrategy.unique_features || "未設定"}
- 差別化: ${brandStrategy.differentiation || "未設定"}
- 提供ノウハウ: ${brandStrategy.expertise || "未設定"}
- ビフォーアフター: ${brandStrategy.transformation || "未設定"}

### コンテンツ戦略
- コンテンツの柱: ${brandStrategy.content_pillars || "未設定"}
- 投稿戦略: ${brandStrategy.posting_strategy || "未設定"}

### なぜやるのか
- 背景ストーリー: ${brandStrategy.background_story || "未設定"}
- 想い・情熱: ${brandStrategy.passion || "未設定"}
` : "";

    const prompt = `あなたはX（Twitter）コンテンツ戦略の専門家です。以下のプロフィール情報と全体設計を分析し、投稿のテーマ・キーワード候補を大量に生成してください。

## プロフィール情報
- ターゲットペルソナ: ${JSON.stringify(targetPersona) || "未設定"}
- 提供する価値: ${whatToDeliver || "未設定"}
- 約束する未来: ${futurePromise || "未設定"}
- 実績: ${achievements || "未設定"}
- 経歴: ${careerHistory || "未設定"}
${brandStrategySection}
${existingKeywords ? `## 既に使用済みのキーワード（避ける）\n${existingKeywords}` : ""}

## 要件
1. ターゲットが「読みたい」「共感する」「学びたい」と思うテーマを選ぶ
2. 有益系と共感系をバランスよく含める
3. 具体的で投稿に落とし込みやすいキーワードにする
4. 最低20個のキーワード候補を出す

## カテゴリ
- useful（有益系）: ノウハウ、Tips、数字で語る実績、学び
- empathy（共感系）: 日常の気づき、失敗談、本音、共感を呼ぶ経験

## 出力形式
以下のJSON形式で出力してください：
{
  "keywords": [
    {
      "theme": "テーマ名",
      "description": "このテーマで書く内容の概要",
      "category": "useful" または "empathy",
      "hooks": ["フック案1", "フック案2"]
    }
  ]
}

JSONのみを出力し、他の説明は不要です。`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
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
