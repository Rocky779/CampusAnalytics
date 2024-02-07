import {clearDisk, getContentFromArchives, readFileQueries} from "../resources/TestUtil";
import InsightFacade from "../../src/controller/InsightFacade";
import {
	InsightDatasetKind,
	InsightError,
	NotFoundError,
	ResultTooLargeError,
} from "../../src/controller/IInsightFacade";
import chaiAsPromised from "chai-as-promised";
import * as chai from "chai";
import {assert} from "chai";

export interface ITestQuery {
	title: string; //	title of the test case

	input: unknown; //	the query under test

	errorExpected: boolean; //	if the query is expected to throw an error

	expected: any; //	the expected result
}
chai.use(chaiAsPromised);
const expect = chai.expect;

describe("InsightFacade", function () {
	describe("addDataset", function () {
		let sections: string;
		let facade: InsightFacade;

		// Setup: Execute before all tests in this suite
		before(async function () {
			sections = await getContentFromArchives("dataset.zip");
		});

		// Setup: Execute before each test in this suite
		beforeEach(function () {
			facade = new InsightFacade();
		});

		//	Execution: Test case - it should reject with an empty dataset id
		it("should reject with an empty dataset id", function () {
			// Execute the addDataset method with an empty dataset id and invalid arguments
			const result = facade.addDataset("", sections, InsightDatasetKind.Sections);
			// Validation: Assert that the result is rejected with InsightError
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject with an rooms used for kind as its not valid right now", function () {
			// Execute the addDataset method with an empty dataset id and invalid arguments
			const result = facade.addDataset("ABC", sections, InsightDatasetKind.Rooms);
			// Validation: Assert that the result is rejected with InsightError
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject with an rooms used for kind as its not valid right now-2", function () {
			// Execute the addDataset method with an empty dataset id and invalid arguments
			const result = facade.addDataset("", "", InsightDatasetKind.Rooms);
			// Validation: Assert that the result is rejected with InsightError
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject with a bad value passed as kind", function () {
			// Execute the addDataset method with an empty dataset id and invalid arguments
			const invalidKind = "wrong";
			const result = facade.addDataset("ABC", sections, invalidKind as InsightDatasetKind);
			// Validation: Assert that the result is rejected with InsightError
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should reject a null dataset", function () {
			// Execute the addDataset method with an empty dataset id and invalid arguments
			const result = facade.addDataset("ubc", "", InsightDatasetKind.Sections);
			// Validation: Assert that the result is rejected with InsightError
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject a null dataset and null id", function () {
			// Execute the addDataset method with an empty dataset id and invalid arguments
			const result = facade.addDataset("", "", InsightDatasetKind.Sections);
			// Validation: Assert that the result is rejected with InsightError
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should successfully add a dataset (first)", function () {
			const result = facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.have.members(["ubc"]);
		});

		it("should reject a dataset without valid sections", async function () {
			let a3 = await getContentFromArchives("courses.zip");
			// Execute the addDataset method with an empty dataset id and invalid arguments
			const result = facade.addDataset("abc", a3, InsightDatasetKind.Sections);
			// Validation: Assert that the result is rejected with InsightError
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject a dataset without valid structure", async function () {
			let a4 = await getContentFromArchives("wrong.zip");
			// Execute the addDataset method with an empty dataset id and invalid arguments
			const result = facade.addDataset("abc", a4, InsightDatasetKind.Sections);
			// Validation: Assert that the result is rejected with InsightError
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject a dataset without valid structure", async function () {
			let a5 = await getContentFromArchives("wanga.zip");
			// Execute the addDataset method with an empty dataset id and invalid arguments
			const result = facade.addDataset("abc", a5, InsightDatasetKind.Sections);
			// Validation: Assert that the result is rejected with InsightError
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject with an invalid dataset empty zip nothing inside", async function () {
			let a1 = await getContentFromArchives("file.zip");
			const result = facade.addDataset("file", a1, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		it("should reject with an invalid folder name", async function () {
			let a2 = await getContentFromArchives("ezyzip1.zip");
			const result = facade.addDataset("file", a2, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// Execution: Test case - it should reject with an invalid dataset id (contains underscore)
		it("should reject with an invalid dataset id (contains underscore)", function () {
			const result = facade.addDataset("invalid_id_with_underscore", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// Execution: Test case - it should reject with a dataset id consisting of only whitespace characters
		it("should reject with a dataset id consisting of only whitespace characters", function () {
			const result = facade.addDataset("   ", sections, InsightDatasetKind.Sections);
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// Execution: Test case - it should reject when adding a dataset with the same id as an existing dataset
		it("should reject when adding a dataset with the same id as an existing dataset", async () => {
			// Add a dataset initially
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			try {
				await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			} catch (error: any) {
				expect(error).to.be.an.instanceOf(InsightError);
			}
		});

		// Cleanup: Execute after each test in this suite
		afterEach(async function () {
			// Clear the disk to ensure a fresh state for each test
			await clearDisk();
		});
	});
	describe("removeDataset", function () {
		let sections: string;
		let facade: InsightFacade;

		// Setup: Execute before all tests in this suite
		before(async function () {
			sections = await getContentFromArchives("dataset.zip");
		});

		// Setup: Execute before each test in this suite
		beforeEach(function () {
			facade = new InsightFacade();
		});

		// Execution: Test case - it should fulfill with the id of the removed dataset
		it("should fulfill with the id of the removed dataset", async function () {
			// Add a dataset initially
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

			// Remove the dataset and validate that the promise fulfills with the correct id
			const result = await facade.removeDataset("ubc");
			return expect(result).to.equal("ubc");
		});

		// Execution: Test case - it should reject with NotFoundError if removing a non-existent dataset
		it("should reject with NotFoundError if removing a non-existent dataset", function () {
			const result = facade.removeDataset("nonExistentID");
			return expect(result).to.eventually.be.rejectedWith(NotFoundError);
		});

		// Execution: Test case - it should reject with InsightError for an invalid dataset id (contains underscore)
		it("should reject with InsightError for an invalid dataset id (contains underscore)", function () {
			const result = facade.removeDataset("invalid_id_with_underscore");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		// Execution: Test case - it should reject with InsightError for a dataset id consisting of only whitespace characters
		it("should reject with InsightError for a dataset id consisting of only whitespace characters", function () {
			const result = facade.removeDataset("   ");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});
		// Execution: Test case - it should reject with InsightError for a dataset id consisting of only whitespace characters
		it("should reject with InsightError for a dataset id consisting of empty string", function () {
			const result = facade.removeDataset("");
			return expect(result).to.eventually.be.rejectedWith(InsightError);
		});

		it("should remove a dataset successfully", async function () {
			// Add a dataset before removing it
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);

			// Execute the removeDataset method
			const result = await facade.removeDataset("ubc");

			// Validation: Assert that the result is the correct id
			expect(result).to.equal("ubc");

			// Validation: Ensure the dataset has been removed
			// const datasets = facade.listDatasets();
			// expect(datasets).to.be.an('Promise').that.is.empty;
		});

		// Cleanup: Execute after each test in this suite
		afterEach(async function () {
			await clearDisk();
		});
	});

	describe("listDatasets", function () {
		let sections: string;
		let facade: InsightFacade;

		// Setup: Execute before all tests in this suite
		before(async function () {
			sections = await getContentFromArchives("dataset.zip");
		});

		// Setup: Execute before each test in this suite
		beforeEach(function () {
			facade = new InsightFacade();
		});
		// Execution: Test case - it should fulfill with an empty array when no datasets are added
		it("should fulfill with an empty array when no datasets are added", async function () {
			const result = await facade.listDatasets();
			return expect(result).to.be.an("array").that.is.empty;
		});

		// Execution: Test case - it should fulfill with an array of one dataset after adding a dataset
		it("should fulfill with an array of one dataset after adding a dataset", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			const result = await facade.listDatasets();
			expect(result).to.have.lengthOf(1);
			expect(result[0]).to.deep.include({id: "ubc", kind: InsightDatasetKind.Sections, numRows: 307});
		});

		// Execution: Test case - it should fulfill with multiple datasets after adding multiple datasets
		it("should fulfill with multiple datasets after adding multiple datasets", async function () {
			await facade.addDataset("ubc", sections, InsightDatasetKind.Sections);
			await facade.addDataset("sfu", sections, InsightDatasetKind.Sections);

			const result = await facade.listDatasets();
			expect(result).to.have.lengthOf(2);

			// Assert details for the first dataset
			expect(result).to.deep.include({id: "sfu", kind: InsightDatasetKind.Sections, numRows: 307});

			// Assert details for the second dataset
			expect(result).to.deep.include({id: "ubc", kind: InsightDatasetKind.Sections, numRows: 307});
		});

		afterEach(async function () {
			await clearDisk();
		});
	});

	describe("performQuery", function () {
		let sections: string;
		let facade: InsightFacade;

		before(async function () {
			facade = new InsightFacade();
			sections = await getContentFromArchives("pair.zip");
			await facade.addDataset("sections", sections, InsightDatasetKind.Sections);
		});

		describe("valid queries", function () {
			let validQueries: ITestQuery[];
			validQueries = [];
			try {
				validQueries = readFileQueries("valid");
			} catch (e: unknown) {
				expect.fail(`Failed to read one or more test queries. ${e}`);
			}
			validQueries.forEach(function (test: any) {
				it(`${test.title}`, async function () {
					try {
						const result = await facade.performQuery(test.input);
						assert.deepStrictEqual(result, test.expected);
					} catch (err) {
						assert.fail(`Unexpected error: ${err}`);
					}
				});
			});
		});

		describe("invalid queries", function () {
			let invalidQueries: ITestQuery[];

			try {
				invalidQueries = readFileQueries("invalid");
			} catch (e: unknown) {
				console.error(`Failed to read one or more invalid test queries. ${e}`);
				return;
			}
			invalidQueries.forEach(function (test: any) {
				it(`${test.title}`, async function () {
					try {
						const result = await facade.performQuery(test.input);

						// If the query is expected to fail, fail the test
						assert.fail("Expected query to fail, but it succeeded.");
					} catch (err) {
						// Check if the error is of the expected type
						if (test.expected === "InsightError") {
							assert.instanceOf(err, InsightError);
						} else if (test.expected === "ResultTooLargeError") {
							assert.instanceOf(err, ResultTooLargeError);
						}
					}
				});
			});
		});
	});
});
