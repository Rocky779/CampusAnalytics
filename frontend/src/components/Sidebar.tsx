import React from "react";
import Button from "@mui/material/Button";

const Sidebar: React.FC = () => {
	return (
		<div className="Sidebar">
			<Button variant="contained" color="primary">
				Discover Campus
			</Button>
			{/* Add more controls and information as needed */}
		</div>
	);
};

export default Sidebar;
