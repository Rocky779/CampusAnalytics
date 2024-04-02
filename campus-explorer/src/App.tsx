import React, {useCallback, useEffect, useMemo, useState} from "react";
import "./App.css";
import GoogleMapsComponent from "./components/GoogleMapsComponent";
import {useJsApiLoader} from "@react-google-maps/api";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import RoomSelector from "./components/RoomSelector";
import RoomDetails from "./components/RoomDetails";
import {Room} from "./components/types";
import RoomDataList from "./components/RoomDataList";

function App() {
	const [filter, setFilter] = useState("");
	const [selectedRoomNames, setSelectedRoomNames] = useState<string[]>([]);
	const [selectedRoomDetails, setSelectedRoomDetails] = useState<Room[]>([]);
	const [rooms, setRooms] = useState<Room[]>([]);

	const handleRoomSelect = useCallback((selectedNames: string[]) => {
		setSelectedRoomNames(selectedNames);
	}, []);

	const {isLoaded} = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: "AIzaSyAVANdCAPvvjZU9miE8nhBSzskKciy02do", // Ensure this is consistent
	});

	useEffect(() => {
		async function fetchRooms() {
			try {
				const response = await fetch("http://localhost:4321/query", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						WHERE: {
							GT: {
								rooms_seats: 0,
							},
						},
						OPTIONS: {
							COLUMNS: [
								"rooms_fullname",
								"rooms_shortname",
								"rooms_number",
								"rooms_name",
								"rooms_address",
								"rooms_seats",
								"rooms_lat",
								"rooms_lon",
							],
						},
					}),
				});

				if (!response.ok) {
					throw new Error("Network response was not ok " + response.statusText);
				}

				const data = await response.json();
				setRooms(data.result); // Update based on your actual response structure
			} catch (error) {
				console.error("Fetch error:", error);
			}
		}

		fetchRooms();
	}, []);

	useEffect(() => {
		const details = rooms.filter((room) => selectedRoomNames.includes(room.rooms_name));
		setSelectedRoomDetails(details);
	}, [selectedRoomNames, rooms]);

	return (
		<div className="App">
			<Header />
			<div className="Content">
				<div className="Sidebar">
					<RoomSelector filter={filter} onFilterChange={setFilter} />
				</div>
				<div className="Map">
					<GoogleMapsComponent rooms={rooms} selectedRoomNames={selectedRoomNames} />
				</div>
				<div className="RoomDataListContainer">
					<RoomDataList
						rooms={rooms.filter(
							(room) =>
								room.rooms_fullname && room.rooms_fullname.toLowerCase().includes(filter.toLowerCase())
						)}
						onSelectRoom={handleRoomSelect}
					/>
				</div>
			</div>
		</div>
	);
}

export default App;
