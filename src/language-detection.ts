import { stripLeadingFrontmatter } from "./markdown-structure";

export type DetectedLanguage = "english" | "chinese" | "unknown";

export function cleanTextForDetection(text: string): string {
	let cleaned = stripLeadingFrontmatter(text);

	// Remove fenced code blocks
	cleaned = cleaned.replace(/```[\s\S]*?```/g, "");

	// Remove inline code
	cleaned = cleaned.replace(/`[^`]+`/g, "");

	// Remove Markdown links, keep only text: [text](url) -> text
	cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");

	// Remove wiki links: [[note|text]] -> text, [[note]] -> note
	cleaned = cleaned.replace(/\[\[[^\]]+\|([^\]]+)\]\]/g, "$1");
	cleaned = cleaned.replace(/\[\[([^\]]+)\]\]/g, "$1");

	// Remove HTML tags
	cleaned = cleaned.replace(/<[^>]+>/g, "");

	// Remove URLs
	cleaned = cleaned.replace(/https?:\/\/\S+/g, "");

	// Remove Markdown syntax chars
	cleaned = cleaned.replace(/[#*_>`~\[\]|\-!]/g, "");

	return cleaned;
}

export function detectLanguage(text: string): DetectedLanguage {
	const cleaned = cleanTextForDetection(text);
	const sample = cleaned.slice(0, 2000);

	const totalChars = sample.length;
	if (totalChars === 0) return "unknown";

	const chineseChars = (sample.match(/[\u4e00-\u9fff]/g) || []).length;
	const englishLetters = (sample.match(/[a-zA-Z]/g) || []).length;

	const chineseRatio = chineseChars / totalChars;
	const englishRatio = englishLetters / totalChars;

	if (chineseRatio > 0.10) {
		return "chinese";
	}

	if (englishRatio > 0.30 && chineseRatio < 0.10) {
		return "english";
	}

	return "unknown";
}
