import express, {Application, Request, Response, request} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, NotFoundError} from "../controller/IInsightFacade";
import {getContentFromArchives} from "../../test/resources/TestUtil";

export default class Server {
	private readonly port: number;
	private express: Application;
	private server: http.Server | undefined;

	constructor(port: number) {
		console.info(`Server::<init>( ${port} )`);
		this.port = port;
		this.express = express();

		this.registerMiddleware();
		this.registerRoutes();

		// NOTE: you can serve static frontend files in from your express server
		// by uncommenting the line below. This makes files in ./frontend/public
		// accessible at http://localhost:<port>/
		// this.express.use(express.static("./frontend/public"))
	}

	/**
	 * Starts the server. Returns a promise that resolves if success. Promises are used
	 * here because starting the server takes some time and we want to know when it
	 * is done (and if it worked).
	 *
	 * @returns {Promise<void>}
	 */
	public start(): Promise<void> {
		return new Promise((resolve, reject) => {
			console.info("Server::start() - start");
			if (this.server !== undefined) {
				console.error("Server::start() - server already listening");
				reject();
			} else {
				this.server = this.express
					.listen(this.port, () => {
						console.info(`Server::start() - server listening on port: ${this.port}`);
						resolve();
					})
					.on("error", (err: Error) => {
						// catches errors in server start
						console.error(`Server::start() - server ERROR: ${err.message}`);
						reject(err);
					});
			}
		});
	}

	/**
	 * Stops the server. Again returns a promise so we know when the connections have
	 * actually been fully closed and the port has been released.
	 *
	 * @returns {Promise<void>}
	 */
	public stop(): Promise<void> {
		console.info("Server::stop()");
		return new Promise((resolve, reject) => {
			if (this.server === undefined) {
				console.error("Server::stop() - ERROR: server not started");
				reject();
			} else {
				this.server.close(() => {
					console.info("Server::stop() - server closed");
					resolve();
				});
			}
		});
	}

	// Registers middleware to parse request before passing them to request handlers
	private registerMiddleware() {
		// JSON parser must be place before raw parser because of wildcard matching done by raw parser below
		this.express.use(express.json());
		this.express.use(express.raw({type: "application/*", limit: "10mb"}));

		// enable cors in request headers to allow cross-origin HTTP requests
		this.express.use(cors());
	}

	// Registers all request handlers to routes
	private registerRoutes() {
		// This is an example endpoint this you can invoke by accessing this URL in your browser:
		// http://localhost:4321/echo/hello
		// this.express.get("/echo/:msg", Server.echo);
		this.express.get("/echo/:msg", Server.echo);

		// Dataset endpoints
		this.express.put("/dataset/:id/:kind", this.addDataset);
		this.express.delete("/dataset/:id", this.removeDataset);
		this.express.post("/query", this.performQuery);
		this.express.get("/datasets", this.listDatasets);
		// TODO: your other endpoints should go here
	}

	private async addDataset(req: Request, res: Response) {
		try {
			// Placeholder kind logic for adding a dataset
			let facade = new InsightFacade();
			console.log(req.body);
			let id: string = req.params.id;

			// TODO figure out how to add sections in this context
			let sections = "";
			// let content = Buffer.from(JSON.stringify(req.body)).toString("base64");
			// let sections = await getContentFromArchives("dataset.zip");
			console.log("Request Body:", req.body);
			let kind;
			if (req.params.kind === "sections") {
				kind = InsightDatasetKind.Sections;
			} else if (req.params.kind === "rooms") {
				kind = InsightDatasetKind.Rooms;
			} else {
				res.status(400).json({error: "Invalid Kind"});
			}
			if (kind !== undefined) {
				console.log(`Adding dataset with id: ${id} and kind: ${kind}`);
				await facade.addDataset(id, sections, kind);
				res.status(200).json({result: `Dataset ${id} added successfully`});
			}
		} catch (error: unknown) {
			// Check if error is an instance of Error and thus has a message property
			if (error instanceof Error) {
				res.status(400).json({error: error.message});
			} else {
				// If the error is not an instance of Error, handle it generically
				res.status(400).json({error: "An error occurred"});
			}
		}
	}

	private async removeDataset(req: Request, res: Response) {
		try {
			// Placeholder logic for removing a dataset
			let facade = new InsightFacade();
			let id = req.params.id;
			console.log(`Removing dataset with id: ${id}`);
			await facade.removeDataset(id);
			res.status(200).json({result: `Dataset ${id} removed successfully`});
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(400).json({error: error.message});
			} else if (error instanceof NotFoundError) {
				res.status(404).json({error: "Dataset not found"});
				res.status(400).json({error: "An error occurred"});
			}
		}
	}

	private async performQuery(req: Request, res: Response) {
		try {
			// Placeholder logic for performing a query
			let facade = new InsightFacade();
			const query = await facade.performQuery(req.body);
			console.log(`Performing query: ${JSON.stringify(query)}`);
			res.status(200).json({result: `Results for query ${JSON.stringify(query)}`});
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(400).json({error: error.message});
			} else {
				res.status(400).json({error: "An error occurred"});
			}
		}
	}

	private async listDatasets(res: Response) {
		try {
			// Placeholder logic for listing datasets
			let facade = new InsightFacade();
			let datasets = await facade.listDatasets();
			console.log("Listing all datasets");
			res.status(200).json({datasets: [datasets]}); // Example response
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(500).json({error: error.message});
			} else {
				res.status(500).json({error: "An error occurred"});
			}
		}
	}

	// The next two methods handle the echo service.
	// These are almost certainly not the best place to put these, but are here for your reference.
	// By updating the Server.echo function pointer above, these methods can be easily moved.
	private static echo(req: Request, res: Response) {
		try {
			console.log(`Server::echo(..) - params: ${JSON.stringify("daniel")}`);
			console.log(`Server::echo(..) - params: ${JSON.stringify(req.params)}`);
			const response = Server.performEcho(req.params.msg);
			res.status(200).json({result: response});
		} catch (err) {
			res.status(400).json({error: err});
		}
	}

	private static performEcho(msg: string): string {
		if (typeof msg !== "undefined" && msg !== null) {
			return `${msg}...${msg}`;
		} else {
			return "Message not provided";
		}
	}
}
