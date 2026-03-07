/**
 * COGNAV 商業化後端代理 - v4.6 安全與扣費增強版
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, type, currentCredits } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // 1. 模擬後端餘額檢查
  if (currentCredits <= 0) {
    return res.status(402).json({ error: '您的點數已用罄，請先儲值以繼續使用專業審計功能。' });
  }

  if (!apiKey) {
    return res.status(500).json({ error: '伺服器配置錯誤：缺少 API Key' });
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
          temperature: type === 'script' ? 0.9 : 0.4, // 模擬劇本給予高創意，助推建議給予高穩定度
          topP: 0.95,
          maxOutputTokens: 2000, // 大幅提升 Token 限制，解決斷尾問題
          stopSequences: []
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
    
    // 回傳生成的文本與新的餘額 (前端會同步扣除)
    res.status(200).json({ 
      text,
      deducted: 1,
      newBalance: currentCredits - 1
    });

  } catch (error) {
    res.status(500).json({ error: `後端代理崩潰: ${error.message}` });
  }
}
