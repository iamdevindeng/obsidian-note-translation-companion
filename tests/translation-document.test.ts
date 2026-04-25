import test = require("node:test");
import assert = require("node:assert/strict");
import {
	appendTerminalCacheMetadataComment,
	applyFrontmatterTranslations,
	buildTerminalCacheMetadataComment,
	buildTranslationMetadata,
	collectFrontmatterTranslationCandidates,
	extractMetadataFromFrontmatter,
	isCacheValid,
	parseTerminalCacheMetadataComment,
	PROMPT_VERSION,
	TARGET_LANG,
	TERMINAL_CACHE_METADATA_MARKER,
} from "../src/translation-document";

const DEFAULT_REQUEST_HASH = "sha256:default-request";
const CUSTOM_REQUEST_HASH = "sha256:custom-request";

test("terminal cache metadata comment is appended at EOF and parsed back out", () => {
	const metadata = buildTranslationMetadata(
		"wiki/skills/my-wiki-maintainer.md",
		"sha256:abc123",
		"english",
		"https://api.deepseek.com/v1",
		"deepseek-chat",
		DEFAULT_REQUEST_HASH
	);
	const content = `---
name: my-wiki-maintainer
description: 当用户希望将近期工作汇总到本知识库中时使用。
---

## Properties

| Field | Value |
| --- | --- |
| Description | 这是正文里的表格，不是顶部 Properties。 |`;

	const withComment = appendTerminalCacheMetadataComment(content, metadata);
	const parsed = parseTerminalCacheMetadataComment(withComment);

	assert.ok(withComment.includes(`<!-- ${TERMINAL_CACHE_METADATA_MARKER}`));
	assert.ok(withComment.endsWith("-->\n"));
	assert.equal(parsed.found, true);
	assert.equal(parsed.contentWithoutMetadataComment, content);
	assert.equal(parsed.metadata?.ntc_translation_of, metadata.ntc_translation_of);
	assert.ok(parsed.contentWithoutMetadataComment.includes("| Field | Value |"));
});

test("frontmatter metadata extraction strips ntc_* keys and keeps source properties", () => {
	const frontmatter = {
		name: "my-wiki-maintainer",
		description: "Use when the user wants to compile recent work into this vault.",
		tags: ["skills", "obsidian"],
		ntc_translation_of: "wiki/skills/my-wiki-maintainer.md",
		ntc_source_hash: "sha256:abc123",
		ntc_source_lang: "english",
		ntc_target_lang: TARGET_LANG,
		ntc_provider: "https://api.deepseek.com/v1",
		ntc_model: "deepseek-chat",
		ntc_prompt_version: PROMPT_VERSION,
		ntc_request_hash: DEFAULT_REQUEST_HASH,
		ntc_generated_at: "2026-04-23T07:03:54.004Z",
		ntc_plugin_version: "1.0.0",
	};

	const extracted = extractMetadataFromFrontmatter(frontmatter);

	assert.equal(extracted.location, "frontmatter-ntc");
	assert.equal(extracted.hadPluginMetadata, true);
	assert.deepEqual(extracted.sourceFrontmatter, {
		name: "my-wiki-maintainer",
		description: "Use when the user wants to compile recent work into this vault.",
		tags: ["skills", "obsidian"],
	});
	assert.equal(
		extracted.metadata?.ntc_translation_of,
		"wiki/skills/my-wiki-maintainer.md"
	);
});

test("legacy frontmatter metadata is stripped only when the full cache key set exists", () => {
	const legacyFrontmatter = {
		name: "my-wiki-maintainer",
		translation_of: "wiki/skills/my-wiki-maintainer.md",
		source_hash: "sha256:abc123",
		source_lang: "english",
		target_lang: TARGET_LANG,
		provider: "https://api.deepseek.com/v1",
		model: "deepseek-chat",
		prompt_version: PROMPT_VERSION,
		request_hash: DEFAULT_REQUEST_HASH,
		generated_at: "2026-04-23T07:03:54.004Z",
		plugin_version: "1.0.0",
	};

	const extractedLegacy = extractMetadataFromFrontmatter(legacyFrontmatter);
	assert.equal(extractedLegacy.location, "frontmatter-legacy");
	assert.deepEqual(extractedLegacy.sourceFrontmatter, {
		name: "my-wiki-maintainer",
	});

	const userFrontmatter = {
		name: "skill page",
		provider: "DeepSeek",
		model: "Skill Card",
	};
	const extractedUserFrontmatter = extractMetadataFromFrontmatter(userFrontmatter);
	assert.equal(extractedUserFrontmatter.location, "none");
	assert.deepEqual(extractedUserFrontmatter.sourceFrontmatter, userFrontmatter);
});

test("frontmatter translation candidates include readable values but skip identifiers", () => {
	const sourceFrontmatter = {
		name: "my-wiki-maintainer",
		description:
			"Use when the user wants to compile recent work into this vault.",
		status: "draft",
		generated_at: "2026-04-23T10:00:00Z",
		provider: "deepseek",
		aliases: ["My Wiki Maintainer", "my-wiki-maintainer"],
		links: ["[[wiki/skills/README]]"],
	};

	const candidates = collectFrontmatterTranslationCandidates(sourceFrontmatter);

	assert.deepEqual(
		candidates.map((candidate) => `${candidate.key}:${candidate.index ?? "single"}`),
		["description:single", "status:single", "aliases:0"]
	);
});

test("frontmatter translations update only translated candidate values", () => {
	const sourceFrontmatter = {
		name: "my-wiki-maintainer",
		description:
			"Use when the user wants to compile recent work into this vault.",
		aliases: ["My Wiki Maintainer", "my-wiki-maintainer"],
		status: "draft",
	};

	const candidates = collectFrontmatterTranslationCandidates(sourceFrontmatter);
	const descriptionCandidate = candidates.find(
		(candidate) => candidate.key === "description"
	);
	const aliasesCandidate = candidates.find(
		(candidate) => candidate.key === "aliases" && candidate.index === 0
	);

	assert.ok(descriptionCandidate);
	assert.ok(aliasesCandidate);

	const translated = applyFrontmatterTranslations(sourceFrontmatter, candidates, {
		[descriptionCandidate.id]: "当用户想把最近的工作整理进这个仓库时使用。",
		[aliasesCandidate.id]: "我的 Wiki 维护器",
	});

	assert.equal(translated.name, "my-wiki-maintainer");
	assert.equal(translated.status, "draft");
	assert.equal(
		translated.description,
		"当用户想把最近的工作整理进这个仓库时使用。"
	);
	assert.deepEqual(translated.aliases, ["我的 Wiki 维护器", "my-wiki-maintainer"]);
});

test("cache validation accepts comment/new metadata and legacy keys", () => {
	const inputs = {
		sourcePath: "wiki/skills/my-wiki-maintainer.md",
		sourceHash: "sha256:abc123",
		targetLang: TARGET_LANG,
		provider: "https://api.deepseek.com/v1",
		model: "deepseek-chat",
		promptVersion: PROMPT_VERSION,
		requestHash: DEFAULT_REQUEST_HASH,
		defaultRequestHash: DEFAULT_REQUEST_HASH,
	};

	const commentMetadata = buildTranslationMetadata(
		inputs.sourcePath,
		inputs.sourceHash,
		"english",
		inputs.provider,
		inputs.model,
		inputs.requestHash
	);
	const legacySchema = {
		translation_of: inputs.sourcePath,
		source_hash: inputs.sourceHash,
		target_lang: inputs.targetLang,
		provider: inputs.provider,
		model: inputs.model,
		prompt_version: inputs.promptVersion,
	};

	assert.equal(isCacheValid(commentMetadata, inputs), true);
	assert.equal(isCacheValid(legacySchema, inputs), true);
	assert.equal(
		isCacheValid({ ...commentMetadata, ntc_source_hash: "sha256:different" }, inputs),
		false
	);
	assert.equal(
		isCacheValid(
			{ ...commentMetadata, ntc_request_hash: CUSTOM_REQUEST_HASH },
			inputs
		),
		false
	);
	assert.equal(
		isCacheValid(legacySchema, {
			...inputs,
			requestHash: CUSTOM_REQUEST_HASH,
		}),
		false
	);
});

test("terminal metadata comment builder uses a stable marker", () => {
	const metadata = buildTranslationMetadata(
		"notes/example.md",
		"sha256:demo",
		"english",
		"https://api.example.com/v1",
		"demo-model",
		DEFAULT_REQUEST_HASH
	);
	const comment = buildTerminalCacheMetadataComment(metadata);

	assert.ok(comment.startsWith(`<!-- ${TERMINAL_CACHE_METADATA_MARKER}\n`));
	assert.ok(comment.includes('"ntc_translation_of": "notes/example.md"'));
	assert.ok(comment.includes('"ntc_request_hash": "sha256:default-request"'));
});
