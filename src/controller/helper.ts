import * as fs from "fs";
import {InsightError} from "./IInsightFacade"; // Import the 'fs' module for file operations
// QueryHelper.ts

export class QueryHelper {
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
		// Check if WHERE is an object
		if (!(where && typeof where === "object")) {
			return false;
		}
		const validOperators = ["LT", "GT", "EQ", "IS", "AND", "OR", "NOT"];
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
		// Check if the suffix is one of the specified values
		const validSuffixes = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
		return validSuffixes.includes(suffix);
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
		if (!options.COLUMNS || !Array.isArray(options.COLUMNS) ||
			options.COLUMNS.length === 0 || Object.keys(options).length > 2) {
			return false;
		}

		// Check if each column is a valid string
		for (const column of options.COLUMNS) {
			if (typeof column !== "string" || !this.isValidColumn(column, allIDs)) {
				return false;
			}
		}

		// Check if ORDER property exists and is a valid string
		if (options.ORDER) {
			if (typeof options.ORDER !== "string" || !this.isValidColumn(options.ORDER, allIDs)) {
				return false;
			}
		}

		return true;
	}

	public isValidColumn(column: string, allIDs: Set<string>): boolean {
		// Check if column follows the specified format
		const columnParts = column.split("_");
		if (columnParts.length !== 2) {
			return false;
		}

		const [prefix, suffix] = columnParts;

		// Check if the prefix (id) exists in the allIDs set
		if (!allIDs.has(prefix)) {
			return false;
		}

		// Check if the suffix is a valid field
		const validSuffixes = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];
		if (!validSuffixes.includes(suffix)) {
			return false;
		}
		return true;
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
					matchingItems.push(item);
				}
			}

			return matchingItems;
		} catch (error) {
			throw new InsightError("Invalid operator");
		}
	}

	public preprocessCondition(item: any, condition: string): string {
		// Define an array of field names to be replaced
		const fieldNames = ["avg", "pass", "fail", "audit", "year", "dept", "id", "instructor", "title", "uuid"];

		// Replace each field name with "item.fieldName"
		for (const fieldName of fieldNames) {
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
			return result;
		} catch (error) {
			console.error("Error evaluating condition:", error);
			return false; // Return false if there's an error evaluating the condition
		}
	}

	public traverseOptions(items: any[], queryOptions: any): any[] {
		if (!queryOptions.COLUMNS) {
			throw new Error("COLUMNS property is required in OPTIONS.");
		}

		const requestedFields: string[] = queryOptions.COLUMNS;

		// Filter out items to include only the requested fields
		const filteredItems = items.map((item: any) => {
			const filteredItem: any = {};
			requestedFields.forEach((field: string) => {
				const actualField = field.split("_")[1]; // Extract the actual field name
				if (item[actualField]) {
					filteredItem[field] = item[actualField];
				}
			});
			return filteredItem;
		});
		if (queryOptions.ORDER) {
			const orderField: string = queryOptions.ORDER;
			filteredItems.sort((a: any, b: any) => {
				if (a[orderField] < b[orderField]) {
					return -1;
				} else if (a[orderField] > b[orderField]) {
					return 1;
				} else {
					return 0;
				}
			});
		}

		return filteredItems;
	}
}
