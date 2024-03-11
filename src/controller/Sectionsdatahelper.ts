import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import JSZip from "jszip";
import {Section} from "./Section";
import fs from "fs-extra";

export class SectionsDatasetHelper {
	private readonly datasetIds: string[];
	constructor(datasetIds: string[]) {
		this.datasetIds = datasetIds;
	}

	public async addDatasetSection(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
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
}
