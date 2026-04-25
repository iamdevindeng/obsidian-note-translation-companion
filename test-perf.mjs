import fs from 'fs';
import crypto from 'node:crypto';
import path from 'node:path';

const TEST_FILE = process.env.TEST_FILE;
const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL || 'https://api.deepseek.com/v1';
const MODEL = process.env.MODEL || 'deepseek-chat';
const SOURCE_PATH = process.env.SOURCE_PATH || (TEST_FILE ? path.basename(TEST_FILE) : '');

if (!TEST_FILE || !API_KEY) {
  console.error('Usage: TEST_FILE=/path/to/note.md API_KEY=sk-... [BASE_URL=...] [MODEL=...] [SOURCE_PATH=...] node test-perf.mjs');
  process.exit(1);
}

function cleanTextForDetection(text) {
  let cleaned = text;
  cleaned = cleaned.replace(/^---\n[\s\S]*?\n---\n?/m, '');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '');
  cleaned = cleaned.replace(/`[^`]+`/g, '');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  cleaned = cleaned.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, '$1');
  cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, '$1');
  cleaned = cleaned.replace(/<[^>]+>/g, '');
  cleaned = cleaned.replace(/https?:\/\/\S+/g, '');
  cleaned = cleaned.replace(/[#*_>`~\[\]|\-!]/g, '');
  return cleaned;
}

function detectLanguage(text) {
  const cleaned = cleanTextForDetection(text);
  const sample = cleaned.slice(0, 2000);
  const totalChars = sample.length;
  if (totalChars === 0) return 'unknown';
  const chineseChars = (sample.match(/[\u4e00-\u9fff]/g) || []).length;
  const englishLetters = (sample.match(/[a-zA-Z]/g) || []).length;
  const chineseRatio = chineseChars / totalChars;
  const englishRatio = englishLetters / totalChars;
  if (chineseRatio > 0.10) return 'chinese';
  if (englishRatio > 0.30 && chineseRatio < 0.10) return 'english';
  return 'unknown';
}

async function sha256Hex(input) {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.webcrypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function translateText(text) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);
  const url = `${BASE_URL}/chat/completions`;
  const SYSTEM_PROMPT = `You are a professional translator. Translate the following Markdown document from English to Simplified Chinese (zh-Hans).

Rules:
- Preserve all Markdown syntax exactly (headings, lists, code blocks, tables, links, etc.)
- Do NOT translate YAML frontmatter keys, but you may translate frontmatter values if they are prose
- Do NOT translate text inside code blocks or inline code
- Do NOT translate math formulas
- Do NOT change Markdown link URLs or wiki link targets
- Do NOT change tags
- Translate headings, prose paragraphs, list items, callout text, and table cell text
- Maintain the original document structure and formatting`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
        temperature: 0.3,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`HTTP ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

async function main() {
  console.log('=== Performance Test for Note Translation Companion ===\n');
  console.log('Test file:', TEST_FILE);
  console.log('Source path:', SOURCE_PATH);

  // Step 1: Read file
  const t1 = performance.now();
  const content = fs.readFileSync(TEST_FILE, 'utf-8');
  const d1 = performance.now() - t1;
  console.log(`Step 1 - Read file:       ${d1.toFixed(1)}ms (${content.length} chars)`);

  // Step 2: Language detection
  const t2 = performance.now();
  const lang = detectLanguage(content);
  const d2 = performance.now() - t2;
  console.log(`Step 2 - Language detect: ${d2.toFixed(1)}ms (result: ${lang})`);

  // Step 3: SHA-256 hash
  const t3 = performance.now();
  const hash = await sha256Hex(content);
  const d3 = performance.now() - t3;
  console.log(`Step 3 - SHA-256 hash:    ${d3.toFixed(1)}ms (${hash.slice(0, 16)}...)`);

  // Step 4: API call
  console.log('\nStep 4 - Calling DeepSeek API...');
  const t4 = performance.now();
  try {
    const translated = await translateText(content);
    const d4 = performance.now() - t4;
    console.log(`Step 4 - API call:        ${d4.toFixed(1)}ms`);
    console.log(`         Translated length: ${translated.length} chars`);
    console.log(`         First 100 chars:   ${translated.slice(0, 100).replace(/\n/g, '\\n')}`);
  } catch (err) {
    const d4 = performance.now() - t4;
    console.log(`Step 4 - API call FAILED: ${d4.toFixed(1)}ms`);
    console.log(`         Error: ${err.message}`);
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Local processing total: ${(d1 + d2 + d3).toFixed(1)}ms`);
  console.log('Local steps (read + detect + hash) should be < 50ms combined.');
  console.log('If API call is much slower than local steps, the delay is coming from the remote provider.');
}

main().catch(console.error);
