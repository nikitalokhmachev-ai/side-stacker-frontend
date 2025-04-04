import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { getGame, makeMove, makeBotMove, deleteGame } from "../api/gameApi";
import { GameState } from "../types/game";
import { Box, Typography, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";

const GamePage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [game, setGame] = useState<GameState | null>(null);
	const [loading, setLoading] = useState(true);
	const [botProcessing, setBotProcessing] = useState(false);
	const socketRef = useRef<WebSocket | null>(null);

	const clientId = useRef(Math.random().toString(36).slice(2));
	const isBotOwner = useRef(false);
	const gameKey = useMemo(() => `bot_owner_${id}`, [id]);

	const isBot = (type: string) => type !== "human";

	const location = useLocation();
	const localPlayerId = location.state?.playerId;
	const [opponentLeft, setOpponentLeft] = useState(false);

	const getPlayerSymbol = () => {
		if (!game || !localPlayerId) return null;
		if (game.player_1.id === localPlayerId) return "x";
		if (game.player_2.id === localPlayerId) return "o";
		return null;
	};

	const getDisplayName = (type: string, nickname: string) => {
		if (type === "easy_bot") return "Easy Bot";
		if (type === "medium_bot") return "Medium Bot";
		if (type === "hard_bot") return "Hard Bot";
		return nickname;
	};

	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

	useEffect(() => {
		if (!id) return;
		const currentOwner = localStorage.getItem(gameKey);
		if (!currentOwner) {
			localStorage.setItem(gameKey, clientId.current);
			isBotOwner.current = true;
		} else {
			isBotOwner.current = currentOwner === clientId.current;
		}

		// Cleanup if this tab closes or navigates away
		const handleUnload = () => {
			if (isBotOwner.current) {
				localStorage.removeItem(gameKey);
			}
		};

		window.addEventListener("beforeunload", handleUnload);
		return () => {
			if (isBotOwner.current) {
				localStorage.removeItem(gameKey);
			}
			window.removeEventListener("beforeunload", handleUnload);
		};
	}, [gameKey]);

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
		if (!id) return;

		const socket = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/games/${id}`);

		socketRef.current = socket;

		socket.onmessage = (event) => {
			const data: GameState = JSON.parse(event.data);
			if (data.status === "deleted") {
				setOpponentLeft(true);
				return;
			}
			setGame(data);
		};

		socket.onerror = () => {
			console.warn("WebSocket error");
		};

		socket.onclose = () => {
			console.log("WebSocket closed");
		};

		return () => {
			socket.close();
		};
	}, [id]);

	useEffect(() => {
		const runBotTurn = async () => {
			if (!game || game.status !== "in_progress" || botProcessing) return;

			const currentPlayer = game.current_turn === "x" ? game.player_1 : game.player_2;
			const nextPlayer = game.current_turn === "x" ? game.player_2 : game.player_1;

			const isAIVsAI = isBot(game.player_1.type) && isBot(game.player_2.type);
			const isCurrentBot = isBot(currentPlayer.type);

			if (isCurrentBot && isBotOwner.current) {
				setBotProcessing(true);

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
			await makeMove(game.id, {
				player: game.current_turn,
				row,
				side,
			});
			// No setGame here — update will come from WebSocket
		}
	};

	const handleBack = async () => {
		if (game) {
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

	const mySymbol = getPlayerSymbol();
	const isMyTurn = mySymbol === game.current_turn;
	const canMove = game.status === "in_progress" && isMyTurn;
	const isOnlineGame = game.player_1.type === "human" && game.player_2.type === "human" && game.player_1.id !== game.player_2.id;

	const isGameOver = game.status !== "in_progress";

	const winnerName = game.status === "x_won" ? game.player_1.nickname : game.status === "o_won" ? game.player_2.nickname : null;
	const opponentNickname = mySymbol === "x" ? game.player_2.nickname : game.player_1.nickname;

	const localPlayerNickname = mySymbol === "x" ? game.player_1.nickname : game.player_2.nickname;

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
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						width: "100%",
						p: 2,
						mb: 2,
						backgroundColor: "#fefefe",
						borderRadius: "8px",
						border: "1px solid #ddd",
						boxShadow: 2,
					}}
				>
					{/* You */}
					<Box sx={{ textAlign: "center" }}>
						<Typography variant="body1" sx={{ fontWeight: "bold", mb: 0.5 }}>
							You
						</Typography>
						<Typography variant="h6" color="primary">
							{getDisplayName(mySymbol === "x" ? game.player_1.type : game.player_2.type, localPlayerNickname)}
						</Typography>
						<Typography variant="h5" sx={{ mt: 0.5 }}>
							{mySymbol === "x" ? "🔵" : "🔴"}
						</Typography>
					</Box>

					{/* VS Divider */}
					<Typography variant="h6" sx={{ px: 2 }}>
						vs
					</Typography>

					{/* Opponent */}
					<Box sx={{ textAlign: "center" }}>
						<Typography variant="body1" sx={{ fontWeight: "bold", mb: 0.5 }}>
							Opponent
						</Typography>
						<Typography variant="h6" color="red">
							{getDisplayName(mySymbol === "x" ? game.player_2.type : game.player_1.type, opponentNickname)}
						</Typography>
						<Typography variant="h5" sx={{ mt: 0.5 }}>
							{mySymbol === "x" ? "🔴" : "🔵"}
						</Typography>
					</Box>
				</Box>

				{isOnlineGame && !isGameOver && (
					<Typography variant="h6" sx={{ mb: 2, fontWeight: "bold" }}>
						{isMyTurn ? "Your turn!" : "Waiting for opponent..."}
					</Typography>
				)}

				<Box>
					{game.board.map((row, rowIndex) => (
						<Box key={rowIndex} display="flex" alignItems="center" mb={1}>
							<Button
								variant="contained"
								color="primary"
								onClick={() => handleMove(rowIndex, "L")}
								disabled={!canMove || botProcessing}
								sx={{
									minWidth: 40,
									height: 40,
									mr: 1,
									fontSize: 20,
									fontWeight: "bold",
									backgroundColor: "#1976d2",
									":disabled": {
										backgroundColor: "#ccc",
										color: "#888",
									},
								}}
							>
								➡️
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
							<Button
								variant="contained"
								color="secondary"
								onClick={() => handleMove(rowIndex, "R")}
								disabled={!canMove || botProcessing}
								sx={{
									minWidth: 40,
									height: 40,
									ml: 1,
									fontSize: 20,
									fontWeight: "bold",
									backgroundColor: "#d32f2f",
									":disabled": {
										backgroundColor: "#ccc",
										color: "#888",
									},
								}}
							>
								⬅️
							</Button>
						</Box>
					))}
				</Box>

				{isGameOver && (
					<Typography variant="h5" sx={{ mt: 2, fontWeight: "bold" }} color="primary">
						{winnerName ? `${winnerName} wins! 🎉` : "It's a draw!"}
					</Typography>
				)}

				<Button onClick={handleBack} variant="contained" sx={{ mt: 4 }}>
					Back
				</Button>
				<Dialog open={opponentLeft}>
					<DialogTitle>Opponent Left</DialogTitle>
					<DialogContent>
						<Typography>Your opponent has exited the game.</Typography>
					</DialogContent>
					<DialogActions>
						<Button variant="contained" onClick={() => navigate("/")}>
							Back
						</Button>
					</DialogActions>
				</Dialog>
			</Box>
		</Box>
	);
};

export default GamePage;
