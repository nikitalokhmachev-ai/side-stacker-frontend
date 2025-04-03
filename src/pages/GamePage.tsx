import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGame, makeMove, makeBotMove, deleteGame } from "../api/gameApi";
import { GameState } from "../types/game";
import { Box, Typography, Button, CircularProgress } from "@mui/material";

const GamePage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [game, setGame] = useState<GameState | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchGame = async () => {
			if (!id) return;
			setLoading(true);
			try {
				const gameData = await getGame(id);
				setGame(gameData);
			} catch (error) {
				console.error("Failed to fetch game:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchGame();
	}, [id]);

	useEffect(() => {
		const handleBotTurn = async () => {
			if (game && game.status === "in_progress") {
				const currentPlayer = game.current_turn === "x" ? game.player_1 : game.player_2;
				if (currentPlayer.type !== "human") {
					await new Promise((resolve) => setTimeout(resolve, 2000)); // 2-second delay
					try {
						const updatedGame = await makeBotMove(game.id, currentPlayer.type);
						setGame(updatedGame);
					} catch (error) {
						console.error("Bot move failed:", error);
					}
				}
			}
		};

		handleBotTurn();
	}, [game]);

	const handleMove = async (row: number, side: "L" | "R") => {
		if (!game || game.status !== "in_progress") return;
		const currentPlayer = game.current_turn === "x" ? game.player_1 : game.player_2;
		if (currentPlayer.type === "human") {
			try {
				const updatedGame = await makeMove(game.id, {
					player: game.current_turn,
					row,
					side,
				});
				setGame(updatedGame);
			} catch (error) {
				console.error("Move failed:", error);
			}
		}
	};

	const handleBack = async () => {
		if (game && game.status !== "in_progress") {
			try {
				await deleteGame(game.id);
			} catch (error) {
				console.error("Failed to delete game:", error);
			}
		}
		navigate("/");
	};

	if (loading) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" height="100vh">
				<CircularProgress />
			</Box>
		);
	}

	if (!game) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" height="100vh">
				<Typography variant="h6">Game not found.</Typography>
				<Button onClick={handleBack} variant="contained" sx={{ mt: 2 }}>
					Back
				</Button>
			</Box>
		);
	}

	return (
		<Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="100vh">
			<Typography variant="h4" gutterBottom>
				Game ID: {game.id}
			</Typography>
			<Typography variant="h6" gutterBottom>
				Status: {game.status} | Turn: {game.current_turn}
			</Typography>

			<Box>
				{game.board.map((row, rowIndex) => (
					<Box key={rowIndex} display="flex" alignItems="center" mb={1}>
						<Button size="small" variant="outlined" onClick={() => handleMove(rowIndex, "L")} disabled={game.status !== "in_progress"}>
							←
						</Button>
						<Box display="flex">
							{row.map((cell, colIndex) => (
								<Box
									key={colIndex}
									sx={{
										width: 40,
										height: 40,
										border: "1px solid #ccc",
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										fontSize: 20,
										fontWeight: "bold",
										backgroundColor: cell === "x" ? "#2196f3" : cell === "o" ? "#f44336" : "#fff",
										color: cell !== "_" ? "#fff" : "#000",
									}}
								>
									{cell !== "_" ? cell : ""}
								</Box>
							))}
						</Box>
						<Button size="small" variant="outlined" onClick={() => handleMove(rowIndex, "R")} disabled={game.status !== "in_progress"}>
							→
						</Button>
					</Box>
				))}
			</Box>

			<Button onClick={handleBack} variant="contained" sx={{ mt: 2 }}>
				Back
			</Button>
		</Box>
	);
};

export default GamePage;
