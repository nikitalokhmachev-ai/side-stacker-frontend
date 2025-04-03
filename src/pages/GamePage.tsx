import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGame, makeMove, makeBotMove, deleteGame } from "../api/gameApi";
import { GameState } from "../types/game";
import { Box, Typography, Button, CircularProgress, Paper } from "@mui/material";

const GamePage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [game, setGame] = useState<GameState | null>(null);
	const [loading, setLoading] = useState(true);
	const [botProcessing, setBotProcessing] = useState(false);

	const isBot = (type: string) => type !== "human";

	const getDisplayName = (type: string, nickname: string) => {
		if (type === "easy_bot") return "Easy Bot";
		if (type === "medium_bot") return "Medium Bot";
		if (type === "hard_bot") return "Hard Bot";
		return nickname;
	};

	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

	useEffect(() => {
		const fetchGame = async () => {
			if (!id) return;
			setLoading(true);
			try {
				const data = await getGame(id);
				setGame(data);
			} finally {
				setLoading(false);
			}
		};
		fetchGame();
	}, [id]);

	useEffect(() => {
		const runBotTurn = async () => {
			if (!game || game.status !== "in_progress" || botProcessing) return;

			const currentPlayer = game.current_turn === "x" ? game.player_1 : game.player_2;
			const nextPlayer = game.current_turn === "x" ? game.player_2 : game.player_1;

			const isAIVsAI = isBot(game.player_1.type) && isBot(game.player_2.type);
			const isCurrentBot = isBot(currentPlayer.type);

			if (isCurrentBot) {
				setBotProcessing(true);

				// Wait if it's AI vs AI, or just current turn is bot
				if (isAIVsAI || !isBot(nextPlayer.type)) {
					await delay(2000);
				}

				try {
					const updated = await makeBotMove(game.id, currentPlayer.type);
					setGame(updated);
				} catch (error) {
					console.error("Bot move failed", error);
				} finally {
					setBotProcessing(false);
				}
			}
		};

		runBotTurn();
	}, [game, botProcessing]);

	const handleMove = async (row: number, side: "L" | "R") => {
		if (!game || game.status !== "in_progress") return;
		const currentPlayer = game.current_turn === "x" ? game.player_1 : game.player_2;
		if (!isBot(currentPlayer.type)) {
			const updated = await makeMove(game.id, {
				player: game.current_turn,
				row,
				side,
			});
			setGame(updated);
		}
	};

	const handleBack = async () => {
		if (game && game.status !== "in_progress") {
			await deleteGame(game.id);
		}
		navigate("/");
	};

	if (loading || !game) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" height="100vh">
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box
			sx={{
				height: "100vh",
				width: "100vw",
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: "#f5f5f5",
				boxSizing: "border-box",
				padding: 2,
				overflowY: "auto",
			}}
		>
			<Box
				sx={{
					maxWidth: 700,
					width: "100%",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<Typography variant="h4" gutterBottom>
					Game ID: {game.id}
				</Typography>
				<Typography variant="h6" gutterBottom>
					Status: {game.status} | Turn: {game.current_turn}
				</Typography>

				<Paper sx={{ width: "100%", p: 2, mb: 2 }}>
					<Typography variant="body1">X = {getDisplayName(game.player_1.type, game.player_1.nickname)}</Typography>
					<Typography variant="body1">O = {getDisplayName(game.player_2.type, game.player_2.nickname)}</Typography>
				</Paper>

				<Box>
					{game.board.map((row, rowIndex) => (
						<Box key={rowIndex} display="flex" alignItems="center" mb={1}>
							<Button size="small" variant="outlined" onClick={() => handleMove(rowIndex, "L")} disabled={game.status !== "in_progress" || botProcessing}>
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
							<Button size="small" variant="outlined" onClick={() => handleMove(rowIndex, "R")} disabled={game.status !== "in_progress" || botProcessing}>
								→
							</Button>
						</Box>
					))}
				</Box>

				<Button onClick={handleBack} variant="contained" sx={{ mt: 4 }}>
					Back
				</Button>
			</Box>
		</Box>
	);
};

export default GamePage;
