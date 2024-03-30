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

	// Set the center of the map to the first room's coordinates as an example
	const center = {
		lat: rooms[0]?.lat || 49.2606, // Fallback to default coords if rooms are empty
		lng: rooms[0]?.lon || -123.246,
	};

	return (
		<GoogleMap mapContainerStyle={{width: "100%", height: "100%"}} center={center} zoom={15}>
			{/* Render markers for each room */}
			{rooms.map((room, index) => (
				<Marker key={index} position={{lat: room.lat, lng: room.lon}} label={room.name} />
			))}
		</GoogleMap>
	);
};

export default GoogleMapsComponent;
