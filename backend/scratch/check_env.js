const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '../.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ backend/.env does NOT exist');
  process.exit(1);
}

const content = fs.readFileSync(envPath, 'utf8');
const lines = content.split('\n');

let foundKey = false;
lines.forEach((line, index) => {
  const trimmed = line.trim();
  if (trimmed.startsWith('GEMINI_API_KEY')) {
    foundKey = true;
    const parts = trimmed.split('=');
    const rawVal = parts.slice(1).join('=').trim();
    const cleanVal = rawVal.replace(/^["']|["']$/g, '');
    console.log(`Line ${index + 1}: GEMINI_API_KEY is present.`);
    console.log(`  Raw Length: ${rawVal.length}`);
    console.log(`  Clean Length: ${cleanVal.length}`);
    console.log(`  Is 'your_gemini_api_key': ${cleanVal === 'your_gemini_api_key'}`);
    console.log(`  Starts with 'AIza': ${cleanVal.startsWith('AIza')}`);
    console.log(`  Contains spaces: ${/\s/.test(cleanVal)}`);
  }
});

if (!foundKey) {
  console.log('❌ No line starting with GEMINI_API_KEY found in backend/.env');
}
