import { App, PluginSettingTab, Setting } from "obsidian";
import NoteTranslationCompanionPlugin from "./main";

export interface TranslationCompanionSettings {
	baseURL: string;
	apiKey: string;
	model: string;
	temperature: number;
	extraHeaders: string;
	extraBody: string;
}

export const DEFAULT_SETTINGS: TranslationCompanionSettings = {
	baseURL: "https://api.openai.com/v1",
	apiKey: "",
	model: "gpt-4o-mini",
	temperature: 0.3,
	extraHeaders: "",
	extraBody: "",
};

export class TranslationCompanionSettingTab extends PluginSettingTab {
	plugin: NoteTranslationCompanionPlugin;

	constructor(app: App, plugin: NoteTranslationCompanionPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Note Translation Companion Settings" });

		new Setting(containerEl)
			.setName("API Base URL")
			.setDesc("The base URL for your OpenAI-compatible API provider")
			.addText((text) =>
				text
					.setPlaceholder("https://api.openai.com/v1")
					.setValue(this.plugin.settings.baseURL)
					.onChange(async (value) => {
						this.plugin.settings.baseURL = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("API Key")
			.setDesc("Your API key for the translation provider")
			.addText((text) =>
				{
					text.inputEl.type = "password";
					text.inputEl.spellcheck = false;

					return text
						.setPlaceholder("sk-...")
						.setValue(this.plugin.settings.apiKey)
						.onChange(async (value) => {
							this.plugin.settings.apiKey = value.trim();
							await this.plugin.saveSettings();
						});
				}
			);

		new Setting(containerEl)
			.setName("Model")
			.setDesc("The model to use for translation")
			.addText((text) =>
				text
					.setPlaceholder("gpt-4o-mini")
					.setValue(this.plugin.settings.model)
					.onChange(async (value) => {
						this.plugin.settings.model = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Temperature")
			.setDesc("Lower = more consistent, higher = more creative (0.0–1.0)")
			.addSlider((slider) =>
				slider
					.setLimits(0, 1, 0.1)
					.setValue(this.plugin.settings.temperature)
					.setDynamicTooltip()
					.onChange(async (value) => {
						this.plugin.settings.temperature = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Extra Headers (JSON)")
			.setDesc("Optional JSON object for provider-specific headers")
			.addTextArea((textArea) =>
				textArea
					.setPlaceholder('{"HTTP-Referer":"https://example.com","X-Title":"My Vault"}')
					.setValue(this.plugin.settings.extraHeaders)
					.onChange(async (value) => {
						this.plugin.settings.extraHeaders = value.trim();
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Extra Body (JSON)")
			.setDesc("Optional JSON object for provider-specific request body fields")
			.addTextArea((textArea) =>
				textArea
					.setPlaceholder('{"thinking":{"type":"disabled"},"reasoning_effort":"medium"}')
					.setValue(this.plugin.settings.extraBody)
					.onChange(async (value) => {
						this.plugin.settings.extraBody = value.trim();
						await this.plugin.saveSettings();
					})
			);
	}
}
