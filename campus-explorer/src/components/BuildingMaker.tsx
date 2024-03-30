import React from "react";
import {Marker} from "@react-google-maps/api";

interface BuildingMarkerProps {
	position: {
		lat: number;
		lng: number;
	};
	label: string;
}

const BuildingMarker: React.FC<BuildingMarkerProps> = ({position, label}) => {
	return <Marker position={position} label={label} />;
};

export default BuildingMarker;
