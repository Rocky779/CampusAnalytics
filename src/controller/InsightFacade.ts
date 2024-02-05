import JSZip from "jszip";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
} from "./IInsightFacade";
import {Section} from "./Section";
import * as fs from "fs-extra";
import path from "node:path";
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
		if (this.isEntryValid(id, content, kind)) {
			return Promise.reject(new InsightError("ERROR"));
		}
		// Step 1: Decode and unzip the base64 content
		const zip = new JSZip();
		const decodedContent = await zip.loadAsync(content, {base64: true});
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
			return Promise.reject(new InsightError("Invalid dataset:we dont have valid sections"));
		} else {
			let sectionArray: any[] = await this.addFiler(id, content);
			await this.writeDatasetToFile(id, sectionArray);
		}
		this.datasetIds.push(id);
		return Promise.resolve(this.datasetIds);
	}

	private isEntryValid(id: string, content: string, kind: InsightDatasetKind) {
		return (
			this.isInvalidID(id) ||
			this.isValidContent(content) ||
			this.isValidKind(kind) ||
			this.datasetIds.includes(id)
		);
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

	private async writeDatasetToFile(id: string, sectionArray: any[]): Promise<void> {
		const datasetObject: InsightDataset = {
			id: id,
			kind: InsightDatasetKind.Sections,
			numRows: sectionArray.length,
		};

		sectionArray.unshift(datasetObject);

		const jsonString = JSON.stringify(sectionArray, null, 2);
		const filePath = `data/${id}.json`;

		try {
			await fs.promises.writeFile(filePath, jsonString);
		} catch (error) {
			console.error("Error creating file:", error);
			throw new InsightError("Error creating file");
		}
	}

	private isValidKind(kind: InsightDatasetKind) {
		return kind !== InsightDatasetKind.Sections;
	}

	private isValidContent(content: string) {
		return !content || !/^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(content);
	}

	private isInvalidID(id: string) {
		return id.includes("_") || !id.trim().length || id.includes(" ");
	}

	private async addFiler(id: string, content: string): Promise<Section[]> {
		// Decode and unzip the base64 content
		const zip = new JSZip();
		const decodedContent = await zip.loadAsync(content, {base64: true});
		const coursesFolder = decodedContent.folder("courses");
		if (coursesFolder === null) {
			throw new InsightError("courses/ folder not found in the zip file.");
		}
		const sectionArray: Section[] = [];
		const filePromises = Object.keys(coursesFolder.files).map(async (fileName) => {
			const fileEntry = coursesFolder.files[fileName];
			let fileContent = await fileEntry.async("string");
			try {
				let jsonData1 = JSON.parse(fileContent);
				if (jsonData1.result && Array.isArray(jsonData1.result) && jsonData1.result.length > 0) {
					for (const sectionData of jsonData1.result) {
						const newSection = this.createSectionFromData(sectionData);
						sectionArray.push(newSection);
					}
				}
			} catch (error) {
				if (!fileEntry.dir) {
					return Promise.reject(new InsightError("Invalid dataset: not a valid JSON file."));
				}
			}
		});

		await Promise.all(filePromises);

		if (sectionArray.length === 0) {
			throw new InsightError("Invalid dataset: no valid sections found.");
		}

		return sectionArray;
	}

	private createSectionFromData(sectionData: any): Section {
		// Add logic here to handle default values or validation as needed
		return new Section(
			String(sectionData.id) || "",
			sectionData.Course || "",
			sectionData.Title || "",
			sectionData.Professor || "",
			sectionData.Subject || "",
			Number(sectionData.Year) || 0,
			sectionData.Avg || 0,
			sectionData.Pass || 0,
			sectionData.Fail || 0,
			sectionData.Audit || 0
		);
	}

	public async removeDataset(id: string): Promise<string> {
		// check if ID is valid
		if (this.isInvalidID(id)) {
			return Promise.reject(new InsightError("Invalid ID"));
		}
		// check if ID already exists
		if (!this.datasetIds.includes(id)) {
			return Promise.reject(new NotFoundError("This ID does not exist in the datasetIDs"));
		}
		// Actually remove the data
		try {
			await fs.promises.unlink(`data/${id}.json`);
			// Successfully removed the file, now remove the id from datasetIds if necessary
			this.datasetIds = this.datasetIds.filter((datasetId) => datasetId !== id);
			return Promise.resolve(id); // Resolve with the id of the removed dataset
		} catch (error) {
			// Log the error and reject the promise with a more specific error
			console.error(error);
			throw new InsightError("Failed to remove dataset");
		}
	}

	public async performQuery(query: unknown): Promise<InsightResult[]> {
		return Promise.reject("Not implemented.");
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		try {
			const dataFolderPath = "data";
			const files = await fs.readdir(dataFolderPath);
			const datasetObjects: any = [];

			const readFilesPromises = files.map(async (file) => {
				if (file.endsWith(".json")) {
					const filePath = path.join(dataFolderPath, file);
					const fileContent = await fs.readFile(filePath, "utf-8");
					const jsonArray = JSON.parse(fileContent);

					if (Array.isArray(jsonArray) && jsonArray.length > 0) {
						datasetObjects.push(jsonArray[0]);
					}
				}
			});

			await Promise.all(readFilesPromises);
			return datasetObjects;
		} catch (error) {
			console.error("Error listing datasets:", error);
			throw new Error("Error listing datasets");
		}
	}
}
