import { TranslationCompanionSettings } from "./settings";
import { maskForTranslation, unmaskAfterTranslation } from "./markdown-protector";
import {
	applyFrontmatterTranslations,
	collectFrontmatterTranslationCandidates,
} from "./translation-document";
import {
	buildChatCompletionRequestBody,
	parseExtraHeaders,
} from "./provider-request";

export interface TranslationResult {
	success: true;
	translatedText: string;
}

export interface TranslationError {
	success: false;
	error: string;
}

export interface FrontmatterTranslationOutcome {
	translatedFrontmatter: Record<string, unknown>;
	usedFallback: boolean;
	error?: string;
}

interface ChatMessage {
	role: "system" | "user";
	content: string;
}

const MARKDOWN_SYSTEM_PROMPT = `You are a professional translator. Translate the following Markdown document from English to Simplified Chinese (zh-Hans).

Rules:
- Translate headings, prose paragraphs, list items, callout text, and table cell text
- Preserve all Markdown syntax exactly
- Do NOT translate or modify text inside {{PRESERVE_N}} placeholders
- Maintain the original document structure and formatting`;

const FRONTMATTER_SYSTEM_PROMPT = `You translate selected Obsidian YAML/frontmatter property values from English to Simplified Chinese (zh-Hans).

Rules:
- The input is a JSON array of objects with id, key, and value fields
- Return JSON only, with no markdown fences or commentary
- The output must be a single JSON object mapping each id to its translated string
- Preserve identifiers, links, URLs, file paths, tags, dates, and model names when they appear inside a value
- Translate only the value text; keys are provided for context and must not appear in the output`;

function parseJsonObjectResponse(content: string): Record<string, unknown> | null {
	const trimmed = content.trim();
	if (!trimmed) {
		return null;
	}

	const candidates = [trimmed];
	const fencedMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	if (fencedMatch) {
		candidates.unshift(fencedMatch[1].trim());
	}
	const objectStart = trimmed.indexOf("{");
	const objectEnd = trimmed.lastIndexOf("}");
	if (objectStart >= 0 && objectEnd > objectStart) {
		candidates.push(trimmed.slice(objectStart, objectEnd + 1));
	}

	for (const candidate of candidates) {
		try {
			const parsed = JSON.parse(candidate);
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				return parsed as Record<string, unknown>;
			}
		} catch {
			// try next form
		}
	}

	return null;
}

async function requestChatCompletion(
	settings: TranslationCompanionSettings,
	messages: ChatMessage[],
	temperature: number
): Promise<TranslationResult | TranslationError> {
	const url = `${settings.baseURL.replace(/\/$/, "")}/chat/completions`;
	let extraHeaders: Record<string, string> | null = null;

	try {
		extraHeaders = parseExtraHeaders(settings.extraHeaders);
	} catch (err) {
		return {
			success: false,
			error: err instanceof Error ? err.message : String(err),
		};
	}

	const controller = new AbortController();
	const timeoutId = window.setTimeout(() => controller.abort(), 60000);

	try {
		const response = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"Authorization": `Bearer ${settings.apiKey}`,
				...(extraHeaders ?? {}),
			},
			body: JSON.stringify(
				buildChatCompletionRequestBody({
					model: settings.model,
					messages,
					temperature,
					extraBody: settings.extraBody,
				})
			),
			signal: controller.signal,
		});

		if (!response.ok) {
			const status = response.status;
			let message = `HTTP ${status}`;

			try {
				const errorBody = await response.json();
				message = errorBody?.error?.message || errorBody?.message || message;
			} catch {
				// ignore JSON parse error
			}

			if (status === 401) {
				return {
					success: false,
					error: "Authentication failed (401). Check your API key.",
				};
			}
			if (status === 429) {
				return {
					success: false,
					error: "Rate limited (429). Please wait and try again.",
				};
			}
			if (status >= 500) {
				return {
					success: false,
					error: `Server error (${status}). Provider may be down.`,
				};
			}

			return { success: false, error: `API error: ${message}` };
		}

		const data = await response.json();
		const translatedText = data.choices?.[0]?.message?.content;

		if (typeof translatedText !== "string" || translatedText.length === 0) {
			return { success: false, error: "API returned empty or invalid response." };
		}

		return { success: true, translatedText };
	} catch (err) {
		if (err instanceof Error && err.name === "AbortError") {
			return {
				success: false,
				error: "Request timed out after 60 seconds. Provider may be slow or unreachable.",
			};
		}
		if (err instanceof TypeError) {
			return {
				success: false,
				error: "Network error. Check your internet connection and base URL.",
			};
		}

		return {
			success: false,
			error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
		};
	} finally {
		window.clearTimeout(timeoutId);
	}
}

export async function translateText(
	text: string,
	settings: TranslationCompanionSettings
): Promise<TranslationResult | TranslationError> {
	if (text.trim().length === 0) {
		return { success: true, translatedText: text };
	}

	const { maskedText, elements } = maskForTranslation(text);
	const result = await requestChatCompletion(
		settings,
		[
			{ role: "system", content: MARKDOWN_SYSTEM_PROMPT },
			{ role: "user", content: maskedText },
		],
		settings.temperature
	);

	if (!result.success) {
		return result;
	}

	const restoredText = unmaskAfterTranslation(result.translatedText, elements);
	return { success: true, translatedText: restoredText };
}

export async function translateFrontmatterValues(
	frontmatter: Record<string, unknown>,
	settings: TranslationCompanionSettings
): Promise<FrontmatterTranslationOutcome> {
	const candidates = collectFrontmatterTranslationCandidates(frontmatter);
	if (candidates.length === 0) {
		return { translatedFrontmatter: frontmatter, usedFallback: false };
	}

	const maskedValuesById = new Map<
		string,
		ReturnType<typeof maskForTranslation>
	>();
	const input = candidates.map((candidate) => {
		const masked = maskForTranslation(candidate.value);
		maskedValuesById.set(candidate.id, masked);

		return {
			id: candidate.id,
			key: candidate.key,
			value: masked.maskedText,
		};
	});

	const result = await requestChatCompletion(
		settings,
		[
			{ role: "system", content: FRONTMATTER_SYSTEM_PROMPT },
			{ role: "user", content: JSON.stringify(input, null, 2) },
		],
		0
	);

	if (!result.success) {
		return {
			translatedFrontmatter: frontmatter,
			usedFallback: true,
			error: result.error,
		};
	}

	const translatedValues = parseJsonObjectResponse(result.translatedText);
	if (!translatedValues) {
		return {
			translatedFrontmatter: frontmatter,
			usedFallback: true,
			error: "Frontmatter translation returned invalid JSON.",
		};
	}

	const stringTranslations: Record<string, string> = {};
	for (const [id, value] of Object.entries(translatedValues)) {
		if (typeof value === "string") {
			const masked = maskedValuesById.get(id);
			stringTranslations[id] = masked
				? unmaskAfterTranslation(value, masked.elements)
				: value;
		}
	}

	return {
		translatedFrontmatter: applyFrontmatterTranslations(
			frontmatter,
			candidates,
			stringTranslations
		),
		usedFallback: false,
	};
}
