/**
 * COGNAV 商業化後端代理 - v4.6 安全與扣費增強版
 * 解決內容中斷、點數扣費與 Token 限制問題
 */

export default async function handler(req, res) {
  // 1. 安全檢查
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, type, currentCredits } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 2. 模擬後端點數校驗 (每次呼叫扣 1 點)
  if (currentCredits <= 0) {
    return res.status(402).json({ 
      error: '您的點數已用罄。單次決策審計僅需 NT$10，請前往儲值頁面。' 
    });
  }

  if (!apiKey) {
    return res.status(500).json({ error: '伺服器配置錯誤：缺少 GEMINI_API_KEY 環境變數' });
  }

  // 使用 Gemini 2.5 Flash 穩定端點
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          // 劇本模式給予高創意，助推模式給予高穩定度
          temperature: type === 'script' ? 0.95 : 0.4, 
          topP: 0.95,
          maxOutputTokens: 2500, // 確保長內容不被切斷
        }
      })
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({
        error: data.error?.message || 'Google AI 服務通訊異常'
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // 3. 成功回傳並計算新餘額
    res.status(200).json({ 
      text,
      deducted: 1,
      newBalance: currentCredits - 1
    });

  } catch (error) {
    res.status(500).json({ error: `後端執行異常: ${error.message}` });
  }
}
