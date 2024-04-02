import React, {useCallback, useEffect, useMemo, useState} from "react";
import "./App.css";
import GoogleMapsComponent from "./components/GoogleMapsComponent";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import RoomSelector from "./components/RoomSelector";
import RoomDetails from "./components/RoomDetails";
import {Room} from "./components/types"; // Make sure this path is correct
import RoomDataList from "./components/RoomDataList";

function App() {
	const [filter, setFilter] = useState("");
	const [selectedRoomNames, setSelectedRoomNames] = useState<string[]>([]);
	const [selectedRoomDetails, setSelectedRoomDetails] = useState<Room[]>([]);

	const handleRoomSelect = useCallback((selectedNames: string[]) => {
		setSelectedRoomNames(selectedNames);
	}, []);

	// Sample rooms data, now with 'id' properties
	const rooms = useMemo(
		() => [
			{
				fullname: "Life Sciences Centre",
				shortname: "LSC",
				number: "1002",
				name: "LSC_1002",
				address: "2350 Health Sciences Mall",
				lat: 49.26236,
				lon: -123.24494,
				seats: 350,
				type: "Tiered Large Group",
				furniture: "Classroom-Fixed Tables/Movable Chairs",
				href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/LSC-1002",
			},
			{
				fullname: "Life Sciences Centre",
				shortname: "LSC",
				number: "1003",
				name: "LSC_1003",
				address: "2350 Health Sciences Mall",
				lat: 49.26236,
				lon: -123.24494,
				seats: 125,
				type: "Tiered Large Group",
				furniture: "Classroom-Fixed Tables/Movable Chairs",
				href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/LSC-1003",
			},
			{
				fullname: "Mathematics Annex",
				shortname: "MATX",
				number: "1100",
				name: "MATX_1100",
				address: "1986 Mathematics Road",
				lat: 49.266089,
				lon: -123.254816,
				seats: 106,
				type: "Tiered Large Group",
				furniture: "Classroom-Fixed Tablets",
				href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/MATX-1100",
			},
			{
				fullname: "MacLeod",
				shortname: "MCLD",
				number: "202",
				name: "MCLD_202",
				address: "2356 Main Mall",
				lat: 49.26176,
				lon: -123.24935,
				seats: 123,
				type: "Tiered Large Group",
				furniture: "Classroom-Fixed Tables/Fixed Chairs",
				href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/MCLD-202",
			},
			{
				fullname: "MacLeod",
				shortname: "MCLD",
				number: "214",
				name: "MCLD_214",
				address: "2356 Main Mall",
				lat: 49.26176,
				lon: -123.24935,
				seats: 60,
				type: "Open Design General Purpose",
				furniture: "Classroom-Movable Tables & Chairs",
				href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/MCLD-214",
			},
			{
				fullname: "MacLeod",
				shortname: "MCLD",
				number: "220",
				name: "MCLD_220",
				address: "2356 Main Mall",
				lat: 49.26176,
				lon: -123.24935,
				seats: 40,
				type: "Small Group",
				furniture: "Classroom-Movable Tables & Chairs",
				href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/MCLD-220",
			},
			{
				fullname: "MacLeod",
				shortname: "MCLD",
				number: "228",
				name: "MCLD_228",
				address: "2356 Main Mall",
				lat: 49.26176,
				lon: -123.24935,
				seats: 136,
				type: "Tiered Large Group",
				furniture: "Classroom-Fixed Tables/Fixed Chairs",
				href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/MCLD-228",
			},
			{
				fullname: "MacLeod",
				shortname: "MCLD",
				number: "242",
				name: "MCLD_242",
				address: "2356 Main Mall",
				lat: 49.26176,
				lon: -123.24935,
				seats: 60,
				type: "Open Design General Purpose",
				furniture: "Classroom-Movable Tables & Chairs",
				href: "http://students.ubc.ca/campus/discover/buildings-and-classrooms/room/MCLD-242",
			},
		],
		[]
	);

	useEffect(() => {
		const details = rooms.filter((room) => selectedRoomNames.includes(room.name));
		setSelectedRoomDetails(details);
	}, [selectedRoomNames, rooms]);

	return (
		<div className="App">
			<Header />
			<div className="Content">
				<div className="Sidebar">
					<Sidebar />
					<RoomSelector filter={filter} onFilterChange={setFilter} />
				</div>
				<div className="Map">
					<GoogleMapsComponent rooms={rooms} />
				</div>
				<div className="RoomDataListContainer">
					<RoomDataList
						rooms={rooms.filter((room) => room.fullname.toLowerCase().includes(filter.toLowerCase()))}
						onSelectRoom={handleRoomSelect}
					/>
				</div>
			</div>
		</div>
	);
}

export default App;
