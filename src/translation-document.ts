export const PLUGIN_VERSION = "1.0.0";
export const PROMPT_VERSION = "1.0";
export const TARGET_LANG = "zh-Hans";
export const TERMINAL_CACHE_METADATA_MARKER = "NTC_CACHE_METADATA";

export interface TranslationMetadata {
	ntc_translation_of: string;
	ntc_source_hash: string;
	ntc_source_lang: string;
	ntc_target_lang: string;
	ntc_provider: string;
	ntc_model: string;
	ntc_prompt_version: string;
	ntc_request_hash?: string;
	ntc_generated_at: string;
	ntc_plugin_version: string;
}

export interface CacheCheckInputs {
	sourcePath: string;
	sourceHash: string;
	targetLang: string;
	provider: string;
	model: string;
	promptVersion: string;
	requestHash: string;
	defaultRequestHash: string;
}

export interface FrontmatterTranslationCandidate {
	id: string;
	key: string;
	value: string;
	index?: number;
}

export type StoredMetadataLocation =
	| "comment"
	| "frontmatter-ntc"
	| "frontmatter-legacy"
	| "none";

export interface FrontmatterMetadataExtraction {
	sourceFrontmatter: Record<string, unknown> | null;
	metadata: TranslationMetadata | null;
	location: Exclude<StoredMetadataLocation, "comment">;
	hadPluginMetadata: boolean;
}

export interface ParsedTerminalCacheMetadataComment {
	contentWithoutMetadataComment: string;
	metadata: TranslationMetadata | null;
	found: boolean;
}

const CACHE_FIELD_ALIASES = {
	translationOf: ["ntc_translation_of", "translation_of"],
	sourceHash: ["ntc_source_hash", "source_hash"],
	sourceLang: ["ntc_source_lang", "source_lang"],
	targetLang: ["ntc_target_lang", "target_lang"],
	provider: ["ntc_provider", "provider"],
	model: ["ntc_model", "model"],
	promptVersion: ["ntc_prompt_version", "prompt_version"],
	requestHash: ["ntc_request_hash", "request_hash"],
	generatedAt: ["ntc_generated_at", "generated_at"],
	pluginVersion: ["ntc_plugin_version", "plugin_version"],
} as const;

const NTC_METADATA_KEYS = [
	"ntc_translation_of",
	"ntc_source_hash",
	"ntc_source_lang",
	"ntc_target_lang",
	"ntc_provider",
	"ntc_model",
	"ntc_prompt_version",
	"ntc_request_hash",
	"ntc_generated_at",
	"ntc_plugin_version",
] as const;

const LEGACY_METADATA_KEYS = [
	"translation_of",
	"source_hash",
	"source_lang",
	"target_lang",
	"provider",
	"model",
	"prompt_version",
	"request_hash",
	"generated_at",
	"plugin_version",
] as const;

const LEGACY_METADATA_CORE_KEYS = [
	"translation_of",
	"source_hash",
	"target_lang",
	"provider",
	"model",
	"prompt_version",
] as const;

const IDENTIFIER_KEY_HINT = /(?:^|[_-])(id|ids|name|slug|path|paths|url|uri|href|link|links|target|targets|model|provider|source|translation_of|lang|language|prompt_version|plugin_version)$/i;

function cloneFrontmatterValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.slice();
	}

	return value;
}

function normalizeFrontmatter(
	frontmatter: Record<string, unknown> | null
): Record<string, unknown> | null {
	if (!frontmatter) {
		return null;
	}

	return Object.keys(frontmatter).length > 0 ? frontmatter : null;
}

function readStringField(
	record: Record<string, unknown> | TranslationMetadata,
	fieldNames: readonly string[]
): string | null {
	const recordWithStringKeys = record as Record<string, unknown>;

	for (const fieldName of fieldNames) {
		const value = recordWithStringKeys[fieldName];
		if (typeof value === "string") {
			return value;
		}
	}

	return null;
}

function hasAnyFields(
	record: Record<string, unknown>,
	fieldNames: readonly string[]
): boolean {
	return fieldNames.some((fieldName) => fieldName in record);
}

function hasAllStringFields(
	record: Record<string, unknown>,
	fieldNames: readonly string[]
): boolean {
	return fieldNames.every((fieldName) => typeof record[fieldName] === "string");
}

function normalizeMetadataRecord(
	record: Record<string, unknown> | TranslationMetadata | null
): TranslationMetadata | null {
	if (!record) {
		return null;
	}

	const translationOf = readStringField(record, CACHE_FIELD_ALIASES.translationOf);
	const sourceHash = readStringField(record, CACHE_FIELD_ALIASES.sourceHash);
	const targetLang = readStringField(record, CACHE_FIELD_ALIASES.targetLang);
	const provider = readStringField(record, CACHE_FIELD_ALIASES.provider);
	const model = readStringField(record, CACHE_FIELD_ALIASES.model);
	const promptVersion = readStringField(record, CACHE_FIELD_ALIASES.promptVersion);

	if (
		!translationOf ||
		!sourceHash ||
		!targetLang ||
		!provider ||
		!model ||
		!promptVersion
	) {
		return null;
	}

	return {
		ntc_translation_of: translationOf,
		ntc_source_hash: sourceHash,
		ntc_source_lang: readStringField(record, CACHE_FIELD_ALIASES.sourceLang) ?? "",
		ntc_target_lang: targetLang,
		ntc_provider: provider,
		ntc_model: model,
		ntc_prompt_version: promptVersion,
		ntc_request_hash:
			readStringField(record, CACHE_FIELD_ALIASES.requestHash) ?? undefined,
		ntc_generated_at:
			readStringField(record, CACHE_FIELD_ALIASES.generatedAt) ?? "",
		ntc_plugin_version:
			readStringField(record, CACHE_FIELD_ALIASES.pluginVersion) ?? "",
	};
}

function isLikelyBooleanOrNull(value: string): boolean {
	return /^(?:true|false|null)$/i.test(value);
}

function isLikelyNumber(value: string): boolean {
	return /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)%?$/.test(value);
}

function isLikelyDateOrTime(value: string): boolean {
	return (
		/^\d{4}-\d{2}-\d{2}$/.test(value) ||
		/^\d{4}-\d{2}-\d{2}[T ][\d:.+-]+Z?$/.test(value) ||
		/^\d{2}:\d{2}(?::\d{2})?$/.test(value)
	);
}

function isLikelyUrl(value: string): boolean {
	return /^(?:https?:\/\/|mailto:|obsidian:\/\/)/i.test(value);
}

function isLikelyMarkdownLink(value: string): boolean {
	return /^\[[^\]]+\]\([^)]+\)$/.test(value);
}

function isLikelyWikiLink(value: string): boolean {
	return /^\[\[[^\]]+\]\]$/.test(value);
}

function isLikelyTagValue(value: string): boolean {
	return /^#[\w\-_/]+(?:\s+#[\w\-_/]+)*$/.test(value);
}

function isLikelyPath(value: string): boolean {
	return (
		/^(?:\.{1,2}\/|\/)/.test(value) ||
		/^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)+(?:\.[A-Za-z0-9._-]+)?$/.test(value)
	);
}

function isLikelyStructuredIdentifier(value: string): boolean {
	return (
		/^[A-Za-z0-9]+(?:[._/-][A-Za-z0-9]+)+$/.test(value) ||
		/^[A-Za-z]+\d[A-Za-z0-9._/-]*$/.test(value)
	);
}

function stripNamedFields(
	record: Record<string, unknown>,
	fieldNames: readonly string[]
): Record<string, unknown> | null {
	const stripped: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(record)) {
		if (fieldNames.includes(key)) {
			continue;
		}

		stripped[key] = cloneFrontmatterValue(value);
	}

	return normalizeFrontmatter(stripped);
}

function getTerminalCacheMetadataCommentPattern(): RegExp {
	return new RegExp(
		String.raw`(?:\r?\n)?<!--\s*${TERMINAL_CACHE_METADATA_MARKER}\s*\r?\n([\s\S]*?)\r?\n-->\s*$`
	);
}

function shouldTranslateFrontmatterString(key: string, value: string): boolean {
	const trimmed = value.trim();

	if (!trimmed) {
		return false;
	}

	if (!/[A-Za-z]/.test(trimmed)) {
		return false;
	}

	if (/[\u4e00-\u9fff]/.test(trimmed)) {
		return false;
	}

	if (
		isLikelyBooleanOrNull(trimmed) ||
		isLikelyNumber(trimmed) ||
		isLikelyDateOrTime(trimmed) ||
		isLikelyUrl(trimmed) ||
		isLikelyMarkdownLink(trimmed) ||
		isLikelyWikiLink(trimmed) ||
		isLikelyTagValue(trimmed) ||
		isLikelyPath(trimmed)
	) {
		return false;
	}

	if (IDENTIFIER_KEY_HINT.test(key) && /^[A-Za-z0-9._/-]+$/.test(trimmed)) {
		return false;
	}

	if (isLikelyStructuredIdentifier(trimmed)) {
		return false;
	}

	return true;
}

export function buildTranslationMetadata(
	sourcePath: string,
	sourceHash: string,
	sourceLang: string,
	provider: string,
	model: string,
	requestHash: string
): TranslationMetadata {
	return {
		ntc_translation_of: sourcePath,
		ntc_source_hash: sourceHash,
		ntc_source_lang: sourceLang,
		ntc_target_lang: TARGET_LANG,
		ntc_provider: provider,
		ntc_model: model,
		ntc_prompt_version: PROMPT_VERSION,
		ntc_request_hash: requestHash,
		ntc_generated_at: new Date().toISOString(),
		ntc_plugin_version: PLUGIN_VERSION,
	};
}

export function extractMetadataFromFrontmatter(
	frontmatter: Record<string, unknown> | null
): FrontmatterMetadataExtraction {
	if (!frontmatter) {
		return {
			sourceFrontmatter: null,
			metadata: null,
			location: "none",
			hadPluginMetadata: false,
		};
	}

	const hasNtcMetadata = hasAnyFields(frontmatter, NTC_METADATA_KEYS);
	const hasLegacyMetadata = hasAllStringFields(frontmatter, LEGACY_METADATA_CORE_KEYS);

	if (!hasNtcMetadata && !hasLegacyMetadata) {
		return {
			sourceFrontmatter: normalizeFrontmatter({ ...frontmatter }),
			metadata: null,
			location: "none",
			hadPluginMetadata: false,
		};
	}

	const metadata = normalizeMetadataRecord(frontmatter);
	const keysToStrip = hasNtcMetadata
		? [...NTC_METADATA_KEYS, ...LEGACY_METADATA_KEYS]
		: LEGACY_METADATA_KEYS;

	return {
		sourceFrontmatter: stripNamedFields(frontmatter, keysToStrip),
		metadata,
		location: hasNtcMetadata ? "frontmatter-ntc" : "frontmatter-legacy",
		hadPluginMetadata: true,
	};
}

export function buildTerminalCacheMetadataComment(
	metadata: TranslationMetadata
): string {
	return `<!-- ${TERMINAL_CACHE_METADATA_MARKER}\n${JSON.stringify(metadata, null, 2)}\n-->`;
}

export function appendTerminalCacheMetadataComment(
	content: string,
	metadata: TranslationMetadata
): string {
	const baseContent = content.replace(/(?:\r?\n)+$/, "");
	const comment = buildTerminalCacheMetadataComment(metadata);

	if (!baseContent) {
		return `${comment}\n`;
	}

	return `${baseContent}\n\n${comment}\n`;
}

export function parseTerminalCacheMetadataComment(
	text: string
): ParsedTerminalCacheMetadataComment {
	const pattern = getTerminalCacheMetadataCommentPattern();
	const match = text.match(pattern);

	if (!match || match.index === undefined) {
		return {
			contentWithoutMetadataComment: text,
			metadata: null,
			found: false,
		};
	}

	const jsonPayload = match[1].trim();
	const contentWithoutMetadataComment = text
		.slice(0, match.index)
		.replace(/(?:\r?\n)+$/, "");

	try {
		const parsed = JSON.parse(jsonPayload);
		if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
			return {
				contentWithoutMetadataComment,
				metadata: normalizeMetadataRecord(parsed as Record<string, unknown>),
				found: true,
			};
		}
	} catch {
		// fall through and treat as an invalid plugin-owned comment
	}

	return {
		contentWithoutMetadataComment,
		metadata: null,
		found: true,
	};
}

export function collectFrontmatterTranslationCandidates(
	frontmatter: Record<string, unknown>
): FrontmatterTranslationCandidate[] {
	const candidates: FrontmatterTranslationCandidate[] = [];
	let nextId = 0;

	for (const [key, value] of Object.entries(frontmatter)) {
		if (typeof value === "string") {
			if (shouldTranslateFrontmatterString(key, value)) {
				candidates.push({ id: `fm_${nextId}`, key, value });
				nextId += 1;
			}
			continue;
		}

		if (!Array.isArray(value)) {
			continue;
		}

		for (let index = 0; index < value.length; index += 1) {
			const item = value[index];
			if (typeof item !== "string") {
				continue;
			}
			if (!shouldTranslateFrontmatterString(key, item)) {
				continue;
			}

			candidates.push({
				id: `fm_${nextId}`,
				key,
				value: item,
				index,
			});
			nextId += 1;
		}
	}

	return candidates;
}

export function applyFrontmatterTranslations(
	frontmatter: Record<string, unknown>,
	candidates: FrontmatterTranslationCandidate[],
	translatedValues: Record<string, string>
): Record<string, unknown> {
	const translatedFrontmatter: Record<string, unknown> = {};

	for (const [key, value] of Object.entries(frontmatter)) {
		translatedFrontmatter[key] = cloneFrontmatterValue(value);
	}

	for (const candidate of candidates) {
		const translatedValue = translatedValues[candidate.id];
		if (typeof translatedValue !== "string" || translatedValue.trim().length === 0) {
			continue;
		}

		if (candidate.index === undefined) {
			translatedFrontmatter[candidate.key] = translatedValue;
			continue;
		}

		const currentValue = translatedFrontmatter[candidate.key];
		if (!Array.isArray(currentValue)) {
			continue;
		}

		currentValue[candidate.index] = translatedValue;
	}

	return translatedFrontmatter;
}

export function isCacheValid(
	metadata: Record<string, unknown> | TranslationMetadata | null,
	inputs: CacheCheckInputs
): boolean {
	const normalizedMetadata = normalizeMetadataRecord(metadata);
	if (!normalizedMetadata) {
		return false;
	}

	const requestHashMatches = normalizedMetadata.ntc_request_hash
		? normalizedMetadata.ntc_request_hash === inputs.requestHash
		: inputs.requestHash === inputs.defaultRequestHash;

	return (
		normalizedMetadata.ntc_translation_of === inputs.sourcePath &&
		normalizedMetadata.ntc_source_hash === inputs.sourceHash &&
		normalizedMetadata.ntc_target_lang === inputs.targetLang &&
		normalizedMetadata.ntc_provider === inputs.provider &&
		normalizedMetadata.ntc_model === inputs.model &&
		normalizedMetadata.ntc_prompt_version === inputs.promptVersion &&
		requestHashMatches
	);
}
