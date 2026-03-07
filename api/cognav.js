export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) return res.status(500).json({ error: '伺服器端 GEMINI_API_KEY 尚未設定。' });

  // 統一使用 v1 穩定端點，這是目前最推薦的寫法
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const googleResponse = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
    });

    const data = await googleResponse.json();
    if (!googleResponse.ok) return res.status(googleResponse.status).json({ error: data.error?.message });

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.status(200).json({ text });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
