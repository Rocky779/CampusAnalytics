import JSZip from "jszip";
import {InsightDataset, InsightDatasetKind, InsightError} from "./IInsightFacade";
import {parse} from "parse5";
import fs from "fs-extra";
import {CustomRoomsDatasetHelper} from "./Roomdatasethelper2";
import {ValidationUtils} from "./validation";
import {GeolocationFetcher} from "./indexhtml";

export class RoomsDatasetHelper {
	public readonly datasetIds: string[];
	private utilHelper: ValidationUtils;
	private customHelper: CustomRoomsDatasetHelper;
	private geoHelper: GeolocationFetcher;

	constructor(datasetIds: string[]) {
		this.datasetIds = datasetIds;
		this.customHelper = new CustomRoomsDatasetHelper(this.datasetIds);
		this.utilHelper = new ValidationUtils();
		this.geoHelper = new GeolocationFetcher();
	}

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		if (this.isEntryInValid(id, content, kind)) {
			return Promise.reject(new InsightError("ERROR"));
		}
		try {
			const zip = new JSZip();
			await this.validateDatasetStructure(content);
			const decodedContent = await zip.loadAsync(content, {base64: true});
			await this.validateIndexHtml(decodedContent);
			this.datasetIds.push(id);
			const data = await this.customHelper.createDataset(decodedContent);
			const datasetObject: InsightDataset = {
				id: id,
				kind: InsightDatasetKind.Rooms,
				numRows: data.length,
			};

			data.unshift(datasetObject);
			const jsonString = JSON.stringify(data, null, 2);
			const filePath = `data/${id}.json`;
			try {
				// Check if the 'data' folder exists, create it if not
				const dataFolderExists = await fs.pathExists("data");
				if (!dataFolderExists) {
					await fs.mkdir("data");
				}
				await fs.writeFile(filePath, jsonString);
				console.log(`Dataset written to ${filePath}`);
			} catch (error) {
				throw new Error(`Error writing dataset to file: ${error}`);
			}

			return Promise.resolve(this.datasetIds);
		} catch (error) {
			return Promise.reject(new InsightError("error some"));
		}
	}

	private isEntryInValid(id: string, content: string, kind: InsightDatasetKind) {
		return (
			this.utilHelper.isInvalidID(id) ||
			this.utilHelper.isInValidContent(content) ||
			this.utilHelper.isInValidKind(kind) ||
			this.datasetIds.includes(id)
		);
	}

	private async validateDatasetStructure(content: string): Promise<void> {
		try {
			const zip = new JSZip();
			// Prolly error happens here
			const decodedContent = await zip.loadAsync(content, {base64: true});
			await this.utilHelper.validateCampusFolder(decodedContent);
			const indexHtml = decodedContent.file("index.htm");
			if (!indexHtml) {
				return Promise.reject( new InsightError("index.htm not found at the root of the zip file."));
			}
		} catch (error) {
			console.log(error);
			return Promise.reject(new InsightError("Error validating dataset structure."));
		}
	}

	public async validateIndexHtml(decodedContent: JSZip): Promise<void> {
		const indexHtml = decodedContent.file("index.htm");
		if (!indexHtml) {
			return Promise.reject(new InsightError("index.htm not found at the root of the zip file."));
		}

		const indexHtmlContent = await indexHtml.async("text");
		const document = parse(indexHtmlContent);


		// Find and validate the table within the index.htm file
		const buildingTable = this.geoHelper.findBuildingTable(document);
		if (!buildingTable) {
			return Promise.reject(new InsightError("No valid building table found in index.htm."));
		}

		// Further validation of the building table if needed
		// Validate each building file linked from the index.htm file
		const buildingNames = this.geoHelper.extractBuildingNames(buildingTable);
		let isValidDataset = false;

		const promises = buildingNames.map(async (buildingName) => {
			try {
				let thing = await this.geoHelper.validateBuildingFile(decodedContent, buildingName, buildingTable);
				isValidDataset = true;
			} catch (error) {
				//
			}
		});

		await Promise.all(promises);

		if (!isValidDataset) {
			return Promise.reject(new InsightError("None of the building files were validated successfully."));
		} else{
			return Promise.resolve();
		}
	}

}
