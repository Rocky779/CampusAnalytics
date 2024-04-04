import React, {useEffect, useState} from "react";
import {GoogleMap, useJsApiLoader, Marker, DirectionsRenderer} from "@react-google-maps/api";
import {Room} from "./types";

interface GoogleMapsProps {
	rooms: Room[];
	selectedRoomNames: string[];
}

const UBC_CAMPUS_CENTER = {lat: 49.2606, lng: -123.246};
const DEFAULT_ZOOM = 15;
const GOOGLE_MAPS_API_KEY = "AIzaSyAVANdCAPvvjZU9miE8nhBSzskKciy02do"; // Replace with your actual API key

const GoogleMapsComponent: React.FC<GoogleMapsProps> = ({rooms, selectedRoomNames}) => {
	const [walkingTimeMessage, setWalkingTimeMessage] = useState<string>("");
	const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

	const {isLoaded, loadError} = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: GOOGLE_MAPS_API_KEY,
	});

	useEffect(() => {
		if (isLoaded && selectedRoomNames.length > 1) {
			const selectedRooms = rooms.filter((room) => selectedRoomNames.includes(room.rooms_name));
			const uniqueBuildings = new Set(selectedRooms.map((room) => room.rooms_shortname));

			if (uniqueBuildings.size === 1) {
				setWalkingTimeMessage("Short walk within building");
				setDirections(null);
			} else {
				const directionsService = new google.maps.DirectionsService();
				const waypoints = selectedRooms.slice(1, -1).map((room) => ({
					location: new google.maps.LatLng(room.rooms_lat, room.rooms_lon),
					stopover: true,
				}));
				const origin = selectedRooms[0];
				const destination = selectedRooms[selectedRooms.length - 1];

				directionsService.route(
					{
						origin: new google.maps.LatLng(origin.rooms_lat, origin.rooms_lon),
						destination: new google.maps.LatLng(destination.rooms_lat, destination.rooms_lon),
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
		lat: rooms.length > 0 ? rooms[0].rooms_lat : 49.2606,
		lng: rooms.length > 0 ? rooms[0].rooms_lon : -123.246,
	};

	// Render the Google Map
	return (
		<div style={{height: "500px", width: "100%"}}>
			<GoogleMap
				mapContainerStyle={{height: "100%", width: "100%"}}
				center={UBC_CAMPUS_CENTER}
				zoom={DEFAULT_ZOOM}
			>
				{directions && <DirectionsRenderer directions={directions} options={{suppressMarkers: true}} />}
				{rooms.map((room, index) => (
					<Marker
						key={index}
						position={{ lat: room.rooms_lat, lng: room.rooms_lon }}
						label={room.rooms_shortname}
					/>
				))}
			</GoogleMap>
			{walkingTimeMessage && <div className="walking-time-message">{walkingTimeMessage}</div>}
		</div>
	);
};

export default GoogleMapsComponent;
