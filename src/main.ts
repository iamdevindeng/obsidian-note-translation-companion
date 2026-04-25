import { Plugin, TFile, Notice, normalizePath } from "obsidian";
import {
	TranslationCompanionSettings,
	DEFAULT_SETTINGS,
	TranslationCompanionSettingTab,
} from "./settings";
import { detectLanguage } from "./language-detection";
import { translateText, translateFrontmatterValues } from "./translation-api";
import { createOrModifyTranslation } from "./file-utils";
import { sha256Hex } from "./hash";
import {
	buildTranslatedDocument,
	parseLeadingFrontmatterObject,
	parseTranslatedDocument,
} from "./frontmatter";
import { getTranslationPath } from "./translation-paths";
import { SingleFlightByKey } from "./single-flight";
import { stripLeadingFrontmatter } from "./markdown-structure";
import {
	buildTranslationMetadata,
	isCacheValid,
	PROMPT_VERSION,
	TARGET_LANG,
} from "./translation-document";
import {
	buildRequestBehaviorFingerprint,
	DEFAULT_REQUEST_BEHAVIOR_FINGERPRINT,
} from "./provider-request";

export default class NoteTranslationCompanionPlugin extends Plugin {
	settings: TranslationCompanionSettings;
	private readonly inFlightTranslations = new SingleFlightByKey<void>();

	async onload(): Promise<void> {
		await this.loadSettings();

		this.addSettingTab(new TranslationCompanionSettingTab(this.app, this));

		this.addCommand({
			id: "open-chinese-translation",
			name: "Open Chinese Translation In New Pane",
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				const isMarkdown = activeFile?.extension === "md";

				if (!isMarkdown) {
					return false;
				}

				if (!checking) {
					this.startTranslation(activeFile as TFile, false);
				}

				return true;
			},
		});

		this.addCommand({
			id: "refresh-chinese-translation",
			name: "Refresh Translation For Current Note",
			checkCallback: (checking: boolean) => {
				const activeFile = this.app.workspace.getActiveFile();
				const isMarkdown = activeFile?.extension === "md";

				if (!isMarkdown) {
					return false;
				}

				if (!checking) {
					this.startTranslation(activeFile as TFile, true);
				}

				return true;
			},
		});

		console.log("Note Translation Companion plugin loaded");
	}

	onunload(): void {
		console.log("Note Translation Companion plugin unloaded");
	}

	async loadSettings(): Promise<void> {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings(): Promise<void> {
		await this.saveData(this.settings);
	}

	startTranslation(sourceFile: TFile, force: boolean): void {
		const run = this.inFlightTranslations.run(sourceFile.path, () =>
			this.performTranslation(sourceFile, force)
		);

		if (!run.started) {
			new Notice("[NTC] Translation already in progress for this note.");
			return;
		}

		run.promise.catch((err) => {
			console.error("[NTC] performTranslation error:", err);
			new Notice(`Translation error: ${err instanceof Error ? err.message : String(err)}`);
		});
	}

	async performTranslation(sourceFile: TFile, force: boolean): Promise<void> {
		let loadingNotice: Notice | null = null;

		try {
			// Step 1: Read source content
			console.log("[NTC] Step 1: Reading source file...");
			const t0 = performance.now();
			let content: string;
			try {
				content = await this.app.vault.read(sourceFile);
			} catch (err) {
				new Notice(`[NTC] Failed to read note: ${err instanceof Error ? err.message : String(err)}`);
				return;
			}
			console.log(`[NTC] Step 1 done in ${(performance.now() - t0).toFixed(1)}ms`);
			const sourceFrontmatter = parseLeadingFrontmatterObject(content);
			const sourceBody = stripLeadingFrontmatter(content);

			// Step 2: Detect language
			console.log("[NTC] Step 2: Detecting language...");
			const lang = detectLanguage(content);

			if (lang === "chinese") {
				new Notice("[NTC] This note appears to be Chinese-dominant. Translation skipped.");
				return;
			}

			if (lang === "unknown") {
				new Notice("[NTC] Language unclear — attempting translation anyway...");
			}

			// Step 3: Compute source hash
			console.log("[NTC] Step 3: Computing source hash...");
			const t3 = performance.now();
			const sourceHash = await sha256Hex(content);
			console.log(`[NTC] Step 3 done in ${(performance.now() - t3).toFixed(1)}ms`);

			let requestHash: string;
			let defaultRequestHash: string;
			try {
				const requestFingerprint = buildRequestBehaviorFingerprint(this.settings);
				const [requestHashHex, defaultRequestHashHex] = await Promise.all([
					sha256Hex(requestFingerprint),
					sha256Hex(DEFAULT_REQUEST_BEHAVIOR_FINGERPRINT),
				]);
				requestHash = `sha256:${requestHashHex}`;
				defaultRequestHash = `sha256:${defaultRequestHashHex}`;
			} catch (err) {
				new Notice(`[NTC] ${err instanceof Error ? err.message : String(err)}`);
				return;
			}

			// Step 4: Compute translation path and check cache
			console.log("[NTC] Step 4: Checking cache...");
			const t4 = performance.now();
			const translationPath = getTranslationPath(sourceFile.path);
			const normalizedPath = normalizePath(translationPath);
			const existingFile = this.app.vault.getFileByPath(normalizedPath);

			if (!force && existingFile) {
				const existingContent = await this.app.vault.read(existingFile);
				const parsedTranslation = parseTranslatedDocument(existingContent);
				const isValid = isCacheValid(parsedTranslation.cacheMetadata, {
					sourcePath: sourceFile.path,
					sourceHash,
					targetLang: TARGET_LANG,
					provider: this.settings.baseURL,
					model: this.settings.model,
					promptVersion: PROMPT_VERSION,
					requestHash,
					defaultRequestHash,
				});

				console.log(`[NTC] Step 4 done in ${(performance.now() - t4).toFixed(1)}ms, cache valid: ${isValid}`);

				if (isValid) {
					if (parsedTranslation.cacheMetadata) {
						const migratedMetadata = {
							...parsedTranslation.cacheMetadata,
							ntc_request_hash: requestHash,
						};
						const migratedContent = buildTranslatedDocument(
							parsedTranslation.sourceFrontmatter,
							parsedTranslation.body,
							migratedMetadata
						);

						if (
							(parsedTranslation.needsMigration ||
								parsedTranslation.cacheMetadata.ntc_request_hash !== requestHash) &&
							migratedContent !== existingContent
						) {
							try {
								await this.app.vault.modify(existingFile, migratedContent);
							} catch (err) {
								console.warn(
									"[NTC] Failed to migrate cached translation format:",
									err
								);
							}
						}
					}

					await this.openTranslationInRightPane(existingFile);
					new Notice("[NTC] Translation up to date (cache)");
					return;
				}
			} else {
				console.log(`[NTC] Step 4 done in ${(performance.now() - t4).toFixed(1)}ms, no cache check (force=${force}, exists=${!!existingFile})`);
			}

			// Step 5: Validate settings
			if (!this.settings.apiKey) {
				new Notice("[NTC] API key not configured. Check plugin settings.");
				return;
			}

			// Step 6: Call translation API
			console.log("[NTC] Step 6: Calling translation API...");
			const t6 = performance.now();
			loadingNotice = new Notice("Translating...", 0);
			const translatedFrontmatterPromise = sourceFrontmatter
				? translateFrontmatterValues(sourceFrontmatter, this.settings)
				: Promise.resolve(null);
			const result = await translateText(sourceBody, this.settings);
			const translatedFrontmatterResult = await translatedFrontmatterPromise;
			loadingNotice.hide();
			loadingNotice = null;
			console.log(`[NTC] Step 6 done in ${(performance.now() - t6).toFixed(1)}ms`);

			if (!result.success) {
				new Notice(`Translation failed: ${result.error}`);
				return;
			}

			if (translatedFrontmatterResult?.usedFallback) {
				console.warn(
					"[NTC] Source frontmatter translation fallback:",
					translatedFrontmatterResult.error ?? "unknown error"
				);
			}

			// Step 7: Build frontmatter and prepend to translated text
			console.log("[NTC] Step 7: Building frontmatter...");
			const metadata = buildTranslationMetadata(
				sourceFile.path,
				sourceHash,
				lang === "unknown" ? "unknown" : lang,
				this.settings.baseURL,
				this.settings.model,
				requestHash
			);
			const fullContent = buildTranslatedDocument(
				translatedFrontmatterResult?.translatedFrontmatter ?? sourceFrontmatter,
				result.translatedText,
				metadata
			);

			// Step 8: Save translation file
			console.log("[NTC] Step 8: Saving translation file...");
			const t8 = performance.now();
			let translationFile: TFile;
			try {
				translationFile = await createOrModifyTranslation(
					this.app.vault,
					translationPath,
					fullContent
				);
			} catch (err) {
				new Notice(`Failed to save translation: ${err instanceof Error ? err.message : String(err)}`);
				return;
			}
			console.log(`[NTC] Step 8 done in ${(performance.now() - t8).toFixed(1)}ms`);

			// Step 9: Open in right pane
			await this.openTranslationInRightPane(translationFile);

			// Step 10: Success notice
			new Notice(`Translation saved: ${translationFile.name}`);

		} catch (err) {
			// Global catch-all for performTranslation
			if (loadingNotice) {
				loadingNotice.hide();
			}
			console.error("[NTC] Unhandled error in performTranslation:", err);
			new Notice(`Translation error: ${err instanceof Error ? err.message : String(err)}`);
		}
	}

	async openTranslationInRightPane(file: TFile): Promise<void> {
		const { workspace } = this.app;
		const rightLeaf = workspace.getRightLeaf(false);

		if (!rightLeaf) {
			new Notice("[NTC] Could not create right pane");
			return;
		}

		await rightLeaf.openFile(file);
		workspace.revealLeaf(rightLeaf);
	}
}
