import test = require("node:test");
import assert = require("node:assert/strict");
import {
	buildChatCompletionRequestBody,
	buildRequestBehaviorFingerprint,
	parseExtraBody,
	parseExtraHeaders,
} from "../src/provider-request";

test("extra headers parse primitive values into HTTP header strings", () => {
	assert.deepEqual(parseExtraHeaders('{"X-Title":"Vault","X-Enabled":true,"X-Count":2}'), {
		"X-Title": "Vault",
		"X-Enabled": "true",
		"X-Count": "2",
	});
});

test("extra body supports nested provider-specific JSON fields", () => {
	assert.deepEqual(
		parseExtraBody('{"thinking":{"type":"enabled"},"reasoning_effort":"high"}'),
		{
			thinking: { type: "enabled" },
			reasoning_effort: "high",
		}
	);
});

test("extra body cannot override plugin-owned request fields", () => {
	assert.throws(
		() => parseExtraBody('{"model":"other-model"}'),
		/Extra Body cannot override "model"/
	);
	assert.throws(
		() => parseExtraBody('{"temperature":0.9}'),
		/Extra Body cannot override "temperature"/
	);
});

test("extra body rejects invalid JSON and non-object values", () => {
	assert.throws(
		() => parseExtraBody("{not json"),
		/Extra Body must be valid JSON/
	);
	assert.throws(
		() => parseExtraBody('["thinking"]'),
		/Extra Body must be a JSON object/
	);
});

test("chat completion request body merges extra body after validation", () => {
	const body = buildChatCompletionRequestBody({
		model: "deepseek-v4-pro",
		messages: [{ role: "user", content: "Translate this" }],
		temperature: 0.3,
		extraBody: '{"thinking":{"type":"disabled"},"reasoning_effort":"medium"}',
	});

	assert.deepEqual(body, {
		model: "deepseek-v4-pro",
		messages: [{ role: "user", content: "Translate this" }],
		temperature: 0.3,
		thinking: { type: "disabled" },
		reasoning_effort: "medium",
	});
});

test("request behavior fingerprint is stable across JSON key order", () => {
	const first = buildRequestBehaviorFingerprint({
		temperature: 0.3,
		extraBody: '{"reasoning_effort":"high","thinking":{"type":"enabled"}}',
	});
	const second = buildRequestBehaviorFingerprint({
		temperature: 0.3,
		extraBody: '{"thinking":{"type":"enabled"},"reasoning_effort":"high"}',
	});

	assert.equal(first, second);
	assert.notEqual(
		first,
		buildRequestBehaviorFingerprint({
			temperature: 0.3,
			extraBody: '{"thinking":{"type":"disabled"},"reasoning_effort":"high"}',
		})
	);
	assert.notEqual(
		first,
		buildRequestBehaviorFingerprint({
			temperature: 0.2,
			extraBody: '{"thinking":{"type":"enabled"},"reasoning_effort":"high"}',
		})
	);
});
