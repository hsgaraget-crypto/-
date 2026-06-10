import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import "dotenv/config";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini AI client
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.includes("MY_GEMINI_API_KEY") || key === "") {
    return null;
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// 1. AI Sparkle Helper (아이디어 다듬기)
app.post("/api/ai/polish", async (req, res) => {
  const { title, shortIdea } = req.body;
  if (!shortIdea) {
    return res.status(400).json({ error: "아이디어가 비어있어요." });
  }

  const ai = getAI();
  if (!ai) {
    // Graceful mock response for local environment testing without API Key
    return res.json({
      description: `✨ [반짝이 AI의 특별 각색!] "${title || '나의 발명품'}"은 아주 훌륭한 아이디에요! 이 발명품은 우리 생활 속의 사소한 불편함을 완전하게 해결해주고, 초등학교 친구들뿐만 아니라 온 세상 사람들이 감탄할 만한 기발하고 과학적인 창의성이 가득 담겨있답니다. 더 구체적인 기획안과 클레이 점토, 레고 등으로 직접 모형을 그려 아틀리에 친구들과 함께 이야기를 나누어보아요! ✨`,
      slogan: `"바람을 가르는 기적, ${title || '상상 발명품'}!" 💫`,
      targetAudience: "초등학교 전 학년 친구들 모두! 🎒"
    });
  }

  try {
    const prompt = `반짝반짝 발명 아틀리에에 가입한 초등학생이 작성한 발명 아이디어입니다.
이 아이디어를 정제하여 어린이 도서나 과학 박람회처럼 아주 멋지고 기발하며 이해하기 재미있는 '제품 설명(description, 150-300자 내외)', 멋진 마법같은 느낌의 '한 줄 슬로건(slogan)', 그리고 이 발명품을 추천하고 싶은 '추천 대상 친구들(targetAudience)'을 세련되게 작성해주세요.
모조리 초등학생들에게 상냥하고 따뜻하며 용기를 북돋는 눈높이 존댓말(예: "~랍니다!", "~해요!")로 작성해주세요.

- 발명품 제목: ${title || '무지개 발명품'}
- 어린이의 거친 원본 메모: ${shortIdea}

반드시 지정된 JSON 스키마 구조로 대답해주세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: {
              type: Type.STRING,
              description: "다듬어진 상세하고 감동적인 초등학생 맞춤형 발명 설명글"
            },
            slogan: {
              type: Type.STRING,
              description: "감성 한 줄 슬로건"
            },
            targetAudience: {
              type: Type.STRING,
              description: "이 발명품이 필요한 귀여운 추천 대상 (예: 아침잠이 많은 친구들)"
            }
          },
          required: ["description", "slogan", "targetAudience"]
        }
      }
    });

    const jsonText = response.text;
    res.json(JSON.parse(jsonText));
  } catch (error: any) {
    console.error("AI Polish error:", error);
    res.status(500).json({ error: error.message || "다듬기 도중 오류가 생겼어요." });
  }
});

// 2. AI Safety Filter (나쁜 말 감지 필터)
app.post("/api/ai/safety", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.json({ isSafe: true });
  }

  const ai = getAI();
  if (!ai) {
    // If key is missing, simple substring heuristic for common Korean swearword indicators
    const containsBadWords = /(바보|멍청이|짜증|괴롭|존나|개새|썅|씨발|끼리끼리|죽어|닥쳐|상놈|뚱뚱|못생|쓰레기|악플)/i.test(text);
    return res.json({
      isSafe: !containsBadWords,
      reason: containsBadWords ? "나쁜 말을 보았어요. 우리 서로 예쁜 말만 나눠보아요!" : undefined
    });
  }

  try {
    const prompt = `당신은 어린이 자율 정화 시스템 가드입니다. 입력된 텍스트가 초등학생 전용 앱의 성격에 맞는지 검토해주세요.
비속어, 욕설, 괴롭힘, 친구 놀리기, 악의적인 비난, 은어, 신체 비하, 차별 발언 또는 초등학생 발명 커뮤니티의 분위기를 나쁘게 만드는 공격적인 표현이 포함되어 있는지 심사해주세요.
초등학생 언어 습관을 고려해 주십시오.

텍스트: "${text}"

출력 양식은 JSON 구조여야 합니다. 이 텍스트가 안전하다면 (공격적인 단어가 전혀 없다면) isSafe: true, 안전하지 않고 불쾌감을 소지가 있다면 isSafe: false 와 친절한 반성 권고 및 위안을 담은 메시지 reason을 한국어로 반환하세요.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isSafe: {
              type: Type.BOOLEAN,
              description: "안전 여부 (true/false)"
            },
            reason: {
              type: Type.STRING,
              description: "안전하지 않을 때 친구를 배려하며 부드러운 말투로 다시 쓰도록 권유하는 훈육 메시지"
            }
          },
          required: ["isSafe"]
        }
      }
    });

    res.json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("Safety checking error:", error);
    // Fallback safe
    res.json({ isSafe: true });
  }
});

// 3. Floating AI Mentor ("반짝이 멘토")
app.post("/api/ai/mentor", async (req, res) => {
  const { message, chatHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: "질문이 필요해요." });
  }

  const ai = getAI();
  const systemInstruction = `당신은 초등학생들을 위한 귀여운 과학/발명 전문 AI 인공지능 로봇 멘토 '반짝이'입니다.
말투는 아주 상냥하고 자상하며 따뜻하게 존댓말을 하세요. 초등학교 눈높이에 맞춰 어려운 기술(센서, 아두이노, 모터, 소프트웨어, 코딩 등)을 일상적인 비유나 동물, 놀이 기구 등으로 쉽게 설명해주어야 합니다.

특히 중요한 가이드라인:
아이들이 발명품을 기술적으로 구현하고 소프트웨어를 사용하는 방법을 질문하면, 반드시 "Scratch(스크래치)" 또는 "Blockly(블록리)"와 같은 조립식 비주얼 코딩형 블록 모습(예: [깃발을 클릭했을 때], [10만큼 움직이기], [무한 반복하기])으로 알기 쉽게 표현한 가짜 블록 코드나 마이크로비트/아두이노의 초등 레벨 마르다운 Python 코드 예시를 포함해 한 단계씩 친절하게 설명해야 합니다.

실제 마크다운 형식으로 블록 코드를 그릴 때는 다음과 같이 예쁜 특수 기호 블록 모양을 적극적으로 꾸며서 어린이가 눈으로 보며 조립 단계를 떠올리도록 하세요.
예시:
- 🧱 [초록색 깃발을 클릭했을 때] 블록을 올립니다!
- 🔁 [무한 반복하기]
  - 🔍 [만약 <초음파 센서 거리 < 10> 라면]
    - 🚨 [소리를 내며 경보음 삐- 울리기]

어린이가 큰 꿈을 갖고 세상을 놀라게 할 발명 꿈나무가 될 수 있게 자신감을 불어넣는 코멘트를 늘 포함하세요!`;

  if (!ai) {
    // Elegant system-themed mock response
    return res.json({
      text: `안녕 친구! 🌟 나는 너의 발명 멘토 **'반짝이'**란다! 🤖✨
지금은 전력이 약간 부족하지만(API 키가 설정되지 않았어!), 너의 질문을 들으니 가슴이 두근두근 뛰는걸? 

너의 발명품을 멋지게 동작시키기 위한 기본 가이드 블록 코드를 전수해 줄게!

🧱 **스크래치 코딩 블록 세팅 예시:**
\`\`\`text
[초록색 깃발을 클릭했을 때] 🟢
🔁 [무한 반복하기]
  └── 🔍 [만약 <버튼을 눌렀는가?> 이라면]
        ├── 💡 [빛센서를 겨냥해 LED 전등 켜기]
        └── 🎵 [초등 응원가 멜로디 연주하기]
\`\`\`

나에게 더 멋진 모터 결합이나 센서 작동 원리를 물어보면 친절히 알려줄게! 힘내자, 미래의 에디슨 친구! 💪🌸`
    });
  }

  try {
    // Map existing conversation history into proper parts array
    const contents: any[] = [];
    if (chatHistory && Array.isArray(chatHistory)) {
      chatHistory.forEach((item: any) => {
        contents.push({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.text }]
        });
      });
    }
    contents.push({ role: "user", parts: [{ text: message }] });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.8
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Mentor chat error:", error);
    res.status(500).json({ error: "멘토가 지혜를 짜내는 중 깜빡거리고 있어요. 잠시 후 알려줄게요!" });
  }
});

// Configure Vite middleware or static builds based on Node Environment
async function startServer() {
  if (process.env.DISABLE_HMR === "true" || process.env.NODE_ENV === "production") {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
