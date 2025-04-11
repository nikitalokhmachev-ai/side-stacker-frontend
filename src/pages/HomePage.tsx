import { useState } from "react";
import {
	Box,
	Button,
	Typography,
	MenuItem,
	Select,
	FormControl,
	InputLabel,
	TextField,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { createGame, createPlayer, getGamesByPlayer, getPlayer } from "../api/gameApi";
import { PlayerCreate, PlayerType, GameState } from "../types/game";
import { useEffect } from "react";

const playerOptions = [
	{ label: "Me", value: "me" },
	{ label: "Easy Bot", value: "easy_bot" },
	{ label: "Medium Bot", value: "medium_bot" },
	{ label: "Hard Bot", value: "hard_bot" },
];

const HomePage = () => {
	const [player1Type, setPlayer1Type] = useState("me");
	const [player2Type, setPlayer2Type] = useState("easy_bot");
	const [nickname, setNickname] = useState("Player 1");
	const navigate = useNavigate();
	const [onlineModalOpen, setOnlineModalOpen] = useState(false);
	const [waitingSocket, setWaitingSocket] = useState<WebSocket | null>(null);
	const [playerId, setPlayerId] = useState<string | null>(localStorage.getItem("playerId"));
	const [gameHistory, setGameHistory] = useState<GameState[]>([]);

	// Load existing player
	useEffect(() => {
		const storedId = localStorage.getItem("playerId");
		if (storedId) {
			getPlayer(storedId).then((player) => {
				setNickname(player.nickname);
				setPlayerId(storedId);
				loadGameHistory(storedId);
			});
		}
	}, []);

	const loadGameHistory = async (id: string) => {
		const history = await getGamesByPlayer(id);
		setGameHistory(history.reverse()); // show newest first
	};

	const handleStartGame = async () => {
		let localPlayerId = localStorage.getItem("playerId");
		let p1Id: string;

		if (player1Type === "me" && localPlayerId) {
			// Player already exists locally, fetch from DB to get nickname
			try {
				const existingPlayer = await getPlayer(localPlayerId);
				setNickname(existingPlayer.nickname);
				p1Id = existingPlayer.id;
			} catch {
				// If somehow invalid, create fresh
				const newPlayer: PlayerCreate = { nickname, type: "human" };
				p1Id = await createPlayer(newPlayer);
				localStorage.setItem("playerId", p1Id);
				localStorage.setItem("nickname", newPlayer.nickname);
				setPlayerId(p1Id);
			}
		} else if (player1Type === "me") {
			// No player stored, create new
			const newPlayer: PlayerCreate = { nickname, type: "human" };
			p1Id = await createPlayer(newPlayer);
			localStorage.setItem("playerId", p1Id);
			localStorage.setItem("nickname", newPlayer.nickname);
			setPlayerId(p1Id);
		} else {
			// Bot case
			const botPlayer: PlayerCreate = { nickname: "Player 1", type: player1Type as PlayerType };
			p1Id = await createPlayer(botPlayer);
		}

		const p2: PlayerCreate = {
			nickname: player2Type === "me" ? nickname : "Player 2",
			type: player2Type === "me" ? "human" : (player2Type as PlayerType),
		};

		const p2Id = await createPlayer(p2);
		const newGame = await createGame(p1Id, p2Id);

		await loadGameHistory(p1Id);
		navigate(`/game/${newGame.id}`, { state: { playerId: p1Id } });
	};

	const handleOnlineGame = async () => {
		let localPlayerId = localStorage.getItem("playerId");

		if (localPlayerId) {
			try {
				const existing = await getPlayer(localPlayerId);
				setNickname(existing.nickname);
				setPlayerId(existing.id);
			} catch {
				localPlayerId = null;
			}
		}

		if (!localPlayerId) {
			const newPlayer: PlayerCreate = { nickname, type: "human" };
			localPlayerId = await createPlayer(newPlayer);
			localStorage.setItem("playerId", localPlayerId);
			localStorage.setItem("nickname", newPlayer.nickname);
			setPlayerId(localPlayerId);
		}

		const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/online-game`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ player_id: localPlayerId }),
		});

		const data = await res.json();

		await loadGameHistory(localPlayerId);

		if (data.waiting) {
			setOnlineModalOpen(true);

			const socket = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/waiting/${localPlayerId}`);
			socket.onmessage = (event) => {
				const game = JSON.parse(event.data);
				socket.close();
				setOnlineModalOpen(false);
				navigate(`/game/${game.id}`, { state: { playerId: localPlayerId } });
			};

			socket.onerror = () => {
				console.warn("WebSocket error during online waiting");
			};

			setWaitingSocket(socket);
		} else {
			navigate(`/game/${data.game.id}`, { state: { playerId: localPlayerId } });
		}
	};

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
					width: "100%",
					maxWidth: "600px",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				<Typography variant="h3" align="center" gutterBottom>
					Side Stacker
				</Typography>

				<Box width="100%" display="flex" flexDirection="column" gap={2} mb={4}>
					<Typography variant="h6" align="center">
						Who is playing?
					</Typography>

					<Box display="flex" gap={2}>
						<FormControl fullWidth>
							<InputLabel>Player 1</InputLabel>
							<Select value={player1Type} label="Player 1" onChange={(e) => setPlayer1Type(e.target.value)}>
								{playerOptions.map((opt) => (
									<MenuItem key={opt.value} value={opt.value}>
										{opt.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<FormControl fullWidth>
							<InputLabel>Player 2</InputLabel>
							<Select value={player2Type} label="Player 2" onChange={(e) => setPlayer2Type(e.target.value)}>
								{playerOptions
									.filter((opt) => opt.value !== "me")
									.map((opt) => (
										<MenuItem key={opt.value} value={opt.value}>
											{opt.label}
										</MenuItem>
									))}
							</Select>
						</FormControl>
					</Box>

					{player1Type === "me" && <TextField label="Your Nickname" value={nickname} onChange={(e) => setNickname(e.target.value)} fullWidth />}

					<Button variant="contained" onClick={handleStartGame}>
						Start Game
					</Button>
					<Button variant="contained" color="success" onClick={handleOnlineGame}>
						Online Game
					</Button>

					{gameHistory.length > 0 && (
						<Box width="100%" mt={4}>
							<Typography variant="h5" gutterBottom>
								Game History
							</Typography>
							{gameHistory.map((game) => (
								<Box
									key={game.id}
									display="flex"
									justifyContent="space-between"
									alignItems="center"
									mb={1}
									sx={{ padding: 1, border: "1px solid #ccc", borderRadius: 2 }}
								>
									<Box>
										<Typography variant="body1">
											{game.player_1.nickname} (x) vs {game.player_2.nickname} (o)
										</Typography>
										<Typography variant="body2" color="text.secondary">
											Status: {game.status}
										</Typography>
									</Box>
									<Button variant="outlined" onClick={() => navigate(`/game/${game.id}`, { state: { playerId } })}>
										View
									</Button>
								</Box>
							))}
						</Box>
					)}
				</Box>
			</Box>
			<Dialog open={onlineModalOpen}>
				<DialogTitle>Please Wait...</DialogTitle>
				<DialogContent>
					<Typography>Waiting for another player to join your game.</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							if (waitingSocket) {
								waitingSocket.close();
								setWaitingSocket(null);
							}
							setOnlineModalOpen(false);
						}}
						color="error"
					>
						Disconnect
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default HomePage;
