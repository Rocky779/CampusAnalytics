// src/components/GoogleMapsComponent.tsx
import React from "react";
import {GoogleMap, useJsApiLoader, Marker} from "@react-google-maps/api";
import {Room} from "./types"; // Update this path as necessary

interface GoogleMapsComponentProps {
	rooms: Room[]; // Change from selectedRooms to rooms to receive the full room objects
}

const GoogleMapsComponent: React.FC<GoogleMapsComponentProps> = ({rooms}) => {
	const {isLoaded} = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: "AIzaSyAVANdCAPvvjZU9miE8nhBSzskKciy02do", // Replace with your actual API key
	});

	if (!isLoaded) return <div>Loading...</div>;

	// Optionally, set the center of the map dynamically based on the rooms' locations
	const center = {
		lat: rooms.length > 0 ? rooms[0].lat : 49.2606, // Default to the first room's location or a fallback
		lng: rooms.length > 0 ? rooms[0].lon : -123.246,
	};

	return (
		<GoogleMap mapContainerStyle={{width: "100%", height: "100%"}} center={center} zoom={15}>
			{/* Map through rooms and place a marker for each one */}
			{rooms.map((room, index) => (
				<Marker key={index} position={{lat: room.lat, lng: room.lon}} label={room.shortname} />
			))}
		</GoogleMap>
	);
};

export default GoogleMapsComponent;
