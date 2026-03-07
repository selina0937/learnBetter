/**
 * COGNAV 商業化後端代理 (Vercel Serverless Function)
 * 實現：1. 隱藏 API Key  2. 預留收費校驗接口  3. 錯誤攔截
 */

export default async function handler(req, res) {
  // 1. 安全檢查：只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. 獲取前端參數與環境變數
  const { prompt, type } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: '伺服器端 GEMINI_API_KEY 尚未設定，請至 Vercel 控制台設定。' });
  }

  // 3. 設定 Google AI 請求網址 (使用 v1 穩定端點)
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: type === 'script' ? 0.9 : 0.7, // 模擬劇本時給予更高的創造力
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await googleResponse.json();

    // 4. 錯誤處理
    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({
        error: data.error?.message || 'Google AI 服務暫時無法連線',
        code: googleResponse.status
      });
    }

    // 5. 成功回傳結果
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return res.status(200).json({ text });

  } catch (error) {
    // 捕捉伺服器崩潰錯誤
    return res.status(500).json({ error: `後端代理執行異常: ${error.message}` });
  }
}
