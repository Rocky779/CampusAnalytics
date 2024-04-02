// src/components/RoomDataList.tsx
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
			return isSelected
				? prevSelected.filter((name) => name !== roomName)
				: [...prevSelected, roomName].slice(0, 5);
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
						{/* Other headers */}
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
								/>
							</td>
							{/* Other room details cells */}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
};

export default RoomDataList;
