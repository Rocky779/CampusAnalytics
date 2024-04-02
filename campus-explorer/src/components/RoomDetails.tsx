import React from "react";
import {Card, CardContent, Typography} from "@mui/material";
import {Room} from "./types";

interface RoomDetailsProps {
	rooms: Room[];
}

const RoomDetails: React.FC<RoomDetailsProps> = ({rooms}) => {
	return (
		<div>
			{rooms.map((room, index) => (
				<Card key={index} style={{marginBottom: "1rem"}}>
					<CardContent>
						<Typography variant="h5">{room.rooms_fullname}</Typography>
						<Typography variant="subtitle1">{room.rooms_shortname}</Typography>
						<Typography variant="body1">Room number: {room.rooms_number}</Typography>
						<Typography variant="body1">Room name: {room.rooms_name}</Typography>
						<Typography variant="body1">Address: {room.rooms_address}</Typography>
						<Typography variant="body1">Seats: {room.rooms_seats}</Typography>
					</CardContent>
				</Card>
			))}
		</div>
	);
};

export default RoomDetails;
