import { Vault, TFile, normalizePath } from "obsidian";
import { collectMissingFolders } from "./translation-paths";

export async function ensureFolderExists(vault: Vault, folderPath: string): Promise<void> {
	const normalized = normalizePath(folderPath);
	const existingFolders = new Set<string>();
	let currentPath = "";

	for (const segment of normalized.split("/").filter(Boolean)) {
		currentPath = currentPath ? `${currentPath}/${segment}` : segment;
		const currentNormalized = normalizePath(currentPath);
		if (vault.getFolderByPath(currentNormalized)) {
			existingFolders.add(currentNormalized);
		}
	}

	for (const missingFolder of collectMissingFolders(existingFolders, normalized)) {
		const currentNormalized = normalizePath(missingFolder);
		try {
			await vault.createFolder(currentNormalized);
			existingFolders.add(currentNormalized);
		} catch (err) {
			// If another operation created it in the meantime, ignore
			if (vault.getFolderByPath(currentNormalized)) {
				existingFolders.add(currentNormalized);
				continue;
			}
			throw err;
		}
	}
}

export async function createOrModifyTranslation(
	vault: Vault,
	filePath: string,
	content: string
): Promise<TFile> {
	const normalized = normalizePath(filePath);

	// Ensure parent folders exist
	const lastSlash = normalized.lastIndexOf("/");
	if (lastSlash > 0) {
		const parentFolder = normalized.slice(0, lastSlash);
		await ensureFolderExists(vault, parentFolder);
	}

	const existingFile = vault.getFileByPath(normalized);

	if (existingFile) {
		await vault.modify(existingFile, content);
		return existingFile;
	} else {
		return await vault.create(normalized, content);
	}
}
