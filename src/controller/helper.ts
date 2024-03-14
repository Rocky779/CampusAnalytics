import * as fs from "fs";
import {InsightError} from "./IInsightFacade"; // Import the 'fs' module for file operations
const VALID_SUFFIXES = ["avg", "pass", "fail", "audit", "year",
	"dept", "id", "instructor", "title", "uuid","lat" , "lon" ,"seats", "fullname" , "shortname" , "number" , "name" ,
	"address" , "type" , "furniture" , "href"];
const validOperators = ["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"];
export class QueryHelper {
	private columns: string[] = [];
	private columns2: string[] = [];
	public async checkIDExists(id: string): Promise<boolean> {
		const filePath = `data/${id}.json`;
		try {
			await fs.promises.access(filePath, fs.constants.F_OK);
			return true;
		} catch (error) {
			return false;
		}
	}

	public isValidWhereClause(where: any, allIDs: Set<string>): boolean {
		this.columns = [];
		if (!(where && typeof where === "object")) {
			return false;
		}
		// const validOperators = ["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"];
		const operator = Object.keys(where)[0];
		if (!validOperators.includes(operator)) {
			return false;
		}
		// Validate the WHERE clause based on the operator
		let leafKey, prefix, suffix;
		leafKey = Object.keys(where[operator])[0];
		if (operator === "LT" || operator === "GT" || operator === "EQ") {
			[prefix, suffix] = leafKey.split("_");
			if (!allIDs.has(prefix)) {
				if (allIDs.size === 0) {
					allIDs.add(prefix);
				} else {
					return false; // Error: Inconsistent prefixes
				}
			}
			if (!this.isValidSuffix(suffix)) {
				return false;
			}
			return this.isValidComparator(where[operator]);
		} else if (operator === "IS") {
			[prefix, suffix] = leafKey.split("_");
			if (!allIDs.has(prefix)) {
				if (allIDs.size === 0) {
					allIDs.add(prefix);
				} else {
					return false; // Error: Inconsistent prefixes
				}
			}
			if (!this.isValidSuffix(suffix)) {
				return false;
			}
			return this.isValidISFilter(where[operator]);
		} else if (operator === "AND" || operator === "OR") {
			const filters = where[operator];
			if (!Array.isArray(filters) || filters.length < 2) {
				return false;
			}
			return filters.every((filter: any) => this.isValidWhereClause(filter, allIDs));
		} else if (operator === "NOT") {
			const negationFilter = where[operator];
			return this.isValidWhereClause(negationFilter, allIDs);
		} else {
			return false;
		}
	}

	public isValidSuffix(suffix: string): boolean {
		// Convert suffix to lowercase for case-insensitive comparison
		const lowerCaseSuffix = suffix.toLowerCase();

		// Check if the suffix is in the set of valid suffixes
		if (!VALID_SUFFIXES.includes(lowerCaseSuffix)) {
			throw new InsightError(`Invalid suffix: ${suffix}`);
		}

		return true;
	}

	public isValidISFilter(filter: any): boolean {
		// Check if IS filter is an object with a single key-value pair
		if (!(filter && typeof filter === "object")) {
			return false;
		}

		const key = Object.keys(filter)[0];
		const value = filter[key];

		// Check if key and value are strings
		if (typeof key !== "string" || typeof value !== "string") {
			return false;
		}
		// Check if value contains an asterisk
		const asteriskIndex = value.indexOf("*");
		if (asteriskIndex !== -1) {
			// If asterisk is found, ensure it's at the start, end, or both
			if (asteriskIndex > 0 && asteriskIndex < value.length - 1) {
				// Asterisk is not at start or end
				return false;
			}
		}
		return true;
	}

	public isValidComparator(comparator: any): boolean {
		// Check if comparator is a number
		return typeof Object.values(comparator)[0] === "number";
	}

	public isValidOptions(options: any, allIDs: Set<string>): boolean {
		// Check if OPTIONS is an object
		if (!(options && typeof options === "object")) {
			return false;
		}

		// Check if COLUMNS property exists and is an array
		if (
			!options.COLUMNS ||
			!Array.isArray(options.COLUMNS) ||
			options.COLUMNS.length === 0 ||
			Object.keys(options).length > 2
		) {
			return false;
		}
		const validColumns = options.COLUMNS.filter((column: string) => column.includes("_"));
		const invalidColumns = options.COLUMNS.filter((column: string) => !column.includes("_"));
		this.columns.push(...invalidColumns);
		console.log(allIDs);
		// Check if each column is a valid string
		for (const column of validColumns) {
			if (typeof column !== "string" || !this.isValidColumn(column, allIDs)) {
				return false;
			} else{
				this.columns.push(column);
				// console.log(this.columns);
			}
		}

		// Check if ORDER property exists and is a valid string
		// if (options.ORDER) {
		// 	if (typeof options.ORDER !== "string" || !this.isValidColumn(options.ORDER, allIDs)) {
		// 		return false;
		// 	}
		// }

		return true;
	}

	public isValidColumn(column: string, allIDs: Set<string>): boolean {
		// Check if column follows the specified format
		// if(!column.includes("_")){
		// 	return true;
		// }
		const columnParts = column.split("_");
		if (columnParts.length !== 2) {
			return false;
		}

		const [prefix, suffix] = columnParts;

		// Check if the prefix (id) exists in the allIDs set
		if (allIDs.size === 0) {
			// Add the prefix to all IDs
			// Assuming `prefix` is a string
			// Here I'm assuming `prefix` is added to each ID as a prefix
			// You can adjust this according to your specific requirements
			allIDs.add(prefix);
		}
		if (!allIDs.has(prefix)) {
			return false;
		}

		// Check if the suffix is a valid field
		const validSuffixes = ["avg", "pass", "fail", "audit", "year",
			"dept", "id", "instructor", "title", "uuid","lat" , "lon" ,"seats", "fullname" ,
			"shortname" , "number" , "name" ,
			"address" , "type" , "furniture" , "href"];
		return validSuffixes.includes(suffix);

	}

	public traverseWhereClause(where: any, allIDs: Set<string>): string {
		const operator: string = Object.keys(where)[0];
		const operand: any = where[operator];
		let condition: string;

		if (operator === "AND") {
			// Process each operand recursively
			const subConditions: string[] = [];
			for (const conditionObj of operand) {
				const subCondition = this.traverseWhereClause(conditionObj, allIDs);
				subConditions.push(subCondition);
			}
			// Combine all conditions within the AND clause using &&
			condition = subConditions.join(" && ");
			// Wrap the combined condition within parentheses
			condition = `(${condition})`;
		} else if (operator === "OR") {
			// Process each operand recursively
			const subConditions: string[] = [];
			for (const conditionObj of operand) {
				const subCondition = this.traverseWhereClause(conditionObj, allIDs);
				subConditions.push(subCondition);
			}
			// Combine all conditions within the OR clause using ||
			condition = subConditions.join(" || ");
			// Wrap the combined condition within parentheses
			condition = `(${condition})`;
		} else if (operator === "NOT") {
			// Negate the condition following the NOT keyword
			const subCondition = this.traverseWhereClause(operand, allIDs);
			condition = `!(${subCondition})`;
		} else {
			// Handle leaf nodes and other operators like LT, GT, EQ, IS
			condition = this.buildConditionString(where, allIDs);
		}

		return condition;
	}

	public buildConditionString(filter: any, allIDs: Set<string>): string {
		const operator: string = Object.keys(filter)[0];
		const operand: any = filter[operator];

		// Extract the key and value from the operand
		const [id, suffix] = Object.keys(operand)[0].split("_");
		const value: string | number = operand[`${id}_${suffix}`];

		// Check if the ID prefix is valid
		if (!allIDs.has(id)) {
			throw new Error(`Invalid ID prefix ${id}`);
		}
		// CITATION OF THIS WILDCARD REGEX :https://stackoverflow.com/questions/52143451/javascript-filter-with-wildcard
		if (operator === "IS" && typeof value === "string" && value.includes("*")) {
			const a = value.replace(/\*/g, ".*"); // Replace * with .* in the value
			return `new RegExp('^${a}$').test(${suffix})`; // Construct regex test condition
		}

		// Build the condition string based on the operator
		switch (operator) {
			case "IS":
				return `${suffix} === "${value}"`;
			case "GT":
				return `${suffix} > ${value}`;
			case "LT":
				return `${suffix} < ${value}`;
			case "EQ":
				return `${suffix} === ${value}`;
			default:
				throw new InsightError(`Invalid operator ${operator}`);
		}
	}

	public async getMatchingItems(id: string, condition: string): Promise<any[]> {
		try {
			// Read the contents of the id.json file
			const data = await fs.promises.readFile(`data/${id}.json`, "utf-8");
			const jsonData = JSON.parse(data);

			const matchingItems: any[] = [];

			// Iterate through each object in the JSON data
			for (const item of jsonData) {
				// Evaluate the condition for each item
				if (this.evaluateCondition(item, condition)) {
					if (!Object.values(item).some((value) => value === undefined)) {
						matchingItems.push(item);
					}
				}
			}

			return matchingItems;
		} catch (error) {
			throw new InsightError("Invalid operator");
		}
	}

	public preprocessCondition(item: any, condition: string): string {
		for (const fieldName of VALID_SUFFIXES) {
			// CITATION: regex provided by chatGPT
			const regex = new RegExp(`\\b${fieldName}\\b`, "g");
			condition = condition.replace(regex, `item.${fieldName}`);
		}
		return condition;
	}

	public evaluateCondition(item: any, condition: string): boolean {
		try {
			// Preprocess the condition to replace field names with "item.fieldName"
			condition = this.preprocessCondition(item, condition);
			// Use Function constructor to create a function that evaluates the condition
			const evaluator = new Function("item", `return ${condition}`);

			// Call the dynamically created function with the item and get the result
			const result = evaluator(item);
			// Convert the result to a boolean value
			return !!result; // Use double negation to convert to boolean
		} catch (error) {
			// console.error("Error evaluating condition:", error);
			return false; // Return false if there's an error evaluating the condition
		}
	}

	public traverseOptions(items: any[], queryOptions: any, hasTransformations: boolean, allIDs: Set<string>): any[] {
		if (!queryOptions.COLUMNS) {
			throw new Error("COLUMNS property is required in OPTIONS.");
		}

		// Get the first ID from allIDs
		const idPrefix = Array.from(allIDs)[0];

		// If transformations exist, return items with ID suffix connected in front of each key
		if (hasTransformations) {
			const transformedItems = items.map((item: any) => {
				const transformedItem: any = {};
				for (const key in item) {
					transformedItem[`${idPrefix}_${key}`] = item[key];
				}
				return transformedItem;
			});
			return transformedItems;
		}

		// If no transformations, filter out items to include only the requested fields
		const requestedFields: string[] = queryOptions.COLUMNS.filter((column: string) => column.includes("_"));
		const filteredItems = items.map((item: any) => {
			const filteredItem: any = {};
			requestedFields.forEach((field: string) => {
				const actualField = field.split("_")[1]; // Extract the actual field name
				filteredItem[field] = item[actualField];
			});
			return filteredItem;
		});

		return filteredItems;
	}

	public isValidTransformations(transformation: any, allIDs: Set<string>): boolean {
		if (!transformation || typeof transformation !== "object" || !transformation.GROUP || !transformation.APPLY) {
			return false; // Transformation object or GROUP key not found
		}
		if (!Array.isArray(transformation.GROUP) || transformation.GROUP.length === 0) {
			return false; // GROUP must be a non-empty array
		}
		for (const groupItem of transformation.GROUP) {
			if (!this.columns.includes(groupItem)) {
				return false; // GROUP item not found in COLUMNS
			}
		}
		for (const applyItem of transformation.APPLY) {
			const applyKey = Object.keys(applyItem)[0]; // Get the key of the APPLY item
			if (!this.columns.includes(applyKey)) {
				return false; // APPLY key not found in COLUMNS
			}
			const applyValue = applyItem[applyKey];
			if (typeof applyValue !== "object" || Object.keys(applyValue).length !== 1) {
				return false; // APPLY value should be an object with exactly one key-value pair
			}
			const aggregationFunc = Object.keys(applyValue)[0]; // Get the aggregation function (MAX, MIN, AVG, COUNT, SUM)
			const fieldName = applyValue[aggregationFunc]; // Get the field name
			const [id, suffix] = fieldName.split("_"); // Split the field name into ID and suffix
			if (!(allIDs.has(id) && VALID_SUFFIXES.includes(suffix)) ||
				!["MAX", "MIN", "AVG", "COUNT", "SUM"].includes(aggregationFunc)) {
				return false; // ID or suffix is invalid or aggregation function is invalid
			}
		}
		return true; // All checks passed
	}

	public addAdditionalColumnsToAggregatedResults
	(aggregatedGroups: any[], groups: any[]): any[] {
		const resultsWithAdditionalColumns: any[] = [];

		for (let i = 0; i < aggregatedGroups.length; i++) {
			const aggregatedGroup = aggregatedGroups[i];
			const group = groups[i];

			const resultWithAdditionalColumns: any = {...aggregatedGroup}; // Copy the aggregated results


			// Add additional columns to the result
			this.columns.forEach((column) => {
				if (column.includes("_")) {
					resultWithAdditionalColumns[column] = group[0][column]; // Assuming the first item in the group has the same value for the additional column
				}
			});
			resultsWithAdditionalColumns.push(resultWithAdditionalColumns);
		}

		return resultsWithAdditionalColumns;
	}
}
