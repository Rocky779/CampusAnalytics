import {InsightError} from "./IInsightFacade";
import {parse} from "parse5";
import JSZip from "jszip";
const http = require("http");
import {GeoResponse} from "./response";
export class GeolocationFetcher {
	public async fetchGeolocation(address: string): Promise<GeoResponse> {
		return new Promise((resolve, reject) => {
			let addressEncoded = encodeURIComponent(address);
			let apiURL = `http://cs310.students.cs.ubc.ca:11316/api/v1/project_team067/${addressEncoded}`;

			http.get(apiURL, (res: any) => {
				res.setEncoding("utf8");
				let rawData = "";

				// Concatenate received data chunks
				res.on("data", (chunk: any) => {
					rawData += chunk;
				});

				// Once the response ends
				res.on("end", () => {
					try {
						const parsedData = JSON.parse(rawData);
						console.log(parsedData);
						// if (parsedData.lat !== undefined && parsedData.lon !== undefined) {
						// 	// Resolve with latitude and longitude
						// 	resolve({latitude: parsedData.lat, longitude: parsedData.lon});
						// } else if (parsedData.error) {
						// 	// Reject with error message if an error occurred
						// 	reject(new InsightError(parsedData.error));
						// } else {
						// 	// Reject with invalid response format error
						// 	reject(new InsightError("Invalid response format"));
						// }
						return Promise.resolve(parsedData);
					} catch (error) {
						// Reject with JSON parsing error
						reject(new InsightError("wrong"));
					}
				});

				// Handle HTTP request errors
				res.on("error", (error: any) => {
					reject(new InsightError("wrong"));
				});
			});
		});
	}

	public fetchAddress(buildingName: string, tableNode: any): string {
		for (const childNode of tableNode.childNodes) {
			// Check if the child node is a <tbody> element
			if (childNode.nodeName === "tbody") {
				// Iterate through each child node of the table body
				for (const tbodyChildNode of childNode.childNodes) {
					// Check if the child node is a <tr> element
					if (tbodyChildNode.nodeName === "tr") {
						// Check if the building name matches
						for (const tdNode of tbodyChildNode.childNodes) {
							if (tdNode.nodeName === "td" && this.getNodeText(tdNode) === buildingName) {
								// Iterate through <td> elements again to find the address
								for (const addressNode of tbodyChildNode.childNodes) {
									if (addressNode.nodeName === "td" &&
										this.hasClass(addressNode, "views-field-field-building-address")) {
										return this.getNodeText(addressNode);
									}
								}
							}
						}
					}
				}
			}
		}
		return ""; // If building name not found or address column not found
	}

	public getNodeText(node: any): string {
		if (node.childNodes && node.childNodes.length > 0) {
			let text = "";
			for (const childNode of node.childNodes) {
				if (childNode.nodeName === "#text") {
					text += childNode.value.trim();
				}
			}
			return text;
		}
		return "";
	}

	public hasClass(element: any, className: string): boolean {
		return element.attrs && element.attrs.some((attr: any) =>
			attr.name === "class" && attr.value.includes(className));
	}

	public containsAllClassesInRow2(trNode: any, classNames: string[]): boolean {
		// Initialize a set to track which classes have been found
		const foundClasses = new Set<string>();

		// Iterate through each child node of the table row (presumably <td> elements)
		for (const childNode of trNode.childNodes) {
			// Check if the child node is a <td> element
			if (childNode.nodeName === "td") {
				// Iterate through each class name in the specified list
				for (const className of classNames) {
					// Check if the <td> element has the current class
					if (this.hasClass(childNode, className)) {
						// Add the class to the set of found classes
						foundClasses.add(className);
					}
				}
			}
		}

		// Check if all specified classes have been found at least once
		return classNames.every((className) => foundClasses.has(className));
	}

	public containsAllClassesInRow(tableNode: any, classNames: string[]): boolean {
		// Initialize a set to track which classes have been found
		const foundClasses = new Set<string>();

		// Iterate through each child node of the table node
		for (const childNode of tableNode.childNodes) {
			// Check if the child node is a <tbody> element
			if (childNode.nodeName === "tbody") {
				// Iterate through each child node of the table body
				for (const trNode of childNode.childNodes) {
					// Check if the child node is a <tr> element
					if (trNode.nodeName === "tr") {
						// Iterate through each child node of the table row
						for (const tdNode of trNode.childNodes) {
							// Check if the child node is a <td> element
							if (tdNode.nodeName === "td") {
								// Iterate through each class name in the specified list
								for (const className of classNames) {
									// Check if the <td> element has the current class
									if (this.hasClass(tdNode, className)) {
										// Add the class to the set of found classes
										foundClasses.add(className);
									}
								}
							}
						}
					}
				}
				break; // Found tbody, exit loop
			}
		}

		// Check if all specified classes have been found at least once
		return classNames.every((className) => foundClasses.has(className));
	}

	public containsBuildingInfoRow(tableNode: any, buildingName: string): boolean {
		// Required classes for the building information row
		const requiredClasses = [
			"views-field-field-building-code",
			"views-field-title",
			"views-field-field-building-address"
		];

		// Iterate through each child node of the table node
		for (const childNode of tableNode.childNodes) {
			// Check if the child node is a <tbody> element
			if (childNode.nodeName === "tbody") {
				// Iterate through each child node of the table body
				for (const tbodyChildNode of childNode.childNodes) {
					// Check if the child node is a <tr> element
					if (tbodyChildNode.nodeName === "tr") {
						// Iterate through each child node of the table row
						for (const tdNode of tbodyChildNode.childNodes) {
							// Check if the child node is a <td> element and contains the building name
							if (tdNode.nodeName === "td" &&  this.getNodeText(tdNode) === buildingName) {
								// Check if the row contains all required classes
								return this.containsAllClassesInRow2(tbodyChildNode, requiredClasses);
							}
						}
					}
				}
			}
		}
		return false; // No row with the building name and required classes found
	}

	public findBuildingTable(node: any): any {
		if (node.nodeName === "#document") {
			for (const childNode of node.childNodes) {
				if (childNode.nodeName === "html") {
					for (const htmlChildNode of childNode.childNodes) {
						if (htmlChildNode.nodeName === "body") {
							return this.findBuildingTable(htmlChildNode);
						}
					}
				}
			}
		} else if (node.nodeName === "body") {
			// console.log(node);
			for (const childNode of node.childNodes) {
				if (childNode.nodeName === "div" || childNode.nodeName === "section") {
					const tableNode = this.findTableInDiv(childNode);
					if (tableNode) {
						return tableNode;
					}
				} else if (childNode.nodeName === "table") {
					if (this.hasClass(childNode, "views-table") &&
						this.containsTDWithClass(childNode, "views-field-field-building-code")) {
						return childNode; // Return the table node
					}
				}
			}
			return null;
		}
	}

	public findTableInDiv(divNode: any): any {
		for (const childNode of divNode.childNodes) {
			if (childNode.nodeName === "table") {
				if (this.hasClass(childNode, "views-table") &&
					this.containsTDWithClass(childNode, "views-field-field-building-code")) {
					return childNode; // Return the table node
				}
			} else if (childNode.nodeName === "div" || childNode.nodeName === "section") {
				// Recursively search nested divs and sections
				const tableNode = this.findTableInDiv(childNode);
				if (tableNode) {
					return tableNode;
				}
			}
		}
		return null; // Return null if no table is found in this div or its children
	}

	public containsTDWithClass(tableNode: any, className: string): boolean {
		for (const childNode of tableNode.childNodes) {
			if (childNode.nodeName === "tbody") {
				for (const trNode of childNode.childNodes) {
					if (trNode.nodeName === "tr") {
						for (const tdNode of trNode.childNodes) {
							if (tdNode.nodeName === "td" && this.hasClass(tdNode, className)) {
								return true;
							}
						}
					}
				}
			}
		}
		return false;
	}


	public extractBuildingNames(buildingTable: any): string[] {
		const buildingNames: string[] = [];
		for (const childNode of buildingTable.childNodes) {
			if (childNode.nodeName === "tbody") {
				for (const trNode of childNode.childNodes) {
					if (trNode.nodeName === "tr") {
						for (const tdNode of trNode.childNodes) {
							if (tdNode.nodeName === "td" &&
								this.hasClass(tdNode, "views-field-field-building-code")) {
								const buildingName = this.getNodeText(tdNode);
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

	public async validateBuildingFile
	(decodedContent: JSZip, buildingName: string, buildingTable: any): Promise<boolean> {
		const buildingFile = decodedContent.
			file(`campus/discover/buildings-and-classrooms/${buildingName}.htm`);
		if (!buildingFile) {
			throw new InsightError(`Building file not found: ${buildingName}.htm`);
		}

		const buildingFileContent = await buildingFile.async("text");
		const buildingDocument = parse(buildingFileContent);
		const roomTable = this.findRoomTable(buildingDocument);
		if (!roomTable) {
			return Promise.reject(new InsightError(`No valid room table found in building file: ${buildingName}.htm`));
		}
		const buildingInfoRowExists = this.containsBuildingInfoRow(buildingTable, buildingName);
		if (!buildingInfoRowExists){
			return Promise.reject(new InsightError(`No valid room table found in building file: ${buildingName}.htm`));
		}
		let buildingAddress = this.fetchAddress(buildingName,buildingTable);
		let geolocation = await this.fetchGeolocation(buildingAddress);
		if (geolocation.error !== undefined){
			return Promise.reject(new InsightError("No valid room table found in building file:"));
		}
		return Promise.resolve(true);
	}

	public findRoomTable(node: any): any {
		if (node.nodeName === "#document") {
			for (const childNode of node.childNodes) {
				if (childNode.nodeName === "html") {
					for (const htmlChildNode of childNode.childNodes) {
						if (htmlChildNode.nodeName === "body") {
							return this.findRoomTable(htmlChildNode);
						}
					}
				}
			}
		} else if (node.nodeName === "body") {
			for (const childNode of node.childNodes) {
				if (childNode.nodeName === "div" || childNode.nodeName === "section") {
					const tableNode = this.findTableInDiv2(childNode);
					if (tableNode) {
						return tableNode;
					}
				} else if (childNode.nodeName === "table") {
					if (this.hasClass(childNode, "views-table") &&
						this.containsTDWithClass(childNode, "views-field-field-room-type") &&
						this.containsAllClassesInRow(childNode,[
							"views-field-field-room-number",
							"views-field-field-room-capacity",
							"views-field-field-room-furniture",
							"views-field-field-room-type",
							"views-field-nothing"
						]) ) {
						return childNode; // Return the table node
					}
				}
			}
			return null;
		}
	}

	public findTableInDiv2(divNode: any): any {
		for (const childNode of divNode.childNodes) {
			if (childNode.nodeName === "table") {
				if (this.hasClass(childNode, "views-table") &&
					this.containsTDWithClass(childNode, "views-field-field-room-type") &&
					this.containsAllClassesInRow(childNode,[
						"views-field-field-room-number",
						"views-field-field-room-capacity",
						"views-field-field-room-furniture",
						"views-field-field-room-type",
						"views-field-nothing"
					]) ) {
					return childNode; // Return the table node
				}
			} else if (childNode.nodeName === "div" || childNode.nodeName === "section") {
				// Recursively search nested divs and sections
				const tableNode = this.findTableInDiv2(childNode);
				if (tableNode) {
					return tableNode;
				}
			}
		}
		return null; // Return null if no table is found in this div or its children
	}
}
