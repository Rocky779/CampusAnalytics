import JSZip from "jszip";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightResult, InsightError} from "./IInsightFacade";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// Property to track dataset IDs
	private datasetIds: string[] = [];
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
		if (id.includes("_") || !id.trim().length || id.includes(" ")) {
			return Promise.reject(new InsightError("Not a valid dataset"));
		}

		// Validate 'content' to ensure it's a non-empty base64 string.
		if (
			!content ||
			typeof content !== "string" ||
			!/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content)
		) {
			throw new InsightError("Invalid content: Content must be a non-empty base64 string.");
		}

		// Step 1: Decode and unzip the base64 content
		const zip = new JSZip();
		const decodedContent = await zip.loadAsync(content, {base64: true});

		// Step 2: Verify the structure (check for 'courses/' folder)
		const coursesFolder = decodedContent.folder("courses");
		if (!coursesFolder) {
			throw new InsightError("courses/ folder not found in the zip file.");
		}

		// TODO create test data and validate performance
		// Step 3 & 4: Parse JSON files and validate course sections
		let validSectionsFound = false;
		const filePromises = Object.keys(coursesFolder.files).map(async (fileName) => {
			const fileContent = await coursesFolder.files[fileName].async("string");
			const jsonData = JSON.parse(fileContent);

			// Check for 'result' key with at least one valid section
			if (jsonData.result && Array.isArray(jsonData.result) && jsonData.result.length > 0) {
				validSectionsFound = true; // Mark as found and keep checking other files
			}
		});

		await Promise.all(filePromises);
		if (!validSectionsFound) {
			throw new InsightError("No valid sections found in any course file.");
		}

		// this.datasetIds.push(id); // Simplified example; ensure no duplicates, etc.
		// return Promise.resolve(this.datasetIds);

		// Verify 'kind' is a valid member of InsightDatasetKind.
		const validKinds = [InsightDatasetKind.Rooms, InsightDatasetKind.Sections];
		if (!validKinds.includes(kind)) {
			return Promise.reject(new InsightError("Invalid kind"));
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
