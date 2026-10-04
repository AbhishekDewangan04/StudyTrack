const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const apiKey = (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '');

async function testGeminiDirect() {
  console.log('Testing Gemini API Direct Call (Key len:', apiKey.length, ')...');
  
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
  
  for (const model of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Hello, reply with one word: Success.' }] }]
        })
      });
      console.log(`Model ${model} status:`, res.status);
      const json = await res.json();
      if (res.ok) {
        console.log(`✅ Success with ${model}:`, json?.candidates?.[0]?.content?.parts?.[0]?.text);
        return;
      } else {
        console.log(`❌ Error payload from ${model}:`, JSON.stringify(json?.error || json));
      }
    } catch (e) {
      console.log(`Error calling ${model}:`, e.message);
    }
  }
}

testGeminiDirect();
