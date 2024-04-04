### InsightUBC: Managing Course Section and Room Data

InsightUBC provides a powerful suite of features for managing datasets containing information about course sections and rooms at the University of British Columbia (UBC). Let's delve into the specifics of how InsightUBC handles both sections and rooms data:

---

**Managing Course Section Data**

InsightUBC's "Managing Course Section Data" functionality is designed to handle datasets comprising details about course sections at UBC. This entails parsing JSON data to extract crucial information such as id, title, department, instructor, pass, fail etc.

- **Dataset Format:** Course section datasets are structured JSON files, meticulously organized to conform to specific schema requirements established by the application.

- **Adding Datasets:** Users can seamlessly incorporate datasets into InsightUBC using the addDataset method. 

- **Data Processing:** During the addition of a dataset, the adding dataset method undertakes the task of processing the JSON data. This process involves parsing the dataset, meticulously validating its structure, and transforming it into a format suitable for seamless querying and analysis.

- **Listing Datasets:** The listDataset method allows users to retrieve a comprehensive list of available datasets. This functionality aids users in verifying which datasets are currently loaded into the system and ready for querying.

- **Removing Datasets:** Should the need arise, users have the ability to remove datasets from InsightUBC using the removeDataset method. This capability facilitates efficient management of stored datasets, freeing up system resources when datasets are no longer required.

- **Querying Data:** InsightUBC empowers users to perform a diverse range of queries to extract valuable insights from the dataset. Whether filtering, aggregating, or manipulating data, users have the tools needed to answer specific questions and conduct in-depth analysis.

---

**Managing Room Data**

InsightUBC's "Managing Room Data" functionality extends its capabilities to encompass datasets containing information about rooms across UBC's campus. This involves parsing HTML files to extract pertinent details about rooms and buildings, providing users with a comprehensive understanding of campus facilities.

- **Dataset Format:** Room datasets are comprised of HTML files containing a wealth of information about various rooms and buildings across UBC's campus. These HTML files are structured within tables, requiring careful parsing to extract relevant data.

- **Adding Datasets:** Users leverage the addDataset method to seamlessly integrate room datasets into InsightUBC. Unlike course section datasets, room datasets consist of HTML files, necessitating specialized handling for effective processing.

- **HTML Parsing:** The addDataset for rooms  meticulously parses the HTML files comprising room datasets, extracting essential data from tables and meticulously validating room information. This parsing process ensures the accuracy and integrity of the extracted data, laying the foundation for meaningful analysis.

- **Geolocation:** To facilitate accurate mapping of room locations, InsightUBC utilizes an external web service to fetch the latitude and longitude of buildings. This geolocation functionality enhances the spatial understanding of room distributions across UBC's campus.

- **Querying Data:** Users have the capability to query room datasets to uncover valuable insights such as room capacities, furniture types, building names, room numbers etc. Whether exploring room availability or assessing facility amenities, InsightUBC provides the tools necessary to conduct comprehensive analysis.

In the frontend, We have implemnted the campus explorer part where we create a user interface for exploring the rooms dataset. This includes:
1. **Viewing Buildings on a Map:**
	- Displaying building locations on a map.
	- Adding markers for each building in the dataset.
2. **Room Insights:**
	- Allowing users to select up to 5 rooms.
	- Providing detailed information about each selected room.
	- Estimating walking time between selected rooms, with shorter times for rooms in the same building.

### Video Link
https://drive.google.com/file/d/1xXlguXn4edxj59hFI61zB6H5qTiGTx6I/view?usp=sharing

### How to install, set up, and run your project
1. Clone the InsightUBC repository to your local machine.

2. Navigate to the project directory.

3. Ensure that all required datasets are available in the designated directory (./data). Might have to go to InsightFacade.spec.ts and run the following test keeping clearDisk commented out:
```typescript
it("rooms", async function () {
	let a04 = await getContentFromArchives("campus.zip");
	// Execute the addDataset method with an empty dataset id and invalid arguments
	const result = facade.addDataset("abc", a04, InsightDatasetKind.Rooms);
	// Validation: Assert that the result is rejected with InsightError
	return expect(result).to.eventually.have.members(["abc"]);
});
   ```
4. To Start the React frontend:
   ```bash
    cd frontend

    yarn start
   ```

5. Open another terminal window and start the server staying in project's root directory:
    ```bash

    yarn start
   ```
 


