/**
 * COGNAV 商業化後端代理 (Vercel Serverless Function)
 * 實現：1. 隱藏 API Key  2. 預留收費校驗接口  3. 錯誤攔截
 */

export default async function handler(req, res) {
  // 只允許 POST 請求，保護資源
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '僅支援 POST 請求' });
  }

  const { prompt, type, licenseKey } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // --- 收費平台邏輯預留區 ---
  // 未來您可以在此串接資料庫或 Stripe API
  // 檢查 licenseKey 是否有效或點數是否足夠
  const isAuthorized = true; // 這裡改為您的校驗邏輯
  if (!isAuthorized) {
    return res.status(403).json({ error: '授權無效或點數已用罄，請升級 Pro 方案。' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: '伺服器未設定 GEMINI_API_KEY 變數' });
  }

  // 統一使用 v1 穩定端點，支援目前最快速的 gemini-2.5-flash
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // 可根據 type 調整生成參數（如隨機性溫度等）
        generationConfig: {
          temperature: type === 'script' ? 0.9 : 0.7,
          maxOutputTokens: 1024,
        }
      })
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({
        error: data.error?.message || 'Google AI 服務暫時無法連線'
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // 成功回傳生成的內容
    res.status(200).json({ text });

  } catch (error) {
    res.status(500).json({ error: `後端代理執行異常: ${error.message}` });
  }
}
