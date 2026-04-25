export interface RequestBehaviorSettings {
	temperature: number;
	extraBody: string;
}

export interface ChatCompletionRequestOptions {
	model: string;
	messages: unknown[];
	temperature: number;
	extraBody: string;
}

const RESERVED_EXTRA_BODY_KEYS = new Set([
	"model",
	"messages",
	"temperature",
	"stream",
]);

export const DEFAULT_REQUEST_BEHAVIOR_FINGERPRINT = stableStringify({
	extraBody: {},
	temperature: 0.3,
});

function isJsonObject(value: unknown): value is Record<string, unknown> {
	return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function stableJsonValue(value: unknown): unknown {
	if (Array.isArray(value)) {
		return value.map(stableJsonValue);
	}

	if (!isJsonObject(value)) {
		return value;
	}

	const sorted: Record<string, unknown> = {};
	for (const key of Object.keys(value).sort()) {
		sorted[key] = stableJsonValue(value[key]);
	}

	return sorted;
}

export function stableStringify(value: unknown): string {
	return JSON.stringify(stableJsonValue(value));
}

export function parseExtraHeaders(rawHeaders: string): Record<string, string> | null {
	const trimmed = rawHeaders.trim();
	if (!trimmed) {
		return null;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch {
		throw new Error("Extra Headers must be valid JSON.");
	}

	if (!isJsonObject(parsed)) {
		throw new Error("Extra Headers must be a JSON object.");
	}

	const normalizedHeaders: Record<string, string> = {};

	for (const [key, value] of Object.entries(parsed)) {
		if (!key.trim()) {
			throw new Error("Extra Headers cannot contain empty header names.");
		}
		if (
			typeof value !== "string" &&
			typeof value !== "number" &&
			typeof value !== "boolean"
		) {
			throw new Error(`Extra header "${key}" must be a string, number, or boolean.`);
		}

		normalizedHeaders[key] = String(value);
	}

	return normalizedHeaders;
}

export function parseExtraBody(rawBody: string): Record<string, unknown> | null {
	const trimmed = rawBody.trim();
	if (!trimmed) {
		return null;
	}

	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch {
		throw new Error("Extra Body must be valid JSON.");
	}

	if (!isJsonObject(parsed)) {
		throw new Error("Extra Body must be a JSON object.");
	}

	for (const key of Object.keys(parsed)) {
		if (!key.trim()) {
			throw new Error("Extra Body cannot contain empty field names.");
		}
		if (RESERVED_EXTRA_BODY_KEYS.has(key)) {
			throw new Error(`Extra Body cannot override "${key}".`);
		}
	}

	return parsed;
}

export function buildChatCompletionRequestBody(
	options: ChatCompletionRequestOptions
): Record<string, unknown> {
	const extraBody = parseExtraBody(options.extraBody);

	return {
		model: options.model,
		messages: options.messages,
		temperature: options.temperature,
		...(extraBody ?? {}),
	};
}

export function buildRequestBehaviorFingerprint(
	settings: RequestBehaviorSettings
): string {
	const extraBody = parseExtraBody(settings.extraBody) ?? {};

	return stableStringify({
		extraBody,
		temperature: settings.temperature,
	});
}
