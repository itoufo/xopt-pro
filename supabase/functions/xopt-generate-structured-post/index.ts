import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TemplateStructurePart {
  order: number;
  name: string;
  prompt: string;
  char_limit?: number;
}

interface PostTemplate {
  name: string;
  description?: string;
  structure: TemplateStructurePart[];
  has_reply_thread: boolean;
  reply_structure?: TemplateStructurePart[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      theme,
      category,
      tone,
      profileDesign,
      brandStrategy,
      selectedHook,    // 選択されたフック（オプション）
      selectedTemplate, // 選択された構文テンプレート
      customInstructions, // 追加の指示
    } = await req.json();

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

    // 全体設計からの情報
    const brandStrategySection = brandStrategy ? `
## 全体設計（ブランド戦略）
### ペルソナの悩み・願望
- 悩み・課題: ${brandStrategy.persona_pain_points || "未設定"}
- 願望・理想: ${brandStrategy.persona_desires || "未設定"}

### 提供価値
- 特徴: ${brandStrategy.unique_features || "未設定"}
- 差別化: ${brandStrategy.differentiation || "未設定"}
- ビフォーアフター: ${brandStrategy.transformation || "未設定"}

### 想い・情熱
${brandStrategy.passion || "未設定"}
` : "";

    // フック指示
    const hookSection = selectedHook ? `
## 使用するフック（書き出し）
「${selectedHook.hook_text}」を使って投稿を始めてください。
フックの特徴: ${selectedHook.description || "なし"}
` : "";

    // 構文テンプレートから構成指示を生成
    const buildStructureInstructions = (template: PostTemplate) => {
      const mainStructure = template.structure
        .sort((a, b) => a.order - b.order)
        .map((part, idx) => {
          const charLimit = part.char_limit ? `（目安${part.char_limit}文字）` : "";
          return `${idx + 1}. ${part.name}${charLimit}: ${part.prompt}`;
        })
        .join("\n");

      let replyStructure = "";
      if (template.has_reply_thread && template.reply_structure) {
        replyStructure = "\n\n### リプ欄（スレッド）の構成\n" +
          template.reply_structure
            .sort((a, b) => a.order - b.order)
            .map((part, idx) => {
              const charLimit = part.char_limit ? `（目安${part.char_limit}文字）` : "";
              return `${idx + 1}. ${part.name}${charLimit}: ${part.prompt}`;
            })
            .join("\n");
      }

      return `
## 使用する構文テンプレート: ${template.name}
${template.description ? `説明: ${template.description}` : ""}

### 本文の構成
${mainStructure}
${replyStructure}`;
    };

    const templateSection = selectedTemplate ? buildStructureInstructions(selectedTemplate) : "";

    const prompt = `あなたはX（Twitter）投稿の専門家です。以下の情報と構成に従って、エンゲージメントの高い投稿文を生成してください。
${profileSection}${brandStrategySection}${hookSection}${templateSection}
## 入力情報
- テーマ/キーワード: ${theme || "未設定"}
- カテゴリ: ${categoryLabel}
- トーン: ${tone || "プロフェッショナル"}
${customInstructions ? `- 追加指示: ${customInstructions}` : ""}

## 基本要件
1. 本文は280文字以内（日本語）
2. ${selectedHook ? `「${selectedHook.hook_text}」で始める` : "冒頭でフックを作る（読み手の興味を引く）"}
3. 改行を効果的に使う
4. ハッシュタグは0-2個まで
5. 絵文字は控えめに（0-2個）
${selectedTemplate?.has_reply_thread ? `6. リプ欄（スレッド）も生成する` : ""}

## 出力形式
以下のJSON形式で出力してください：
{
  "content": "生成した本文",
  "title": "投稿のタイトル（管理用、20文字以内）",
  "tags": ["タグ1", "タグ2"],
  "characterCount": 本文の文字数,
  ${selectedTemplate?.has_reply_thread ? `"replyThread": [
    {
      "content": "リプ欄1の内容",
      "characterCount": 文字数
    },
    {
      "content": "リプ欄2の内容",
      "characterCount": 文字数
    }
  ],` : ""}
  "structureUsed": {
    "templateName": "${selectedTemplate?.name || "なし"}",
    "hookUsed": "${selectedHook?.hook_text || "なし"}"
  }
}

JSONのみを出力し、他の説明は不要です。`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
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
