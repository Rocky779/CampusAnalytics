import React, {useState} from "react";
import "./App.css";
import GoogleMapsComponent from "./components/GoogleMapsComponent";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import RoomSelector from "./components/RoomSelector";
import RoomDetails from "./components/RoomDetails";

// Placeholder function for walking time estimation
function estimateWalkingTime(room1: string, room2: string) {
	// Implement your logic here or call an API that provides this information
	// For now, let's return a random value between 1 and 15 minutes
	return Math.floor(Math.random() * 15) + 1;
}

function App() {
	const [selectedRooms, setSelectedRooms] = useState<string[]>([]); // State to store selected rooms

	// Function to handle room selection
	const handleRoomSelect = (selectedRooms: string[]) => {
		setSelectedRooms(selectedRooms);
	};

	// Sample rooms data
	const rooms = [
		{
			id: "1",
			fullname: "Sample Room 1",
			shortname: "SR1",
			number: "101",
			name: "Room 101",
			address: "123 Main St",
			seats: 20,
		},
		{
			id: "2",
			fullname: "Sample Room 2",
			shortname: "SR2",
			number: "102",
			name: "Room 102",
			address: "456 Elm St",
			seats: 15,
		},
		// Add more room objects as needed
	];

	return (
		<div className="App">
			<Header />
			<div className="Content">
				<div className="Sidebar">
					<Sidebar />
					{/* Room selection component */}
					<RoomSelector rooms={rooms} onSelectRoom={handleRoomSelect} />
				</div>
				<div className="Map">
					<GoogleMapsComponent selectedRooms={selectedRooms} />
					{/* Room details component */}
					{/* Pass the selected rooms to RoomDetails */}
					<RoomDetails
						selectedRooms={selectedRooms}
						// todo fix
						room={{
							fullname: "",
							shortname: "",
							number: "",
							name: "",
							address: "",
							seats: 0,
						}}
					/>
				</div>
			</div>
		</div>
	);
}

export default App;
