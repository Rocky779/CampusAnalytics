// src/components/RoomSelector.tsx

import React, {useState} from "react";
import {Select, MenuItem, InputLabel, FormControl, OutlinedInput, Chip, SelectChangeEvent} from "@mui/material";

interface RoomSelectorProps {
	rooms: {
		id: string;
		fullname: string;
		shortname: string;
		number: string;
		name: string;
		address: string;
		seats: number;
	}[];
	onSelectRoom: (selectedRooms: string[]) => void; // Change the type here to expect an array of strings
}

const RoomSelector: React.FC<RoomSelectorProps> = ({rooms, onSelectRoom}) => {
	const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);

	const handleChange = (event: SelectChangeEvent<typeof selectedRoomIds>) => {
		const value = event.target.value;
		// On autofill we get a stringified value.
		const updatedSelectedRoomIds = typeof value === "string" ? value.split(",") : value;
		setSelectedRoomIds(updatedSelectedRoomIds);
		onSelectRoom(updatedSelectedRoomIds);
	};

	return (
		<FormControl fullWidth>
			<InputLabel id="room-select-label">Select Rooms</InputLabel>
			<Select
				labelId="room-select-label"
				multiple
				value={selectedRoomIds}
				onChange={handleChange}
				input={<OutlinedInput id="select-multiple-chip" label="Select Rooms" />}
				renderValue={(selected) => (
					<div>
						{selected.map((value) => (
							<Chip key={value} label={rooms.find((room) => room.id === value)?.name || value} />
						))}
					</div>
				)}
			>
				{rooms.map((room) => (
					<MenuItem key={room.id} value={room.id}>
						{room.name}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
};

export default RoomSelector;
