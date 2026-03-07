// 這是運行在 Vercel 伺服器端的代碼，GitHub 看不到內部的變數
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; // 從伺服器環境變數讀取，完美隱藏

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // 將結果傳回前端
    res.status(200).json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}