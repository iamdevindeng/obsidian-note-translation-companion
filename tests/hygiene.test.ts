import test = require("node:test");
import assert = require("node:assert/strict");
import childProcess = require("node:child_process");
import fs = require("node:fs");
import path = require("node:path");

const ROOT_DIR = process.cwd();
const ABSOLUTE_PATH_NEEDLE = `/${"Users"}/`;
const PRIVATE_EMAIL_NEEDLE = ["132", "23728404"].join("");
const PRIVATE_WORKSPACE_NEEDLES = [
	["ai", "workspaces"].join("-"),
	["my", "wiki", "ai"].join("-"),
	["personal", "project"].join("_"),
];
const SECRET_PATTERNS = [
	new RegExp("\\bsk-[A-Za-z0-9_-]{16,}\\b"),
	new RegExp("\\b" + ["g", "h", "o"].join("") + "_[A-Za-z0-9_]{16,}\\b"),
	new RegExp("\\b" + "github" + "_pat_[A-Za-z0-9_]{16,}\\b"),
	new RegExp("-----" + "BEGIN [A-Z ]*PRIVATE " + "KEY-----"),
];

function collectFiles(targetPath: string): string[] {
	const absolutePath = path.join(ROOT_DIR, targetPath);
	const stat = fs.statSync(absolutePath);

	if (stat.isFile()) {
		return [targetPath];
	}

	const files: string[] = [];

	for (const entry of fs.readdirSync(absolutePath)) {
		files.push(...collectFiles(path.join(targetPath, entry)));
	}

	return files;
}

function collectTrackedFiles(): string[] {
	return childProcess
		.execFileSync("git", ["ls-files"], { cwd: ROOT_DIR, encoding: "utf8" })
		.split("\n")
		.map((line) => line.trim())
		.filter(Boolean);
}

test("test and utility files do not contain checked-in secrets or local absolute paths", () => {
	const filesToScan = [...collectFiles("src"), ...collectFiles("tests")];

	const findings: string[] = [];

	for (const relativePath of filesToScan) {
		const content = fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");

		for (const pattern of SECRET_PATTERNS) {
			if (pattern.test(content)) {
				findings.push(`${relativePath}: checked-in secret-shaped token`);
			}
		}

		if (content.includes(ABSOLUTE_PATH_NEEDLE)) {
			findings.push(`${relativePath}: developer-specific absolute path`);
		}
	}

	assert.deepEqual(findings, []);
});

test("tracked public files do not contain private workspace references", () => {
	const findings: string[] = [];

	for (const relativePath of collectTrackedFiles()) {
		const content = fs.readFileSync(path.join(ROOT_DIR, relativePath), "utf8");

		if (content.includes(ABSOLUTE_PATH_NEEDLE)) {
			findings.push(`${relativePath}: developer-specific absolute path`);
		}

		if (content.includes(PRIVATE_EMAIL_NEEDLE)) {
			findings.push(`${relativePath}: private email identifier`);
		}

		for (const needle of PRIVATE_WORKSPACE_NEEDLES) {
			if (content.includes(needle)) {
				findings.push(`${relativePath}: private workspace reference ${needle}`);
			}
		}

		for (const pattern of SECRET_PATTERNS) {
			if (pattern.test(content)) {
				findings.push(`${relativePath}: checked-in secret-shaped token`);
			}
		}
	}

	assert.deepEqual(findings, []);
});
