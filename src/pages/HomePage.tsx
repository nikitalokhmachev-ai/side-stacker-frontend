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
import { createGame, createPlayer } from "../api/gameApi";
import { PlayerCreate, PlayerType } from "../types/game";

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

	const handleStartGame = async () => {
		const player1: PlayerCreate = {
			nickname: player1Type === "me" ? nickname : "Player 1",
			type: player1Type === "me" ? "human" : (player1Type as PlayerType),
		};

		const player2: PlayerCreate = {
			nickname: player2Type === "me" ? nickname : "Player 2",
			type: player2Type === "me" ? "human" : (player2Type as PlayerType),
		};

		const p1Id = await createPlayer(player1);
		const p2Id = await createPlayer(player2);

		const newGame = await createGame(p1Id, p2Id);
		if (newGame) navigate(`/game/${newGame.id}`, { state: { playerId: p1Id } });
	};

	const handleOnlineGame = async () => {
		const newPlayer: PlayerCreate = {
			nickname,
			type: "human",
		};

		const playerId = await createPlayer(newPlayer);

		const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/online-game`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ player_id: playerId }),
		});

		const data = await res.json();

		if (data.waiting) {
			setOnlineModalOpen(true);

			const socket = new WebSocket(`${import.meta.env.VITE_WS_BASE_URL}/waiting/${playerId}`);
			socket.onmessage = (event) => {
				const game = JSON.parse(event.data);
				socket.close();
				setOnlineModalOpen(false);
				navigate(`/game/${game.id}`, { state: { playerId } });
			};

			socket.onerror = () => {
				console.warn("WebSocket error during online waiting");
			};

			setWaitingSocket(socket);
		} else {
			navigate(`/game/${data.game.id}`, { state: { playerId } });
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
