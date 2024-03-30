import {InsightError, ResultTooLargeError, InsightResult} from "./IInsightFacade";

class QueryProcessor {
	private data: any[]; // Assuming data is loaded and structured appropriately

	constructor(data: any[]) {
		this.data = data;
	}

	public async performQuery(query: any): Promise<InsightResult[]> {
		try {
			const filteredResults = this.filterResults(query.WHERE);
			const projectedResults = this.projectResults(filteredResults, query.OPTIONS.COLUMNS);
			const orderedResults = query.OPTIONS.ORDER
				? this.sortResults(projectedResults, query.OPTIONS.ORDER)
				: projectedResults;

			if (orderedResults.length > 5000) {
				throw new ResultTooLargeError("Result set exceeds 5000 items");
			}

			return orderedResults;
		} catch (error) {
			throw new InsightError("Query processing failed");
		}
	}

	private filterResults(whereClause: any): any[] {
		// Simplified filtering based on a single condition. In practice, this should handle all logical and comparison operators.
		if (Object.keys(whereClause).length === 0) {
			return this.data; // No filtering needed if WHERE is empty
		}

		// Example: Filter based on a simple EQ condition
		const conditionKey = Object.keys(whereClause)[0];
		const conditionValue = whereClause[conditionKey];

		return this.data.filter((item) => item[conditionKey] === conditionValue);
	}

	private projectResults(results: any[], columns: string[]): InsightResult[] {
		return results.map((item) => {
			const projectedItem: InsightResult = {};
			columns.forEach((column) => {
				// how to make this work
				// eslint-disable-next-line no-prototype-builtins
				if (item.hasOwnProperty(column)) {
					projectedItem[column] = item[column];
				}
			});
			return projectedItem;
		});
	}

	// TODO make sure the columns are in the correct order and the function when calling this function.
	private sortResults(results: InsightResult[], orderBy: string): InsightResult[] {
		return results.sort((a, b) => {
			// this checks the sort method actually work
			if (a[orderBy] < b[orderBy]) {
				return -1;
			}
			if (a[orderBy] > b[orderBy]) {
				return 1;
			}
			return 0;
		});
	}
}

// Example usage:
// Assuming `data` is your dataset loaded into memory
// const queryProcessor = new QueryProcessor(data);
// queryProcessor.performQuery(query).then(results => console.log(results)).catch(error => console.error(error));
