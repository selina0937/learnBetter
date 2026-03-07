/**
 * COGNAV 商業化後端代理 - 點數計次版
 * 實現：1. 隱藏 API Key  2. 單次計點扣費邏輯  3. 生成品質控管
 */

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, type, userToken } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  // --- 商業模式：單次計點 (Pay-per-use) ---
  // 模擬邏輯：一次收費 10 元 (或是 1 點)
  // 未來可串接資料庫檢查 userToken 對應的點數餘額
  const userCredits = 10; // 模擬資料庫查詢結果
  const costPerUse = 1;

  if (userCredits < costPerUse) {
    return res.status(402).json({ 
      error: '餘額不足。請前往儲值，單次審計僅需 10 元。',
      link: '/pricing'
    });
  }

  if (!apiKey) {
    return res.status(500).json({ error: '伺服器配置錯誤 (GEMINI_API_KEY Missing)' });
  }

  // 使用 v1 穩定端點，Gemini 2.5 Flash
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          // 針對模擬劇本給予較高溫度，增加創意與細節
          temperature: type === 'script' ? 0.95 : 0.7,
          topP: 0.9,
          maxOutputTokens: 1500, // 確保有足夠長度生成細節
        }
      })
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      return res.status(googleResponse.status).json({
        error: data.error?.message || 'AI 伺服器繁忙，請稍後再試'
      });
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // 成功回傳，並在商業邏輯中標註扣點成功
    res.status(200).json({ 
      text, 
      remainingCredits: userCredits - costPerUse,
      status: "Charge Successful (10 TWD)"
    });

  } catch (error) {
    res.status(500).json({ error: `系統錯誤: ${error.message}` });
  }
}
