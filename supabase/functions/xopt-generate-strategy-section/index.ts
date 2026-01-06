import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const categoryPrompts: Record<string, string> = {
  concept: `事業コンセプトに関する内容を生成します。
この人物のミッション・ビジョン・価値観を深掘りし、一貫性のある事業理念を表現してください。`,

  who: `権威性・実績に関する内容を生成します。
この人物の専門性、実績、経歴を説得力のある形で表現してください。
数字や具体的な成果を含めると効果的です。`,

  persona: `ターゲットペルソナに関する内容を生成します。
ターゲット顧客の具体的な属性、心理状態、悩み、願望を詳細に描写してください。
共感を呼ぶ具体的なシーンや言葉を含めてください。`,

  what: `提供価値に関する内容を生成します。
この人物が提供できる独自の価値、差別化ポイント、専門知識を明確に表現してください。
ビフォーアフターを含めると説得力が増します。`,

  how: `提供手段に関する内容を生成します。
商品・サービスの具体的な内容、コンテンツ戦略、投稿方針を実践的に記述してください。`,

  why: `なぜやるのかに関する内容を生成します。
この活動を始めた背景、情熱の源泉、今このタイミングで発信する理由を感情に訴える形で表現してください。`,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      sectionKey,
      sectionLabel,
      sectionDescription,
      sectionCategory,
      profileDesign,
      existingStrategy,
    } = await req.json();

    const anthropic = new Anthropic({
      apiKey: Deno.env.get("ANTHROPIC_API_KEY"),
    });

    const categoryContext = categoryPrompts[sectionCategory] || "";

    const prompt = `あなたはX（Twitter）ブランディング戦略の専門家です。
以下のプロフィール情報をもとに、「${sectionLabel}」の内容を生成してください。

## プロフィール情報
- ターゲットペルソナ: ${profileDesign?.targetPersona || "未設定"}
- 提供する価値: ${profileDesign?.whatToDeliver || "未設定"}
- 約束する未来: ${profileDesign?.futurePromise || "未設定"}
- 実績: ${profileDesign?.achievements || "未設定"}
- 経歴: ${profileDesign?.careerHistory || "未設定"}

## 既に入力済みの全体設計
${Object.entries(existingStrategy || {})
  .filter(([key, value]) => value && key !== 'id' && key !== 'client_id' && key !== 'created_at' && key !== 'updated_at')
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n') || "（まだ入力されていません）"}

## 生成するセクション
- セクション名: ${sectionLabel}
- 説明: ${sectionDescription}

## カテゴリ別ガイドライン
${categoryContext}

## 要件
1. プロフィール情報と既存の全体設計との一貫性を保つ
2. 具体的で実践的な内容にする
3. X（Twitter）での発信を前提とした内容にする
4. 200〜400文字程度で生成する
5. 箇条書きと文章を適宜組み合わせる

生成する内容のみを出力してください。説明や前置きは不要です。`;

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

    const content = message.content[0].type === "text" ? message.content[0].text : "";

    return new Response(JSON.stringify({ content }), {
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
