import {Decimal} from "decimal.js";

export class DataProcessor {
	public groupByMultipleParameters(data: any[], parameters: string[]): any {
		const groupedData: any = {};

		if (parameters.length === 1) {
			const parameter = parameters[0];
			for (const item of data) {
				const groupKey = item[parameter];
				if (!(groupKey in groupedData)) {
					groupedData[groupKey] = [];
				}
				groupedData[groupKey].push(item);
			}
		} else {
			const firstParameter = parameters[0];
			const remainingParameters = parameters.slice(1);
			for (const item of data) {
				const groupKey = item[firstParameter];
				if (!(groupKey in groupedData)) {
					groupedData[groupKey] = [];
				}
				groupedData[groupKey].push(item);
			}
			for (const groupKey in groupedData) {
				const group = groupedData[groupKey];
				groupedData[groupKey] = this.groupByMultipleParameters(group, remainingParameters);
			}
		}

		return groupedData;
	}

	public extractArrays(group: any): any[] {
		const arrays: any[] = [];

		for (const key in group) {
			const value = group[key];
			if (Array.isArray(value)) {
				arrays.push(value);
			} else if (typeof value === "object") {
				const subArrays = this.extractArrays(value);
				arrays.push(...subArrays);
			}
		}

		return arrays;
	}

	public applyOperations(groups: any[], applyOperations: any[]): any[] {
		const appliedGroups: any[] = [];

		for (const group of groups) {
			const appliedGroup = this.applyOperationsToGroup(group, applyOperations);
			appliedGroups.push(appliedGroup);
		}

		return appliedGroups;
	}

	public applyOperationsToGroup(group: any[], applyOperations: any[]): any {
		const appliedGroup: any = {};

		for (const operation of applyOperations) {
			for (const operationKey in operation) {
				const operationValue = operation[operationKey];
				const targetKey = operationKey;
				const operationType = Object.keys(operationValue)[0];
				const sourceKey = operationValue[operationType];

				switch (operationType) {
					case "MAX":
						appliedGroup[targetKey] = this.calculateMax(group, sourceKey);
						break;
					case "MIN":
						appliedGroup[targetKey] = this.calculateMin(group, sourceKey);
						break;
					case "AVG":
						appliedGroup[targetKey] = this.calculateAverage(group, sourceKey);
						break;
					case "SUM":
						appliedGroup[targetKey] = this.calculateSum(group, sourceKey);
						break;
					case "COUNT":
						appliedGroup[targetKey] = this.calculateCount(group,sourceKey);
						break;
					default:
						// Handle unsupported operation types
						break;
				}
			}
		}

		return appliedGroup;
	}


	public calculateCount(group: any[], key: string): number {
		const uniqueValues = new Set();
		for (const item of group) {
			// Check if the key exists and is not undefined
			if (key in item && item[key] !== undefined) {
				uniqueValues.add(item[key]);
			}
		}
		return uniqueValues.size;
	}

	public calculateMax(group: any[], key: string): number | null {
		let max = null;
		for (const item of group) {
			const value = parseFloat(item[key]);
			if (!isNaN(value)) {
				max = max === null ? value : Math.max(max, value);
			}
		}
		return max;
	}

	public calculateMin(group: any[], key: string): number | null {
		let min = null;
		for (const item of group) {
			const value = parseFloat(item[key]);
			if (!isNaN(value)) {
				min = min === null ? value : Math.min(min, value);
			}
		}
		return min;
	}

	public calculateAverage(group: any[], key: string): number | null {
		let total = new Decimal(0);
		let count = 0;
		for (const item of group) {
			const value = parseFloat(item[key]);
			if (!isNaN(value)) {
				total = total.add(new Decimal(value));
				count++;
			}
		}
		if (count === 0) {
			return null;
		}
		const avg = total.dividedBy(count);
		return parseFloat(avg.toFixed(2));
	}

	public calculateSum(group: any[], key: string): number | null {
		let sum = new Decimal(0);
		let validData = false;
		for (const item of group) {
			const value = parseFloat(item[key]);
			if (!isNaN(value)) {
				sum = sum.add(new Decimal(value));
				validData = true;
			}
		}
		return validData ? parseFloat(sum.toFixed(2)) : null;
	}


	// public addAdditionalColumnsToAggregatedResults(aggregatedGroups: any[], groups: any[]): any[] {
	// 	const resultsWithAdditionalColumns: any[] = [];
	//
	// 	for (let i = 0; i < aggregatedGroups.length; i++) {
	// 		const aggregatedGroup = aggregatedGroups[i];
	// 		const group = groups[i];
	//
	// 		const resultWithAdditionalColumns: any = {...aggregatedGroup};
	//
	// 		this.columns.forEach((column: string) => {
	// 			if (column.includes("_")) {
	// 				resultWithAdditionalColumns[column] = group[0][column];
	// 			}
	// 		});
	//
	// 		resultsWithAdditionalColumns.push(resultWithAdditionalColumns);
	// 	}
	//
	// 	return resultsWithAdditionalColumns;
	// }

	public sortItems(items: any[], order: any): any[] {
		if (!order) {
			return items;
		}
		if (typeof order === "string") {
			const orderField: string = order;
			items.sort((a: any, b: any) => {
				if (a[orderField] < b[orderField]) {
					return -1;
				} else if (a[orderField] > b[orderField]) {
					return 1;
				} else {
					return 0;
				}
			});
			return items;
		}

		const keys = order["keys"];
		const direction = order["dir"] === "DOWN" ? -1 : 1;

		return items.sort((a, b) => {
			for (const key of keys) {
				if (a[key] === undefined || b[key] === undefined) {
					throw new Error(`One or more items have undefined values for the sorting key '${key}'.`);
				}
				if (a[key] < b[key]) {
					return -1 * direction;
				}
				if (a[key] > b[key]) {
					return 1 * direction;
				}
			}
			return 0;
		});
	}
}


