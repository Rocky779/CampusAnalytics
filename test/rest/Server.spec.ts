import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";

import {expect} from "chai";
import request, {Response} from "supertest";
import fs = require("fs");
import {clearDisk, getContentFromArchives} from "../resources/TestUtil";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";
describe("Facade D3", function () {
	this.timeout(5000);

	let facade: InsightFacade;
	let server: Server;
	let SERVER_URL = "http://localhost:4321/";
	let validSections: Buffer;
	let invalidSections: Buffer;
	let validRooms: Buffer;
	let invalidRooms: Buffer;
	let deleteTestData: string;

	before(async function () {
		facade = new InsightFacade();
		server = new Server(4321);
		validSections = fs.readFileSync("test/resources/archives/dataset.zip");
		invalidSections = fs.readFileSync("test/resources/archives/courses.zip");
		validRooms = fs.readFileSync("test/resources/archives/campus.zip");
		invalidRooms = fs.readFileSync("test/resources/archives/campus2.zip");
		deleteTestData = await getContentFromArchives("campus.zip");
		// TODO: start server here once and handle errors properly
		try {
			// Start the server
			await server.start();
		} catch (error) {
			// Handle any errors starting the server
			console.error("Error starting server:", error);
			process.exit(1); // Exit the process with a non-zero status code
		}
	});

	after(async function () {
		// TODO: stop server here once!
		try {
			// Stop the server
			await server.stop();
		} catch (error) {
			// Handle any errors stopping the server
			console.error("Error stopping server:", error);
		}
	});

	beforeEach(async function () {
		// might want to add some process logging here to keep track of what is going on
		facade = new InsightFacade();
		// await clearDisk();
	});

	afterEach(async function () {
		// might want to add some process logging here to keep track of what is going on
		await clearDisk();
	});

	// Sample on how to format PUT requests
	it("PUT endpoint testing for a valid  dataset", function () {
		try {
			// console.log(validSections);
			return request(SERVER_URL)
				.put("dataset/test/sections")
				.send(validSections)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					expect(res.body.result.length).to.be.equal(1);
				})
				.catch(function (err) {
					// some logging here please!
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});
	it("PUT endpoint testing for an invalid courses dataset", function () {
		try {
			return request(SERVER_URL)
				.put("dataset/test/sections")
				.send(invalidSections)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});
	it("PUT endpoint test for a valid rooms dataset", function () {
		try {
			return request(SERVER_URL)
				.put("dataset/test2/rooms")
				.send(validRooms)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(200);
					expect(res.body.result.length).to.be.equal(1);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});
	it("PUT endpoint test for a invalid rooms dataset", function () {
		try {
			return request(SERVER_URL)
				.put("dataset/test/rooms")
				.send(invalidRooms)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res: Response) {
					// some logging here please!
					expect(res.status).to.be.equal(400);
				})
				.catch(function (err) {
					// some logging here please!
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("DELETE endpoint testing where id doesnt exist", async () => {
		try {
			return request(SERVER_URL)
				.delete("dataset/something")
				.then((res: Response) => {
					expect(res.status).to.be.equal(404);
				})
				.catch((err) => {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});

	it("DELETE testing for dataset where id has underscore and is invalid", async () => {
		try {
			return request(SERVER_URL)
				.delete("dataset/something_")
				.then((res: Response) => {
					expect(res.status).to.be.equal(400);
				})
				.catch((err) => {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});
	it("DELETE successful test", async () => {
		let id = "rooms";
		try {
			await facade.addDataset(
				id,
				deleteTestData,
				InsightDatasetKind.Rooms
			);
			return request(SERVER_URL)
				.delete("dataset/rooms")
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.be.equal(id);
				})
				.catch((err) => {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			expect.fail();
		}
	});
	it("List valid test", async () => {
		let id = "roomsabc";
		try {
			await facade.addDataset(
				id,
				deleteTestData,
				InsightDatasetKind.Rooms
			);
			console.log("data added");
			return request(SERVER_URL)
				.get("datasets/")
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					// expect(res.body.result).to.be.equal([id]);
				})
				.catch((err) => {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
			expect.fail();
		}
	});
	it("Query valid test", async () => {
		let id = "rooms";
		try {
			await facade.addDataset(
				id,
				deleteTestData,
				InsightDatasetKind.Rooms
			);
			return request(SERVER_URL)
				.post("query")
				.send({
					WHERE: {
						GT: {
							rooms_seats: 50
						}
					},
					OPTIONS: {
						COLUMNS: [
							"rooms_shortname",
							"rooms_number",
							"rooms_seats"
						]
					}
				})
				.then((res: Response) => {
					expect(res.status).to.be.equal(200);
					expect(res.body.result).to.have.deep.members([
						{
							rooms_shortname: "ALRD",
							rooms_number: "105",
							rooms_seats: 94
						},
						{
							rooms_shortname: "ANSO",
							rooms_number: "207",
							rooms_seats: 90
						},
						{
							rooms_shortname: "AERL",
							rooms_number: "120",
							rooms_seats: 144
						},
						{
							rooms_shortname: "BIOL",
							rooms_number: "2000",
							rooms_seats: 228
						},
						{
							rooms_shortname: "BIOL",
							rooms_number: "2200",
							rooms_seats: 76
						},
						{
							rooms_shortname: "BRKX",
							rooms_number: "2365",
							rooms_seats: 70
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "A101",
							rooms_seats: 275
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "A102",
							rooms_seats: 150
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "A103",
							rooms_seats: 131
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "A104",
							rooms_seats: 150
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "A201",
							rooms_seats: 181
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "A202",
							rooms_seats: 108
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "A203",
							rooms_seats: 108
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "B208",
							rooms_seats: 56
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "B213",
							rooms_seats: 78
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "B215",
							rooms_seats: 78
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "B313",
							rooms_seats: 78
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "B315",
							rooms_seats: 78
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "D217",
							rooms_seats: 65
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "D218",
							rooms_seats: 65
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "D219",
							rooms_seats: 65
						},
						{
							rooms_shortname: "BUCH",
							rooms_number: "D222",
							rooms_seats: 65
						},
						{
							rooms_shortname: "CIRS",
							rooms_number: "1250",
							rooms_seats: 426
						},
						{
							rooms_shortname: "CHBE",
							rooms_number: "101",
							rooms_seats: 200
						},
						{
							rooms_shortname: "CHBE",
							rooms_number: "102",
							rooms_seats: 94
						},
						{
							rooms_shortname: "CHBE",
							rooms_number: "103",
							rooms_seats: 60
						},
						{
							rooms_shortname: "CHEM",
							rooms_number: "B150",
							rooms_seats: 265
						},
						{
							rooms_shortname: "CHEM",
							rooms_number: "B250",
							rooms_seats: 240
						},
						{
							rooms_shortname: "CHEM",
							rooms_number: "C124",
							rooms_seats: 90
						},
						{
							rooms_shortname: "CHEM",
							rooms_number: "C126",
							rooms_seats: 90
						},
						{
							rooms_shortname: "CHEM",
							rooms_number: "D200",
							rooms_seats: 114
						},
						{
							rooms_shortname: "CHEM",
							rooms_number: "D300",
							rooms_seats: 114
						},
						{
							rooms_shortname: "CEME",
							rooms_number: "1202",
							rooms_seats: 100
						},
						{
							rooms_shortname: "CEME",
							rooms_number: "1204",
							rooms_seats: 62
						},
						{
							rooms_shortname: "ESB",
							rooms_number: "1012",
							rooms_seats: 150
						},
						{
							rooms_shortname: "ESB",
							rooms_number: "1013",
							rooms_seats: 350
						},
						{
							rooms_shortname: "ESB",
							rooms_number: "2012",
							rooms_seats: 80
						},
						{
							rooms_shortname: "FNH",
							rooms_number: "40",
							rooms_seats: 54
						},
						{
							rooms_shortname: "FNH",
							rooms_number: "60",
							rooms_seats: 99
						},
						{
							rooms_shortname: "FSC",
							rooms_number: "1001",
							rooms_seats: 65
						},
						{
							rooms_shortname: "FSC",
							rooms_number: "1003",
							rooms_seats: 65
						},
						{
							rooms_shortname: "FSC",
							rooms_number: "1005",
							rooms_seats: 250
						},
						{
							rooms_shortname: "FSC",
							rooms_number: "1221",
							rooms_seats: 99
						},
						{
							rooms_shortname: "FORW",
							rooms_number: "303",
							rooms_seats: 63
						},
						{
							rooms_shortname: "LASR",
							rooms_number: "102",
							rooms_seats: 80
						},
						{
							rooms_shortname: "LASR",
							rooms_number: "104",
							rooms_seats: 94
						},
						{
							rooms_shortname: "LASR",
							rooms_number: "105",
							rooms_seats: 60
						},
						{
							rooms_shortname: "LASR",
							rooms_number: "107",
							rooms_seats: 51
						},
						{
							rooms_shortname: "FRDM",
							rooms_number: "153",
							rooms_seats: 160
						},
						{
							rooms_shortname: "GEOG",
							rooms_number: "100",
							rooms_seats: 225
						},
						{
							rooms_shortname: "GEOG",
							rooms_number: "101",
							rooms_seats: 60
						},
						{
							rooms_shortname: "GEOG",
							rooms_number: "147",
							rooms_seats: 60
						},
						{
							rooms_shortname: "GEOG",
							rooms_number: "200",
							rooms_seats: 100
						},
						{
							rooms_shortname: "GEOG",
							rooms_number: "212",
							rooms_seats: 72
						},
						{
							rooms_shortname: "HEBB",
							rooms_number: "10",
							rooms_seats: 54
						},
						{
							rooms_shortname: "HEBB",
							rooms_number: "100",
							rooms_seats: 375
						},
						{
							rooms_shortname: "HEBB",
							rooms_number: "12",
							rooms_seats: 54
						},
						{
							rooms_shortname: "HEBB",
							rooms_number: "13",
							rooms_seats: 54
						},
						{
							rooms_shortname: "HENN",
							rooms_number: "200",
							rooms_seats: 257
						},
						{
							rooms_shortname: "HENN",
							rooms_number: "201",
							rooms_seats: 155
						},
						{
							rooms_shortname: "HENN",
							rooms_number: "202",
							rooms_seats: 150
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "037",
							rooms_seats: 54
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "039",
							rooms_seats: 54
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "098",
							rooms_seats: 260
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "234",
							rooms_seats: 60
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "241",
							rooms_seats: 70
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "243",
							rooms_seats: 68
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "254",
							rooms_seats: 80
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "291",
							rooms_seats: 54
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "295",
							rooms_seats: 54
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "334",
							rooms_seats: 60
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "343",
							rooms_seats: 68
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "345",
							rooms_seats: 68
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "347",
							rooms_seats: 70
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "350",
							rooms_seats: 58
						},
						{
							rooms_shortname: "ANGU",
							rooms_number: "435",
							rooms_seats: 53
						},
						{
							rooms_shortname: "DMP",
							rooms_number: "110",
							rooms_seats: 120
						},
						{
							rooms_shortname: "DMP",
							rooms_number: "301",
							rooms_seats: 80
						},
						{
							rooms_shortname: "DMP",
							rooms_number: "310",
							rooms_seats: 160
						},
						{
							rooms_shortname: "IONA",
							rooms_number: "301",
							rooms_seats: 100
						},
						{
							rooms_shortname: "IBLC",
							rooms_number: "182",
							rooms_seats: 154
						},
						{
							rooms_shortname: "IBLC",
							rooms_number: "261",
							rooms_seats: 112
						},
						{
							rooms_shortname: "SOWK",
							rooms_number: "124",
							rooms_seats: 68
						},
						{
							rooms_shortname: "LSK",
							rooms_number: "200",
							rooms_seats: 205
						},
						{
							rooms_shortname: "LSK",
							rooms_number: "201",
							rooms_seats: 183
						},
						{
							rooms_shortname: "LSK",
							rooms_number: "460",
							rooms_seats: 75
						},
						{
							rooms_shortname: "LSC",
							rooms_number: "1001",
							rooms_seats: 350
						},
						{
							rooms_shortname: "LSC",
							rooms_number: "1002",
							rooms_seats: 350
						},
						{
							rooms_shortname: "LSC",
							rooms_number: "1003",
							rooms_seats: 125
						},
						{
							rooms_shortname: "MCLD",
							rooms_number: "202",
							rooms_seats: 123
						},
						{
							rooms_shortname: "MCLD",
							rooms_number: "214",
							rooms_seats: 60
						},
						{
							rooms_shortname: "MCLD",
							rooms_number: "228",
							rooms_seats: 136
						},
						{
							rooms_shortname: "MCLD",
							rooms_number: "242",
							rooms_seats: 60
						},
						{
							rooms_shortname: "MCLD",
							rooms_number: "254",
							rooms_seats: 84
						},
						{
							rooms_shortname: "MCML",
							rooms_number: "158",
							rooms_seats: 74
						},
						{
							rooms_shortname: "MCML",
							rooms_number: "160",
							rooms_seats: 72
						},
						{
							rooms_shortname: "MCML",
							rooms_number: "166",
							rooms_seats: 200
						},
						{
							rooms_shortname: "MATH",
							rooms_number: "100",
							rooms_seats: 224
						},
						{
							rooms_shortname: "MATH",
							rooms_number: "102",
							rooms_seats: 60
						},
						{
							rooms_shortname: "MATX",
							rooms_number: "1100",
							rooms_seats: 106
						},
						{
							rooms_shortname: "SCRF",
							rooms_number: "100",
							rooms_seats: 280
						},
						{
							rooms_shortname: "SCRF",
							rooms_number: "209",
							rooms_seats: 60
						},
						{
							rooms_shortname: "ORCH",
							rooms_number: "1001",
							rooms_seats: 72
						},
						{
							rooms_shortname: "ORCH",
							rooms_number: "3074",
							rooms_seats: 72
						},
						{
							rooms_shortname: "ORCH",
							rooms_number: "4074",
							rooms_seats: 72
						},
						{
							rooms_shortname: "PHRM",
							rooms_number: "1101",
							rooms_seats: 236
						},
						{
							rooms_shortname: "PHRM",
							rooms_number: "1201",
							rooms_seats: 167
						},
						{
							rooms_shortname: "PHRM",
							rooms_number: "3208",
							rooms_seats: 72
						},
						{
							rooms_shortname: "OSBO",
							rooms_number: "A",
							rooms_seats: 442
						},
						{
							rooms_shortname: "SPPH",
							rooms_number: "B151",
							rooms_seats: 66
						},
						{
							rooms_shortname: "SRC",
							rooms_number: "220A",
							rooms_seats: 299
						},
						{
							rooms_shortname: "SRC",
							rooms_number: "220B",
							rooms_seats: 299
						},
						{
							rooms_shortname: "SRC",
							rooms_number: "220C",
							rooms_seats: 299
						},
						{
							rooms_shortname: "UCLL",
							rooms_number: "103",
							rooms_seats: 55
						},
						{
							rooms_shortname: "WESB",
							rooms_number: "100",
							rooms_seats: 325
						},
						{
							rooms_shortname: "WESB",
							rooms_number: "201",
							rooms_seats: 102
						},
						{
							rooms_shortname: "SWNG",
							rooms_number: "121",
							rooms_seats: 187
						},
						{
							rooms_shortname: "SWNG",
							rooms_number: "122",
							rooms_seats: 188
						},
						{
							rooms_shortname: "SWNG",
							rooms_number: "221",
							rooms_seats: 190
						},
						{
							rooms_shortname: "SWNG",
							rooms_number: "222",
							rooms_seats: 190
						},
						{
							rooms_shortname: "WOOD",
							rooms_number: "1",
							rooms_seats: 120
						},
						{
							rooms_shortname: "WOOD",
							rooms_number: "2",
							rooms_seats: 503
						},
						{
							rooms_shortname: "WOOD",
							rooms_number: "3",
							rooms_seats: 88
						},
						{
							rooms_shortname: "WOOD",
							rooms_number: "4",
							rooms_seats: 120
						},
						{
							rooms_shortname: "WOOD",
							rooms_number: "5",
							rooms_seats: 120
						},
						{
							rooms_shortname: "WOOD",
							rooms_number: "6",
							rooms_seats: 181
						}
					]);
				})
				.catch((err) => {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
			expect.fail();
		}
	});
	it("Query invalid test", async () => {
		let id = "rooms";
		try {
			await facade.addDataset(
				id,
				deleteTestData,
				InsightDatasetKind.Rooms
			);
			return request(SERVER_URL)
				.post("query/")
				.send({
					WHERE: {
						GT: {
							sections_seats: 50
						}
					},
					OPTIONS: {
						COLUMNS: [
							"rooms_shortname",
							"rooms_number",
							"rooms_seats"
						]
					}
				})
				.then((res: Response) => {
					console.log("hello");
					expect(res.status).to.be.equal(400);
				})
				.catch((err) => {
					console.log(err);
					expect.fail();
				});
		} catch (err) {
			// and some more logging here!
			console.log(err);
			expect.fail();

		}
	});
});
