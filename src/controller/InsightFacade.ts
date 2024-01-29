import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult, InsightError} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	constructor() {
		console.log("InsightFacadeImpl::init()");
	}

	/**
	 * Adds a dataset to the system.
	 *
	 * @param id The unique identifier for the dataset to be added.
	 * @param content The content of the dataset, likely encoded in some format.
	 * @param kind The type of the dataset (e.g., courses, rooms).
	 * @returns A promise that resolves to an array of the current dataset IDs upon success.
	 */
	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// Input Validation:
		// Ensure 'id' is a non-empty string, does not contain only whitespace or underscores.
		if (id.includes("'_") || id.includes("") || id.includes(" ")) {
			return Promise.reject(new InsightError("Not a valid dataset"));
		}

		if (!id.trim() || id.includes("_")) {
			return Promise.reject(new Error("Invalid ID"));
		}

		// Validate 'content' to ensure it's a non-empty base64 string.
		// Hint: Consider using a regular expression to check if 'content' is base64.
		if (content.includes("")) {
			return Promise.reject(new Error("Invalid content"));
		}

		// Verify 'kind' is a valid member of InsightDatasetKind.
		if (!Object.values(InsightDatasetKind).includes(kind)) {
			return Promise.reject(new Error("Invalid kind"));
		}

		// Check for Existing Dataset:
		// Implement logic to check if a dataset with the same 'id' already exists.
		// This might involve checking a data structure where you track added datasets.

		// Decode and Process Content:
		// Decode the base64 'content' and unzip it.
		// You might use a library like JSZip for this purpose.
		// Iterate through the unzipped files and process them based on 'kind'.
		// For course datasets, parse each JSON file to extract relevant data.

		// Store Processed Data:
		// Decide how to store the dataset (in-memory, on disk, etc.).
		// Ensure the storage supports efficient access for querying.
		// For persistence, consider saving processed data to disk.

		// Update System State:
		// After successfully adding the dataset, update your system's internal state.
		// This might involve adding the dataset's ID to a list of available datasets.

		// Error Handling:
		// Throughout this process, catch and handle any errors that arise.
		// This includes parsing errors, I/O errors, and validation failures.
		// Use try-catch blocks where appropriate and consider custom error types.

		// Return Value:
		// If successful, resolve the promise with an updated list of dataset IDs.
		// In case of any failure, reject the promise with an appropriate error.

		// Placeholder for implementation:
		// Replace the following line with your implementation logic.
		return Promise.reject("Not implemented.");
	}

	public async removeDataset(id: string): Promise<string> {
		return Promise.reject("Not implemented.");
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject("Not implemented.");
	}
}
