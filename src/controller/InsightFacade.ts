import JSZip from "jszip";
import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, InsightResult} from "./IInsightFacade";

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
		if (
			this.isValidID(id) ||
			this.isValidContent(content) ||
			this.isValidKind(kind) ||
			this.datasetIds.includes(id)
		) {
			return Promise.reject(new InsightError("ERROR"));
		}

		// Step 1: Decode and unzip the base64 content
		const zip = new JSZip();
		const decodedContent = await zip.loadAsync(content, {base64: true});

		// Step 2: Verify the structure (check for 'courses/' folder)
		const coursesFolder = decodedContent.folder("courses");
		if (coursesFolder === null) {
			throw new InsightError("courses/ folder not found in the zip file.");
		}
		if (Object.keys(coursesFolder.files)[0] !== "courses/") {
			return Promise.reject(new InsightError("courses/ named folder doest exist"));
		}
		if (Object.keys(coursesFolder.files).length === 0) {
			return Promise.reject(new InsightError("courses/ folder is empty."));
		}
		// Step 3: Validate course files
		let validDataset = false;
		const filePromises = Object.keys(coursesFolder.files).map(async (fileName) => {
			const fileEntry = coursesFolder.files[fileName];
			let fileContent = await coursesFolder.files[fileName].async("string");
			try {
				const jsonData1 = await JSON.parse(fileContent);
				if (jsonData1.result && Array.isArray(jsonData1.result) && jsonData1.result.length > 0) {
					for (const section of jsonData1.result) {
						if (this.checkValidSectionParameterKind(section)) {
							validDataset = true;
							break;
						}
					}
				}
			} catch (error) {
				if (fileEntry.dir) {
					validDataset = false;
				} else {
					return Promise.reject(new InsightError("Invalid dataset:is not a valid JSON file."));
				}
			}
		});

		await Promise.all(filePromises);

		if (!validDataset) {
			return Promise.reject(new InsightError("Invalid dataset:we don't have valid sections"));
		}
		this.datasetIds.push(id);

		// Continue with processing the dataset since it has at least one valid section
		return Promise.resolve(this.datasetIds);
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

	private checkValidSectionParameterKind(section: any) {
		return (
			typeof section.id === "number" &&
			typeof section.Course === "string" &&
			typeof section.Title === "string" &&
			typeof section.Professor === "string" &&
			typeof section.Subject === "string" &&
			typeof section.Year === "string" &&
			typeof section.Avg === "number" &&
			typeof section.Pass === "number" &&
			typeof section.Fail === "number" &&
			typeof section.Audit === "number"
		);
	}

	private isValidKind(kind: InsightDatasetKind) {
		return kind !== InsightDatasetKind.Sections;
	}

	private isValidContent(content: string) {
		return !content || !/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content);
	}

	private isValidID(id: string) {
		return id.includes("_") || !id.trim().length || id.includes(" ");
	}
}
