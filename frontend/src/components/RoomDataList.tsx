import React, {useEffect, useState} from "react";
import {Card, CardContent, Typography} from "@mui/material";
import {Room} from "./types";

interface RoomDataListProps {
	rooms: Room[];
	onSelectRoom: (selectedRooms: string[]) => void;
}

const RoomDataList: React.FC<RoomDataListProps> = ({rooms, onSelectRoom}) => {
	const [selectedRoomNames, setSelectedRoomNames] = useState<string[]>([]);

	const deselectAll = () => {
		setSelectedRoomNames([]);
		onSelectRoom([]);
	};

	const toggleRoomSelection = (roomName: string) => {
		setSelectedRoomNames((prevSelected) => {
			const isSelected = prevSelected.includes(roomName);
			if (isSelected) {
				return prevSelected.filter((name) => name !== roomName);
			} else {
				if (prevSelected.length < 5) {
					return [...prevSelected, roomName];
				} else {
					alert("You can only select up to 5 rooms.");
					return prevSelected;
				}
			}
		});
	};

	useEffect(() => {
		onSelectRoom(selectedRoomNames);
	}, [selectedRoomNames, onSelectRoom]);

	return (
		<div className="room-data-list" style={{maxHeight: "500px", overflowY: "auto"}}>
			<h3>All Room Details</h3>
			<div className="room-data-list">
				<button onClick={deselectAll} className="deselect-all-btn">
					Deselect All
				</button>
				<table>{/* table headers and rows here */}</table>
			</div>
			<table>
				<thead>
					<tr>
						<th>Select</th>
						<th>Room Number</th>
						<th>Short Name</th>
						<th>Full Name</th>
						<th>Address</th>
						<th>Seats</th>
						<th>Name</th>
					</tr>
				</thead>
				<tbody>
					{rooms.map((room, index) => (
						<tr key={index} className={selectedRoomNames.includes(room.rooms_name) ? "selected" : ""}>
							<td>
								<input
									type="checkbox"
									checked={selectedRoomNames.includes(room.rooms_name)}
									onChange={() => toggleRoomSelection(room.rooms_name)}
									disabled={
										!selectedRoomNames.includes(room.rooms_name) && selectedRoomNames.length >= 5
									}
								/>
							</td>
							<td>{room.rooms_number}</td>
							<td>{room.rooms_shortname}</td>
							<td>{room.rooms_fullname}</td>
							<td>{room.rooms_address}</td>
							<td>{room.rooms_seats}</td>
							<td>{room.rooms_name}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default RoomDataList;
