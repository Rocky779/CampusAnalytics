import React from "react";
import {Card, CardContent, Typography} from "@mui/material";

interface RoomDetailProps {
	room: {
		fullname: string;
		shortname: string;
		number: string;
		name: string;
		address: string;
		seats: number;
	};
	selectedRooms: string[]; // Add selectedRooms prop
}

const RoomDetail: React.FC<RoomDetailProps> = ({room, selectedRooms}) => {
	return (
		<Card>
			<CardContent>
				<Typography variant="h5">{room.fullname}</Typography>
				<Typography variant="subtitle1">{room.shortname}</Typography>
				<Typography variant="body1">Room number: {room.number}</Typography>
				<Typography variant="body1">Room name: {room.name}</Typography>
				<Typography variant="body1">Address: {room.address}</Typography>
				<Typography variant="body1">Seats: {room.seats}</Typography>
				{/* Render selectedRooms if needed */}
				{selectedRooms && <Typography variant="body1">Selected Rooms: {selectedRooms.join(", ")}</Typography>}
			</CardContent>
		</Card>
	);
};

export default RoomDetail;
