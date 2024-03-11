import {InsightError, InsightDatasetKind} from "./IInsightFacade";
import JSZip from "jszip";

export class ValidationUtils {
	public isInValidKind(kind: InsightDatasetKind): boolean {
		return kind !== InsightDatasetKind.Rooms;
	}

	public isInValidContent(content: string): boolean {
		return !content || content === "";
	}

	public isInvalidID(id: string): boolean {
		return !id || id.includes("_") || id.trim().length === 0;
	}

	public async validateCampusFolder(decodedContent: JSZip): Promise<void> {
		const campusFolder = decodedContent.folder("campus");
		if (!campusFolder) {
			return Promise.reject(new InsightError("campus folder not found."));
		}

		const discoverFolder = campusFolder.folder("discover");
		if (!discoverFolder) {
			return Promise.reject(new InsightError("discover folder not found."));
		}

		const buildingsFolder = discoverFolder.folder("buildings-and-classrooms");
		if (!buildingsFolder) {
			return Promise.reject(new InsightError("buildings-and-classrooms folder not found."));
		}

		const buildingsFolderFiles = buildingsFolder.file(/.+/);
		if (!buildingsFolderFiles.length) {
			return Promise.reject(new InsightError("buildings-and-classrooms folder is empty."));
		}
	}
}
