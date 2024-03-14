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
import {SectionsDatasetHelper} from "./Sectionsdatahelper";
import {RoomsDatasetHelper} from "./RoomDatasetHelper";
import {DataProcessor} from "./queryhelp2";
import * as wasi from "wasi";
/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {
	// Property to track dataset IDs
	private datasetIds: string[] = [];
	private queryHelper: QueryHelper;
	private sectionsHelper: SectionsDatasetHelper;

	private roomsHelper: RoomsDatasetHelper;
	private dataHelper: DataProcessor;

	constructor() {
		this.queryHelper = new QueryHelper();
		this.sectionsHelper = new SectionsDatasetHelper(this.datasetIds);
		this.roomsHelper = new RoomsDatasetHelper(this.datasetIds);
		this.dataHelper = new DataProcessor();
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
		await this.loadDatasetIds();
		try {
			if (kind === InsightDatasetKind.Sections) {
				return this.sectionsHelper.addDatasetSection(id, content, kind);
			} else if (kind === InsightDatasetKind.Rooms) {
				// Use RoomsDatasetHelper when it exists
				return this.roomsHelper.addDataset(id, content,kind);
			} else {
				return Promise.reject(new InsightError("Invalid dataset kind."));
			}
		} catch (error) {
			// Handle errors here
			return Promise.reject(new InsightError("incorrect something"));
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
					const parsedData = JSON.parse(fileContent);

					if (Array.isArray(parsedData) && parsedData.length > 0) {
						return parsedData[0];
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
			let wanted = this.queryHelper.traverseOptions(items, query.OPTIONS, false, allIDs);
			wanted = wanted.filter((item: any) => Object.values(item).every((val: any) => val !== undefined));

			// Check if the result is too large
			if (wanted.length > 5000) {
				return Promise.reject(new ResultTooLargeError("Too big"));
			}

			if (query.TRANSFORMATIONS !== undefined) {
				try {
					wanted = await this.handleTransformations(query, items, allIDs);
				} catch (error) {
					return Promise.reject(error);
				}
			}

			if (query.OPTIONS.ORDER) {
				try {
					wanted = this.dataHelper.sortItems(wanted, query.OPTIONS.ORDER);
				} catch (error) {
					return Promise.reject(new InsightError("Sorting error"));
				}
			}

			console.log(wanted);
			// Return the result
			return Promise.resolve(wanted);
		} catch (error) {
			return Promise.reject(new InsightError("Error parsing query JSON."));
		}
	}

	private async handleTransformations(query: any, items: any[], allIDs: Set<string>): Promise<any[]> {
		const transExists = this.queryHelper.isValidTransformations(query.TRANSFORMATIONS, allIDs);
		if (!transExists) {
			throw new InsightError("Incorrect transformations.");
		}

		let wanted2 = this.queryHelper.traverseOptions(items, query.OPTIONS, true, allIDs);
		wanted2 = wanted2.filter((item: any) => Object.values(item).every((val: any) => val !== undefined));

		const groupedData = this.dataHelper.groupByMultipleParameters(wanted2, query.TRANSFORMATIONS.GROUP);
		const extractedArray = this.dataHelper.extractArrays(groupedData);
		const operatedGroup = this.dataHelper.applyOperations(extractedArray, query.TRANSFORMATIONS.APPLY);
		let final = this.queryHelper.addAdditionalColumnsToAggregatedResults(operatedGroup, extractedArray);

		if (query.OPTIONS && query.OPTIONS.COLUMNS) {
			const orderedColumns = query.OPTIONS.COLUMNS;
			final = this.reorderItems(final, orderedColumns);
		}

		return final;
	}


	public reorderItems(items: any[], columns: string[]): any[] {
		return items.map((item: any) => {
			const orderedItem: any = {};
			columns.forEach((column: string) => {
				orderedItem[column] = item[column];
			});
			return orderedItem;
		});
	}

}
