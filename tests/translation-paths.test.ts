import test = require("node:test");
import assert = require("node:assert/strict");
import {
	collectMissingFolders,
	getTranslationPath,
} from "../src/translation-paths";

test("getTranslationPath keeps source structure under _translations", () => {
	assert.equal(
		getTranslationPath("notes/ai/agent-design.md"),
		"_translations/notes/ai/agent-design.zh-Hans.md"
	);
});

test("collectMissingFolders creates every missing ancestor folder", () => {
	assert.deepEqual(
		collectMissingFolders(new Set<string>(), "_translations/notes/ai"),
		["_translations", "_translations/notes", "_translations/notes/ai"]
	);
});

test("collectMissingFolders skips ancestors that already exist", () => {
	assert.deepEqual(
		collectMissingFolders(
			new Set<string>(["_translations", "_translations/notes"]),
			"_translations/notes/ai"
		),
		["_translations/notes/ai"]
	);
});
