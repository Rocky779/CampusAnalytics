import express, {Application, Request, Response, request} from "express";
import * as http from "http";
import cors from "cors";
import InsightFacade from "../controller/InsightFacade";
import {InsightDatasetKind, NotFoundError} from "../controller/IInsightFacade";

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
		this.express.use(express.static("./campus-explorer/src"));
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
			let facade = new InsightFacade();
			console.log(req.body);
			let id: string = req.params.id;

			// TODO figure out how to add sections in this context
			let content = req.body.toString("base64");
			let kind;
			if (req.params.kind === "sections") {
				kind = InsightDatasetKind.Sections;
				console.log(`Adding dataset with id: ${id} and kind: ${kind}`);
				let answer = await facade.addDataset(id, content, kind);
				res.status(200).json({result: answer});
			} else if (req.params.kind === "rooms") {
				kind = InsightDatasetKind.Rooms;
				console.log(`Adding dataset with id: ${id} and kind: ${kind}`);
				let answer = await facade.addDataset(id, content, kind);
				res.status(200).json({result: answer});
			} else {
				res.status(400).json({error: "Invalid Kind"});
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.log(error);
				res.status(400).json({error: error.message});
			} else{
				res.status(400).json({error: "Error"});
			}
		}
	}

	private async removeDataset(req: Request, res: Response) {
		try {
			// Placeholder logic for removing a dataset
			let facade = new InsightFacade();
			let id = req.params.id;
			await facade.removeDataset(id);
			res.status(200).json({result: id});
		} catch (error: unknown) {
			if (error instanceof NotFoundError) {
				res.status(404).json({error: error.message});
			} else {
				res.status(400).json({error: "Insight Error occurred"});
			}

		}
	}

	private async performQuery(req: Request, res: Response) {
		try {
			// Placeholder logic for performing a query
			let facade = new InsightFacade();
			const query = await facade.performQuery(req.body);
			res.status(200).json({result: query});
		} catch (error: unknown) {
			if (error instanceof Error) {
				res.status(400).json({error: error.message});
			} else{
				res.status(400).json({error: "Error"});
			}

		}
	}


	private async listDatasets(req: Request, res: Response) {
		try {
			let facade = new InsightFacade();
			let abc = await facade.listDatasets();
			res.status(200).json({result: abc});
		} catch (e: any){
			res.status(200).json({result: []});
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
