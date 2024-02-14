import JSZip from "jszip";
import {
	IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	InsightResult,
	NotFoundError,
	ResultTooLargeError,
} from "./IInsightFacade";
import {Section} from "./Section";
import * as fs from "fs-extra";
import path from "node:path";
import {QueryHelper} from "./helper";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// Property to track dataset IDs
	private datasetIds: string[] = [];
	private queryHelper: QueryHelper;
	constructor() {
		this.queryHelper = new QueryHelper();
		// LOAD PREVIOUS SAVED DATASET HERE
		// this.init().then(() => {
		// 	console.log("Dataset IDs loaded successfully:", this.datasetIds);
		// }).catch((error) => {
		// 	console.log(error);
		// });
		console.log("InsightFacadeImpl::init()");
	}

	public async loadDatasetIds() {
		const dataFolderPath = "data"; // Path to the data folder
		try {
			// Read the contents of the data folder
			const files = await fs.readdir(dataFolderPath);
			// Extract dataset IDs from file names
			files.forEach((file) => {
				const id = file.replace(".json", ""); // Remove the file extension
				if (!this.datasetIds.includes(id)) {
					this.datasetIds.push(id);
				}
			});

			// console.log("Loaded dataset IDs:", this.datasetIds);
		} catch (err) {
			// console.error("Error reading data folder:", err);
		}
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
		// if(await this.isDatasetIdFileExists(id)){
		// 	return Promise.reject(new InsightError("ERROR"));
		// }
		await this.loadDatasetIds();
		if (this.isEntryInValid(id, content, kind)) {
			return Promise.reject(new InsightError("ERROR"));
		}
		// Step 1: Decode and unzip the base64 content
		const zip = new JSZip();
		const decodedContent = await zip.loadAsync(content, {base64: true});
		const coursesFolder = decodedContent.folder("courses");
		if (coursesFolder === null) {
			return Promise.reject(new InsightError("courses/ folder not found in the zip file."));
		}
		if (Object.keys(coursesFolder.files)[0] !== "courses/") {
			return Promise.reject(new InsightError("courses/ named folder doest exist"));
		}
		let validDataset = false;
		const filePromises = Object.keys(coursesFolder.files).map(async (fileName) => {
			if (!fileName.startsWith("courses/")) {
				return Promise.reject(new InsightError("Invalid file name:"));
			}
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

	private isEntryInValid(id: string, content: string, kind: InsightDatasetKind) {
		return (
			this.isInvalidID(id) ||
			this.isInValidContent(content) ||
			this.isInValidKind(kind) ||
			this.datasetIds.includes(id)
		);
	}

	private async isDatasetIdFileExists(id: string): Promise<boolean> {
		const filePath = path.join("data", `${id}.json`);
		try {
			await fs.promises.access(filePath, fs.constants.F_OK);
			await this.loadDatasetIds();
			return Promise.reject(new InsightError("ERROR"));
		} catch (error) {
			return false; // File does not exist or other error occurred
		}
	}

	private checkValidSectionParameterKind(section: any) {
		return (
			typeof section.id === "number" &&
			typeof section.Course === "string" &&
			typeof section.Title === "string" &&
			typeof section.Professor === "string" &&
			typeof section.Subject === "string" &&
			typeof section.Year === "string" && // Updated year check
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
			// Check if the 'data' folder exists, create it if not
			const dataFolderExists = await fs.promises.stat("data").catch(() => false);
			if (!dataFolderExists) {
				await fs.promises.mkdir("data");
			}
			await fs.promises.writeFile(filePath, jsonString);
		} catch (error) {
			return Promise.reject(new InsightError("Error creating file"));
		}
	}

	private isInValidKind(kind: InsightDatasetKind) {
		if (kind !== InsightDatasetKind.Sections) {
			return true;
		}
	}

	private isInValidContent(content: string) {
		if (content === null || content === "") {
			return true;
		}
	}

	private isInvalidID(id: string) {
		if (!id) {
			return true;
		}
		if (id.includes("_") || id.trim().length === 0) {
			return true;
		}
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
						if (sectionData.Section === "overall") {
							sectionData.Year = "1900";
						}

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
			return Promise.reject(new InsightError("Invalid dataset: no valid sections found."));
		}

		return sectionArray;
	}

	private createSectionFromData(sectionData: any): Section {
		// Add logic here to handle default values or validation as needed
		return new Section(
			String(sectionData.id),
			sectionData.Course,
			sectionData.Title,
			sectionData.Professor,
			sectionData.Subject,
			Number(sectionData.Year),
			sectionData.Avg,
			sectionData.Pass,
			sectionData.Fail,
			sectionData.Audit
		);
	}

	public async removeDataset(id: string): Promise<string> {
		await this.loadDatasetIds();
		// check if ID is valid
		if (this.isInvalidID(id)) {
			return Promise.reject(new InsightError("Invalid ID"));
		}
		// check if ID already exists
		if (!this.datasetIds.includes(id)) {
			console.log("Debug");
			console.log(this.datasetIds);
			return Promise.reject(new NotFoundError("This ID does not exist in the datasetIDs"));
		}
		// Actually remove the data
		try {
			await fs.promises.unlink(`data/${id}.json`);
			// Successfully removed the file, now remove the id from datasetIds if necessary
			this.datasetIds = this.datasetIds.filter((datasetId) => datasetId !== id);
			return Promise.resolve(id); // Resolve with the id of the removed dataset
		} catch (error) {
			return Promise.reject(new InsightError("Some error"));
		}
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		await this.loadDatasetIds();
		try {
			if (this.datasetIds.length === 0) {
				return Promise.resolve([]); // Return empty array if no dataset IDs are available
			}
			const dataFolderPath = "data";

			const readFilesPromises = this.datasetIds.map(async (id) => {
				const filePath = path.join(dataFolderPath, `${id}.json`);
				try {
					const fileContent = await fs.promises.readFile(filePath, "utf-8");
					const jsonArray = JSON.parse(fileContent);

					if (Array.isArray(jsonArray) && jsonArray.length > 0) {
						return jsonArray[0];
					} else {
						return null; // If file content is empty or not an array
					}
				} catch (error) {
					return null; // Skip if file doesn't exist or cannot be read
				}
			});

			const datasetObjects = await Promise.all(readFilesPromises);
			// Filter out null values (failed reads or empty arrays)
			const filteredDatasetObjects = datasetObjects.filter((obj) => obj !== null);

			return Promise.resolve(filteredDatasetObjects);
		} catch (error) {
			return Promise.reject(new Error("Error listing datasets"));
		}
	}

	public async performQuery(query: any): Promise<InsightResult[]> {
		try {
			const queryString = JSON.stringify(query);

			// Check if WHERE and OPTIONS properties exist
			if (!query.WHERE || !query.OPTIONS) {
				return Promise.reject(new InsightError("WHERE and OPTIONS properties are required."));
			}

			// Validate WHERE clause
			const allIDs: Set<string> = new Set<string>();
			const isValidWhere = this.queryHelper.isValidWhereClause(query.WHERE, allIDs);
			if (!isValidWhere) {
				return Promise.reject(new InsightError("Invalid WHERE clause."));
			}

			// Validate OPTIONS
			const isValidOptions = this.queryHelper.isValidOptions(query.OPTIONS, allIDs);
			if (!isValidOptions) {
				return Promise.reject(new InsightError("Invalid OPTIONS."));
			}

			// Check if the dataset ID exists
			const idExists = await this.queryHelper.checkIDExists(Array.from(allIDs)[0]);
			if (!idExists) {
				return Promise.reject(new InsightError("IDs not found in the data directory."));
			}

			// Perform the query
			const condString = this.queryHelper.traverseWhereClause(query.WHERE, allIDs);
			const items = await this.queryHelper.getMatchingItems(Array.from(allIDs)[0], condString);
			let wanted = this.queryHelper.traverseOptions(items, query.OPTIONS);
			wanted = wanted.filter((item: any) => Object.values(item).every((val: any) => val !== undefined));

			// Check if the result is too large
			if (wanted.length > 5000) {
				return Promise.reject(new ResultTooLargeError("Too big"));
			}

			// Return the result
			return Promise.resolve(wanted);
		} catch (error) {
			return Promise.reject(new InsightError("Error parsing query JSON."));
		}
	}
}
