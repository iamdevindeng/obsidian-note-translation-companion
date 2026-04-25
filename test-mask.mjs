// Test script for markdown-protector mask/unmask logic
// Run: node test-mask.mjs

function findMatches(text, pattern) {
    if (pattern.global) {
        return Array.from(text.matchAll(pattern));
    }
    const match = text.match(pattern);
    return match ? [match] : [];
}

function maskForTranslation(text) {
    const elements = [];
    let workingText = text;

    const EXTRACTORS = [
        { pattern: /^---\n[\s\S]*?\n---\n?/m },
        { pattern: /```(?:[^\n`]*\n)?[\s\S]*?```/g },
        { pattern: /\$\$[\s\S]*?\$\$/g },
        { pattern: /`[^`\n]+`/g },
        { pattern: /(?<!\$)\$(?!\$)[^\$\n]+?\$(?!\$)/g },
        { pattern: /\[\[[^\]]+(?:\|[^\]]+)?\]\]/g },
        { pattern: /\[([^\]]+)\]\(([^)]+)\)/g },
        { pattern: /(?<!\w)#[\w\-_/]+/g },
        {
            pattern: /^([a-zA-Z0-9 _-]+::)[ \t]/gm,
            extract: (match) => match[1] + " ",
        },
    ];

    for (const extractor of EXTRACTORS) {
        const matches = findMatches(workingText, extractor.pattern);
        for (let i = matches.length - 1; i >= 0; i--) {
            const match = matches[i];
            const start = match.index;
            const end = start + match[0].length;
            const toProtect = extractor.extract
                ? extractor.extract(match)
                : match[0];

            const placeholder = `{{PRESERVE_${elements.length}}}`;
            elements.push({ placeholder, original: toProtect });

            workingText =
                workingText.slice(0, start) + placeholder + workingText.slice(end);
        }
    }

    elements.reverse();
    return { maskedText: workingText, elements };
}

function unmaskAfterTranslation(translatedText, elements) {
    let result = translatedText;
    for (const el of elements) {
        result = result.split(el.placeholder).join(el.original);
    }
    return result;
}

// Test cases
const testInput = `---
title: "My Note"
description: "This has \`code\` and [[links]]"
date: 2024-01-01
---

# Introduction

This is a paragraph with some text. Here is a wiki link: [[wiki/personal-wiki-context|Personal Wiki Context]]

## Code Example

\`\`\`typescript
function greet(name: string): string {
    return \`Hello, \${name}!\`;
}
\`\`\`

Some inline code: \`const x = 42\` and math: $E = mc^2$

A display math block:

$$\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

## Links and Tags

Check out this [article](https://example.com/article) for more info.

Important tags: #obsidian #translation/MVP

## Properties

created:: 2024-01-01
status:: draft

> [!info]
> This is a callout with \`inline code\` inside it.

| Column A | Column B |
|----------|----------|
| Cell 1   | Cell 2   |
| [[link]] | \`code\`  |
`;

console.log("=== Mask Test ===\n");
const { maskedText, elements } = maskForTranslation(testInput);

console.log("Protected elements:");
for (const el of elements) {
    const preview = el.original.replace(/\n/g, "\\n").slice(0, 80);
    console.log(`  ${el.placeholder}: ${preview}`);
}

console.log(`\nTotal elements: ${elements.length}`);
console.log(`\nMasked text preview (first 500 chars):`);
console.log(maskedText.slice(0, 500));

console.log("\n\n=== Unmask Test ===\n");
const restored = unmaskAfterTranslation(maskedText, elements);

if (restored === testInput) {
    console.log("✅ PASS: Restored text matches original exactly");
} else {
    console.log("❌ FAIL: Restored text does NOT match original");
    console.log("\nFirst difference:");
    for (let i = 0; i < Math.min(restored.length, testInput.length); i++) {
        if (restored[i] !== testInput[i]) {
            console.log(`  at index ${i}:`);
            console.log(`  original:  '${testInput.slice(Math.max(0, i-20), i+20).replace(/\n/g, "\\n")}'`);
            console.log(`  restored:  '${restored.slice(Math.max(0, i-20), i+20).replace(/\n/g, "\\n")}'`);
            break;
        }
    }
    if (restored.length !== testInput.length) {
        console.log(`  Length mismatch: original=${testInput.length}, restored=${restored.length}`);
    }
}

// Verify specific protections
console.log("\n=== Specific Protection Checks ===");
const checks = [
    ["YAML frontmatter", testInput.includes('title: "My Note"')],
    ["Fenced code block", testInput.includes('function greet')],
    ["Inline code", testInput.includes('const x = 42')],
    ["Inline math", testInput.includes('$E = mc^2$')],
    ["Display math", testInput.includes('$$\\\\int')],
    ["Wiki link", testInput.includes('[[wiki/personal-wiki-context|Personal Wiki Context]]')],
    ["Markdown link", testInput.includes('[article](https://example.com/article)')],
    ["Tag", testInput.includes('#obsidian')],
    ["Property key", testInput.includes('created::')],
];

for (const [name, present] of checks) {
    console.log(`  ${present ? "✅" : "❌"} ${name}`);
}
