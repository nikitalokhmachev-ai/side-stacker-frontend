import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import GamePage from "./pages/GamePage";
import HomePage from "./pages/HomePage";
import { SnackbarProvider } from "notistack";
import CssBaseline from "@mui/material/CssBaseline";

const App = () => {
	return (
		<SnackbarProvider maxSnack={3}>
			<CssBaseline />
			<Routes>
				<Route path="/" element={<HomePage />} />
				<Route path="/game/:id" element={<GamePage />} />
				<Route path="*" element={<Navigate to="/" />} />
			</Routes>
		</SnackbarProvider>
	);
};

export default App;
