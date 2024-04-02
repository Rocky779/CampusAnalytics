// src/components/RoomSelector.tsx
import React from "react";
import "./RoomSelector.css"; // Make sure to create a corresponding CSS file for styling

interface RoomSelectorProps {
	filter: string;
	onFilterChange: (filter: string) => void;
}

const RoomSelector: React.FC<RoomSelectorProps> = ({filter, onFilterChange}) => {
	const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onFilterChange(e.target.value);
	};

	return (
		<div className="room-selector">
			<input type="text" placeholder="Search for a room" value={filter} onChange={handleFilterChange} />
		</div>
	);
};

export default RoomSelector;
