import React, {useEffect, useState} from "react";
import "./RoomDataList.css";
import {Room} from "./types";

interface RoomDataListProps {
	rooms: Room[];
	onSelectRoom: (selectedRoomNames: string[]) => void;
}

const RoomDataList: React.FC<RoomDataListProps> = ({rooms, onSelectRoom}) => {
	const [selectedRoomNames, setSelectedRoomNames] = useState<string[]>([]);

	const toggleRoomSelection = (roomName: string) => {
		setSelectedRoomNames((prevSelected) => {
			const isSelected = prevSelected.includes(roomName);
			if (isSelected) {
				// If the room is already selected, remove it from the selection
				return prevSelected.filter((name) => name !== roomName);
			} else {
				// If the room is not selected and we have less than 5 rooms, add it to the selection
				if (prevSelected.length < 5) {
					return [...prevSelected, roomName];
				} else {
					// If we already have 5 rooms, alert the user and do nothing
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
		<div className="room-data-list">
			<h3>All Room Details</h3>
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
						<tr key={index} className={selectedRoomNames.includes(room.name) ? "selected" : ""}>
							<td>
								<input
									type="checkbox"
									checked={selectedRoomNames.includes(room.name)}
									onChange={() => toggleRoomSelection(room.name)}
									disabled={!selectedRoomNames.includes(room.name) && selectedRoomNames.length >= 5}
								/>
							</td>
							<td>{room.number}</td>
							<td>{room.shortname}</td>
							<td>{room.fullname}</td>
							<td>{room.address}</td>
							<td>{room.seats}</td>
							<td>{room.name}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default RoomDataList;
