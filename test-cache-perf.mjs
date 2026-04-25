import fs from 'fs';
import crypto from 'node:crypto';
import path from 'node:path';

const TEST_FILE = process.env.TEST_FILE;
const SOURCE_PATH = process.env.SOURCE_PATH || (TEST_FILE ? path.basename(TEST_FILE) : 'translate plugin test.md');
const BASE_URL = process.env.BASE_URL || 'https://api.deepseek.com/v1';
const MODEL = process.env.MODEL || 'deepseek-chat';

if (!TEST_FILE) {
  console.error('Usage: TEST_FILE=/path/to/note.md [SOURCE_PATH=vault/relative/path.md] [BASE_URL=...] [MODEL=...] node test-cache-perf.mjs');
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

// Simulating frontmatter parsing from existing translation file
function getFrontMatterInfo(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?/);
  if (!match) return { exists: false, frontmatter: '' };
  return { exists: true, frontmatter: match[1] };
}

function parseYaml(yaml) {
  const result = {};
  for (const line of yaml.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 0) {
      const key = line.slice(0, colonIdx).trim();
      let value = line.slice(colonIdx + 1).trim();
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      result[key] = value;
    }
  }
  return result;
}

function isCacheValid(frontmatter, inputs) {
  if (!frontmatter) return false;
  return (
    frontmatter.translation_of === inputs.sourcePath &&
    frontmatter.source_hash === inputs.sourceHash &&
    frontmatter.target_lang === inputs.targetLang &&
    frontmatter.provider === inputs.provider &&
    frontmatter.model === inputs.model &&
    frontmatter.prompt_version === inputs.promptVersion
  );
}

async function main() {
  console.log('=== Cache Hit Performance Test ===\n');

  // Step 1-3: Same as plugin (read, detect, hash)
  const t1 = performance.now();
  const content = fs.readFileSync(TEST_FILE, 'utf-8');
  const lang = detectLanguage(content);
  const sourceHash = await sha256Hex(content);
  const d1 = performance.now() - t1;
  console.log(`Steps 1-3 (read + detect + hash): ${d1.toFixed(1)}ms`);

  // Step 4: Simulate reading existing translation file and parsing frontmatter
  // Create a mock translation file with correct frontmatter
  const mockTranslationFile = `---
translation_of: "${SOURCE_PATH}"
source_hash: "${sourceHash}"
source_lang: "english"
target_lang: "zh-Hans"
provider: "${BASE_URL}"
model: "${MODEL}"
prompt_version: "1.0"
generated_at: "2026-04-22T10:00:00.000Z"
plugin_version: "1.0.0"
---

# 草稿

翻译内容...`;

  const t4 = performance.now();
  const info = getFrontMatterInfo(mockTranslationFile);
  const frontmatter = parseYaml(info.frontmatter);
  const isValid = isCacheValid(frontmatter, {
    sourcePath: SOURCE_PATH,
    sourceHash,
    targetLang: 'zh-Hans',
    provider: BASE_URL,
    model: MODEL,
    promptVersion: '1.0',
  });
  const d4 = performance.now() - t4;
  console.log(`Step 4 (cache check):              ${d4.toFixed(1)}ms (valid: ${isValid})`);

  // Simulate the full "cache hit" flow
  console.log('\n=== Simulating FULL cache-hit flow (no API call) ===');
  const tFull = performance.now();

  // Read source
  const _content = fs.readFileSync(TEST_FILE, 'utf-8');
  // Detect
  const _lang = detectLanguage(_content);
  // Hash
  const _hash = await sha256Hex(_content);
  // Read existing translation (from memory, simulating vault.read)
  const _info = getFrontMatterInfo(mockTranslationFile);
  const _fm = parseYaml(_info.frontmatter);
  // Validate
  const _valid = isCacheValid(_fm, {
    sourcePath: SOURCE_PATH,
    sourceHash: _hash,
    targetLang: 'zh-Hans',
    provider: BASE_URL,
    model: MODEL,
    promptVersion: '1.0',
  });
  // Open in right pane (skip, just measure logic)

  const dFull = performance.now() - tFull;
  console.log(`Full cache-hit flow total:         ${dFull.toFixed(1)}ms`);

  console.log('\n=== Summary ===');
  console.log(`Local processing:  ${(d1 + d4).toFixed(1)}ms`);
  console.log(`Full cache-hit:    ${dFull.toFixed(1)}ms`);
  console.log('');
  console.log('Conclusion: If cache is VALID, the plugin responds using only local work.');
  console.log('If cache is INVALID (or first run), total time depends on the remote provider.');
}

main().catch(console.error);
