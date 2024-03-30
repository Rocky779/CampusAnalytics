import React from "react";
import {GoogleMap, useJsApiLoader, Marker} from "@react-google-maps/api";

interface GoogleMapsComponentProps {
	selectedRooms: string[]; // Array of selected room IDs
}

const containerStyle = {
	width: "100%", // Take the full width of the parent container
	height: "100%", // Take the full height of the parent container
};

// Set the center of the map to UBC's coordinates
const center = {
	lat: 49.2606,
	lng: -123.246,
};

const GoogleMapsComponent: React.FC<GoogleMapsComponentProps> = ({selectedRooms}) => {
	const {isLoaded} = useJsApiLoader({
		id: "google-map-script",
		googleMapsApiKey: "AIzaSyAVANdCAPvvjZU9miE8nhBSzskKciy02do", // Replace with your actual API key
	});

	if (!isLoaded) return <div>Loading...</div>;

	return (
		<GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
			{/* Render markers for each selected room */}
			{selectedRooms.map((roomId) => (
				<Marker key={roomId} position={{lat: 49.2606, lng: -123.246}} />
			))}
		</GoogleMap>
	);
};

export default GoogleMapsComponent;
