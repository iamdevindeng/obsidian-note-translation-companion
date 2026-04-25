import { stringifyYaml, parseYaml } from "obsidian";
import { getLeadingFrontmatter, stripLeadingFrontmatter } from "./markdown-structure";
import {
	appendTerminalCacheMetadataComment,
	extractMetadataFromFrontmatter,
	parseTerminalCacheMetadataComment,
	StoredMetadataLocation,
	TranslationMetadata,
} from "./translation-document";

export interface ParsedTranslatedDocument {
	sourceFrontmatter: Record<string, unknown> | null;
	body: string;
	cacheMetadata: TranslationMetadata | null;
	metadataLocation: StoredMetadataLocation;
	needsMigration: boolean;
}

export function parseLeadingFrontmatterObject(
	text: string
): Record<string, unknown> | null {
	const frontmatterBlock = getLeadingFrontmatter(text);
	if (!frontmatterBlock) {
		return null;
	}

	const yamlBody = frontmatterBlock
		.replace(/^---\r?\n/, "")
		.replace(/\r?\n---(?:\r?\n|$)$/, "");

	try {
		const parsed = parseYaml(yamlBody);
		if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
			return null;
		}

		return parsed as Record<string, unknown>;
	} catch {
		return null;
	}
}

export function frontmatterToYaml(frontmatter: Record<string, unknown>): string {
	const yamlBody = stringifyYaml(frontmatter);
	return `---\n${yamlBody}---\n`;
}

export function parseTranslatedDocument(
	text: string
): ParsedTranslatedDocument {
	const parsedTerminalComment = parseTerminalCacheMetadataComment(text);
	const rawFrontmatter = parseLeadingFrontmatterObject(
		parsedTerminalComment.contentWithoutMetadataComment
	);
	const extractedFrontmatter = extractMetadataFromFrontmatter(rawFrontmatter);

	return {
		sourceFrontmatter: extractedFrontmatter.sourceFrontmatter,
		body: stripLeadingFrontmatter(parsedTerminalComment.contentWithoutMetadataComment),
		cacheMetadata:
			parsedTerminalComment.metadata ?? extractedFrontmatter.metadata,
		metadataLocation: parsedTerminalComment.metadata
			? "comment"
			: extractedFrontmatter.location,
		needsMigration:
			(parsedTerminalComment.metadata ?? extractedFrontmatter.metadata) !== null &&
			(
				!parsedTerminalComment.found ||
				parsedTerminalComment.metadata === null ||
				extractedFrontmatter.hadPluginMetadata
			),
	};
}

export function buildTranslatedDocument(
	sourceFrontmatter: Record<string, unknown> | null,
	body: string,
	cacheMetadata: TranslationMetadata
): string {
	const extractedFrontmatter = extractMetadataFromFrontmatter(sourceFrontmatter);
	const leadingFrontmatter = extractedFrontmatter.sourceFrontmatter
		? frontmatterToYaml(extractedFrontmatter.sourceFrontmatter)
		: "";

	return appendTerminalCacheMetadataComment(
		leadingFrontmatter + body,
		cacheMetadata
	);
}
