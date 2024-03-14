import {InsightError} from "./IInsightFacade";
import {Room} from "./Rooms";
import JSZip from "jszip";
import {parse} from "parse5";
import {RoomsDatasetHelper} from "./RoomDatasetHelper";
import {GeolocationFetcher} from "./indexhtml";
import {GeoResponse} from "./response";

export class CustomRoomsDatasetHelper {
	private roomsDatasetHelper: GeolocationFetcher;

	constructor(datasetIds: string[]) {
		this.roomsDatasetHelper = new GeolocationFetcher();
	}

	public async createDataset(decodedContent: JSZip): Promise<any[]> {
		const indexHtml = decodedContent.file("index.htm");
		if (!indexHtml) {
			throw new InsightError("index.htm not found at the root of the zip file.");
		}

		const indexHtmlContent = await indexHtml.async("text");
		const document = parse(indexHtmlContent);

		// Find and validate the table within the index.htm file
		const buildingTable = this.roomsDatasetHelper.findBuildingTable(document);
		const buildingNames = this.extractBuildingNames(buildingTable);
		let combinedInfo: Room[] = [];

		// Extract building names and some information from the building table
		// Create an array of promises for room extraction
		const roomPromises = buildingNames.map(async (building) => {
			const buildingFile = decodedContent.file(`campus/discover/buildings-and-classrooms/${building}.htm`);
			if (!buildingFile) {
				throw new InsightError(`Building file not found: ${building}.htm`);
			}
			const buildingInfo = this.extractBuildingInfo(buildingTable, building);
			const buildingFileContent = await buildingFile.async("text");
			const parsedData = parse(buildingFileContent);
			const roomTable = this.roomsDatasetHelper.findRoomTable(parsedData);
			if (roomTable) {
				// Extract room information from the room table for this building
				const roomInfos = this.extractRoomInfo(roomTable);

				// Combine building information with room information for this building
				const combined = await this.combineBuildingAndRoomInfo(buildingInfo, roomInfos);
				combinedInfo = combinedInfo.concat(combined);
				// Perform additional validation or processing as needed with combinedInfo
			} else {
				//
			}
		});

		// Wait for all room extraction promises to resolve
		await Promise.all(roomPromises);
		return combinedInfo;
	}

	private extractBuildingInfo(buildingTable: any, buildingName: string): any {
		const requiredClasses = [
			"views-field-field-building-code",
			"views-field-title",
			"views-field-field-building-address"
		];

		let buildingInfo: any = {};

		for (const childNode of buildingTable.childNodes) {
			if (childNode.nodeName === "tbody") {
				for (const trNode of childNode.childNodes) {
					if (trNode.nodeName === "tr") {
						const {foundClasses, isMatchingRow, innerText} =
							this.extractBuildingInfoFromRow(trNode, requiredClasses, buildingName);
						if (foundClasses.size === requiredClasses.length && isMatchingRow) {
							buildingInfo.code = innerText;
							buildingInfo.name = this.extractBuildingName(trNode, buildingName);
							buildingInfo.address = this.extractBuildingAddress(trNode);
							return buildingInfo;
						}
					}
				}
			}
		}

		throw new InsightError(`Failed to extract building info for ${buildingName}.`);
	}

	private extractBuildingInfoFromRow(trNode: any, requiredClasses: string[], buildingName: string):
		{foundClasses: Set<string>, isMatchingRow: boolean, innerText: string} {
		const foundClasses = new Set<string>();
		let isMatchingRow = false;
		let innerText = "";

		for (const tdNode of trNode.childNodes) {
			if (tdNode.nodeName === "td") {
				for (const className of requiredClasses) {
					if (this.roomsDatasetHelper.hasClass(tdNode, className)) {
						foundClasses.add(className);
						switch (className) {
							case "views-field-field-building-code":
								innerText = this.roomsDatasetHelper.getNodeText(tdNode);
								isMatchingRow = innerText === buildingName;
								break;
						}
					}
				}
			}
		}

		return {foundClasses, isMatchingRow, innerText};
	}

	private extractBuildingName(trNode: any, buildingName: string): string {
		let name = "";
		for (const tdNode of trNode.childNodes) {
			if (tdNode.nodeName === "td" && this.roomsDatasetHelper.hasClass(tdNode, "views-field-title")) {
				for (const aNode of tdNode.childNodes) {
					if (aNode.nodeName === "a") {
						name = this.roomsDatasetHelper.getNodeText(aNode);
						break;
					}
				}
				break;
			}
		}
		return name;
	}

	private extractBuildingAddress(trNode: any): string {
		let address = "";
		for (const tdNode of trNode.childNodes) {
			if (tdNode.nodeName === "td" &&
				this.roomsDatasetHelper.hasClass(tdNode, "views-field-field-building-address")) {
				address = this.roomsDatasetHelper.getNodeText(tdNode);
				break;
			}
		}
		return address;
	}

	private extractRoomInfo(roomTable: any): any[] {
		const roomInfos: any[] = [];

		for (const childNode of roomTable.childNodes) {
			if (childNode.nodeName === "tbody") {
				for (const trNode of childNode.childNodes) {
					if (trNode.nodeName === "tr") {
						const roomInfo = this.extractRoomInfoFromRow(trNode);
						if (roomInfo) {
							roomInfos.push(roomInfo);
						}
					}
				}
			}
		}

		return roomInfos;
	}

	private extractRoomInfoFromRow(trNode: any): any {
		const requiredClasses = [
			"views-field-field-room-number",
			"views-field-field-room-capacity",
			"views-field-field-room-furniture",
			"views-field-field-room-type",
			"views-field-nothing"
		];

		const roomInfo: any = {};
		const foundClasses = new Set<string>();

		for (const tdNode of trNode.childNodes) {
			if (tdNode.nodeName === "td") {
				this.extractRoomInfoFromClass(tdNode, requiredClasses, roomInfo, foundClasses);
			}
		}

		// Check if all required classes are found for this room
		if (foundClasses.size === requiredClasses.length) {
			return roomInfo;
		}

		return null; // Return null if the row doesn't contain all required classes
	}

	private extractRoomInfoFromClass
	(tdNode: any, requiredClasses: string[], roomInfo: any, foundClasses: Set<string>): void {
		for (const className of requiredClasses) {
			if (this.roomsDatasetHelper.hasClass(tdNode, className)) {
				foundClasses.add(className);
				switch (className) {
					case "views-field-field-room-number":
						for (const childNode1 of tdNode.childNodes) {
							if (childNode1.nodeName === "a") {
								roomInfo.number = this.roomsDatasetHelper.getNodeText(childNode1);
								break;
							}
						}
						break;
					case "views-field-field-room-capacity":
						roomInfo.capacity = parseInt(this.roomsDatasetHelper.getNodeText(tdNode), 10);
						break;
					case "views-field-field-room-furniture":
						roomInfo.furniture = this.roomsDatasetHelper.getNodeText(tdNode);
						break;
					case "views-field-field-room-type":
						roomInfo.type = this.roomsDatasetHelper.getNodeText(tdNode);
						break;
					case "views-field-nothing":
						for (const c1 of tdNode.childNodes) {
							if (c1.nodeName === "a" && c1.attrs) {
								const hrefAttr = c1.attrs.find((attr: any) =>
									attr.name === "href");
								if (hrefAttr) {
									roomInfo.link = hrefAttr.value;
									break;
								}
							}
						}
						break;
				}
			}
		}
	}


	private async combineBuildingAndRoomInfo(buildingInfo: any, roomInfos: any[]): Promise<Room[]> {
		const combinedInfo: Room[] = [];

		// Fetch geolocation once for the building
		const geolocation = await this.roomsDatasetHelper.fetchGeolocation(buildingInfo.address);
		// If geolocation has lat and lon defined
		if (geolocation.lat !== undefined && geolocation.lon !== undefined) {
			// Loop through each room info and create a new Room instance
			for (const roomInfo of roomInfos) {
				// Combine building info with room info
				const fullName = buildingInfo.name;
				const shortName = buildingInfo.code;
				const address = buildingInfo.address;

				const {
					number,
					capacity,
					type,
					furniture,
					link
				} = roomInfo;
				const name = shortName + "_" + number;

				// Create a new Room instance
				const room = new Room(
					fullName,
					shortName,
					number,
					name, // Concatenate building name and room number for the name
					address,
					geolocation.lat,
					geolocation.lon,
					capacity,
					type,
					furniture,
					link
				);

				// Add the new Room instance to the combinedInfo array
				combinedInfo.push(room);
			}
		}

		return combinedInfo;
	}


	public extractBuildingNames(buildingTable: any): string[] {
		const buildingNames: string[] = [];
		for (const childNode of buildingTable.childNodes) {
			if (childNode.nodeName === "tbody") {
				for (const trNode of childNode.childNodes) {
					if (trNode.nodeName === "tr") {
						for (const tdNode of trNode.childNodes) {
							if (tdNode.nodeName === "td" &&
								this.roomsDatasetHelper.hasClass(tdNode, "views-field-field-building-code")) {
								const buildingName = this.roomsDatasetHelper.getNodeText(tdNode);
								if (buildingName) {
									buildingNames.push(buildingName);
								}
							}
						}
					}
				}
			}
		}
		return buildingNames;
	}
}
