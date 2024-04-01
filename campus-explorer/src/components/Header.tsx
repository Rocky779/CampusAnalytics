// src/components/Header.tsx
import React from "react";
import {AppBar, Toolbar, Typography} from "@mui/material";

const Header: React.FC = () => {
	return (
		<AppBar position="static">
			<Toolbar>
				<Typography variant="h6" style={{fontFamily: "Bungee Spice, cursive"}}>
					CPSC 310 Campus Explorer: Team 67
				</Typography>
			</Toolbar>
		</AppBar>
	);
};

export default Header;
