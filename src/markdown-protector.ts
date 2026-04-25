import { getLeadingFrontmatter } from "./markdown-structure";

export interface ProtectedElement {
	placeholder: string;
	original: string;
}

interface Extractor {
	pattern: RegExp;
	/** Return the portion to protect, or undefined to protect the full match */
	extract?: (match: RegExpMatchArray) => string;
}

const EXTRACTORS: Extractor[] = [
	// 1. Fenced code blocks
	{ pattern: /```(?:[^\n`]*\n)?[\s\S]*?```/g },

	// 2. Math blocks
	{ pattern: /\$\$[\s\S]*?\$\$/g },

	// 3. Inline code
	{ pattern: /`[^`\n]+`/g },

	// 4. Inline math (not preceded/followed by $)
	{ pattern: /(?<!\$)\$(?!\$)[^\$\n]+?\$(?!\$)/g },

	// 5. Wiki links
	{ pattern: /\[\[[^\]]+(?:\|[^\]]+)?\]\]/g },

	// 6. Markdown links (protect entire link for MVP)
	{ pattern: /\[([^\]]+)\]\(([^)]+)\)/g },

	// 7. Tags
	{ pattern: /(?<!\w)#[\w\-_/]+/g },

	// 8. Obsidian inline properties (protect entire key:: value line)
	{
		pattern: /^[a-zA-Z0-9 _-]+:: .*$/gm,
	},
];

function findMatches(text: string, pattern: RegExp): RegExpMatchArray[] {
	if (pattern.global) {
		return Array.from(text.matchAll(pattern));
	}
	const match = text.match(pattern);
	return match ? [match] : [];
}

export function maskForTranslation(text: string): {
	maskedText: string;
	elements: ProtectedElement[];
} {
	const elements: ProtectedElement[] = [];
	let workingText = text;
	let nextPlaceholderIndex = 0;

	const frontmatter = getLeadingFrontmatter(workingText);
	let frontmatterElement: ProtectedElement | null = null;

	if (frontmatter) {
		const placeholder = `{{PRESERVE_${nextPlaceholderIndex}}}`;
		nextPlaceholderIndex += 1;
		frontmatterElement = { placeholder, original: frontmatter };
		workingText = placeholder + workingText.slice(frontmatter.length);
	}

	for (const extractor of EXTRACTORS) {
		const matches = findMatches(workingText, extractor.pattern);

		// Process from end to start so earlier indices are not shifted
		for (let i = matches.length - 1; i >= 0; i--) {
			const match = matches[i];
			const start = match.index!;
			const end = start + match[0].length;
			const toProtect = extractor.extract
				? extractor.extract(match)
				: match[0];

			const placeholder = `{{PRESERVE_${nextPlaceholderIndex}}}`;
			nextPlaceholderIndex += 1;
			elements.push({ placeholder, original: toProtect });

			workingText =
				workingText.slice(0, start) + placeholder + workingText.slice(end);
		}
	}

	// Reverse so P0 is first in original text order
	elements.reverse();
	if (frontmatterElement) {
		elements.unshift(frontmatterElement);
	}

	return { maskedText: workingText, elements };
}

export function unmaskAfterTranslation(
	translatedText: string,
	elements: ProtectedElement[]
): string {
	let result = translatedText;
	for (const el of elements) {
		// Use a global replace in case the model duplicated or moved placeholders
		result = result.split(el.placeholder).join(el.original);
	}
	return result;
}
