const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function test() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log("Key:", process.env.GEMINI_API_KEY ? "Loaded" : "Missing");
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log("Models:", data.models ? data.models.map(m => m.name) : data);
  } catch(e) {
    console.log("Fetch error", e);
  }
}
test();
