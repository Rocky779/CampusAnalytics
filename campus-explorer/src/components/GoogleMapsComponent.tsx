import React, {useEffect, useState} from "react";
import {GoogleMap, useJsApiLoader, Marker, DirectionsRenderer} from "@react-google-maps/api";
import {Room} from "./types"; // Update this path as necessary

interface GoogleMapsComponentProps {
	rooms: Room[];
	selectedRoomNames: string[];
}

const GoogleMapsComponent: React.FC<GoogleMapsComponentProps> = ({rooms, selectedRoomNames}) => {
	// State hooks
	const [walkingTimeMessage, setWalkingTimeMessage] = useState("");
	const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

	// Load the Google Maps script
	const {isLoaded, loadError} = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: "AIzaSyAVANdCAPvvjZU9miE8nhBSzskKciy02do", // Replace with your actual API key
	});

	useEffect(() => {
		if (isLoaded && selectedRoomNames.length > 1) {
			const selectedRooms = rooms.filter((room) => selectedRoomNames.includes(room.name));
			const uniqueBuildings = new Set(selectedRooms.map((room) => room.shortname));

			if (uniqueBuildings.size === 1) {
				setWalkingTimeMessage("Short walk within building");
				setDirections(null);
			} else {
				const directionsService = new google.maps.DirectionsService();
				const waypoints = selectedRooms.slice(1, -1).map((room) => ({
					location: new google.maps.LatLng(room.lat, room.lon),
					stopover: true,
				}));
				const origin = selectedRooms[0];
				const destination = selectedRooms[selectedRooms.length - 1];

				directionsService.route(
					{
						origin: new google.maps.LatLng(origin.lat, origin.lon),
						destination: new google.maps.LatLng(destination.lat, destination.lon),
						waypoints: waypoints,
						optimizeWaypoints: true,
						travelMode: google.maps.TravelMode.WALKING,
					},
					(response, status) => {
						if (status === google.maps.DirectionsStatus.OK && response) {
							setDirections(response);
							const totalDuration = response.routes[0].legs.reduce(
								(total, leg) => total + (leg.duration ? leg.duration.value : 0),
								0
							);
							setWalkingTimeMessage(`Total Walking Time: ${Math.round(totalDuration / 60)} minutes`);
						} else {
							console.error("Directions request failed due to " + status);
						}
					}
				);
			}
		} else {
			setDirections(null); // Reset directions if conditions are not met
			setWalkingTimeMessage(""); // Clear any existing messages
		}
	}, [selectedRoomNames, rooms, isLoaded]);

	if (loadError) {
		return <div>Map cannot be loaded right now, sorry.</div>;
	}

	if (!isLoaded) {
		return <div>Loading...</div>;
	}

	// Define the map's center
	const center = {
		lat: rooms.length > 0 ? rooms[0].lat : 49.2606,
		lng: rooms.length > 0 ? rooms[0].lon : -123.246,
	};

	// Render the Google Map
	return (
		<GoogleMap mapContainerStyle={{width: "100%", height: "100%"}} center={center} zoom={15}>
			{rooms
				.filter((room) => selectedRoomNames.includes(room.name))
				.map((room, index) => (
					<Marker key={index} position={{lat: room.lat, lng: room.lon}} label={room.shortname} />
				))}
			{walkingTimeMessage && (
				<div
					style={{
						position: "absolute",
						bottom: "50px",
						left: "50%",
						transform: "translateX(-50%)",
						backgroundColor: "white",
						padding: "5px",
					}}
				>
					{walkingTimeMessage}
				</div>
			)}
			{directions && <DirectionsRenderer directions={directions} options={{suppressMarkers: true}} />}
		</GoogleMap>
	);
};

export default GoogleMapsComponent;
