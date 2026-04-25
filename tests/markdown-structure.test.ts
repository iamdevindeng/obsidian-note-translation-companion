import test = require("node:test");
import assert = require("node:assert/strict");
import { detectLanguage } from "../src/language-detection";
import { getLeadingFrontmatter, stripLeadingFrontmatter } from "../src/markdown-structure";
import { maskForTranslation, unmaskAfterTranslation } from "../src/markdown-protector";

test("leading frontmatter is detected only at the start of the document", () => {
	const input = `---
title: Example
---

Body text`;

	assert.equal(getLeadingFrontmatter(input), `---
title: Example
---
`);
	assert.equal(stripLeadingFrontmatter(input), "\nBody text");
});

test("later thematic-break-style blocks are not treated as frontmatter", () => {
	const input = `English intro paragraph.

---
not_frontmatter: true
---

More English prose here.`;

	assert.equal(getLeadingFrontmatter(input), null);
	assert.equal(stripLeadingFrontmatter(input), input);

	const { maskedText, elements } = maskForTranslation(input);
	assert.equal(maskedText, input);
	assert.deepEqual(elements, []);
	assert.equal(detectLanguage(input), "english");
});

test("masked leading frontmatter is restored exactly after translation", () => {
	const input = `---
title: My Note
---

Paragraph with \`inline code\`.`;

	const { maskedText, elements } = maskForTranslation(input);

	assert.notEqual(maskedText, input);
	assert.ok(maskedText.includes("{{PRESERVE_0}}"));
	assert.equal(unmaskAfterTranslation(maskedText, elements), input);
});

test("inline properties are masked as whole lines", () => {
	const input = `author:: John Doe
date:: 2024-01-01
status:: draft

This is the body text.`;

	const { maskedText, elements } = maskForTranslation(input);

	// Each property line should be fully replaced by a placeholder;
	// no bare value text should remain in the masked output.
	assert.ok(!maskedText.includes("John Doe"), "value should be masked");
	assert.ok(!maskedText.includes("2024-01-01"), "value should be masked");
	assert.ok(!maskedText.includes("draft"), "value should be masked");

	// Round-trip should restore exactly.
	assert.equal(unmaskAfterTranslation(maskedText, elements), input);
});

test("inline properties survive simulated LLM table reformatting", () => {
	const input = `author:: John Doe
date:: 2024-01-01

This is body text.`;

	const { maskedText, elements } = maskForTranslation(input);

	// Simulate an LLM that misinterprets lines as an unformatted table
	// and converts them to Markdown while preserving placeholders.
	const llmOutput = `| {{PRESERVE_1}} | {{PRESERVE_0}} |
| 约翰·多伊 | 2024-01-01 |

这是正文内容。`;

	const restored = unmaskAfterTranslation(llmOutput, elements);

	// Because the entire property lines are protected, the placeholders
	// stand in for the full lines; even if the LLM moves them into a
	// table, the restored result still contains the original lines.
	assert.ok(restored.includes("author:: John Doe"));
	assert.ok(restored.includes("date:: 2024-01-01"));
});
