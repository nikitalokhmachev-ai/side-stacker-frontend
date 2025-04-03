import React, { useEffect, useState } from "react";
import { Box, Button, Typography, Paper, MenuItem, Select, FormControl, InputLabel, IconButton, TextField } from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import { useNavigate } from "react-router-dom";
import { getAllGames, createGame, createPlayer, deleteGame } from "../api/gameApi";
import { GameState, PlayerCreate, PlayerType } from "../types/game";

const playerOptions = [
	{ label: "Me", value: "me" },
	{ label: "Easy Bot", value: "easy_bot" },
	{ label: "Medium Bot", value: "medium_bot" },
	{ label: "Hard Bot", value: "hard_bot" },
];

const HomePage = () => {
	const [games, setGames] = useState<GameState[]>([]);
	const [player1Type, setPlayer1Type] = useState("me");
	const [player2Type, setPlayer2Type] = useState("easy_bot");
	const [nickname, setNickname] = useState("Player 1");
	const navigate = useNavigate();

	const fetchGames = async () => {
		const allGames = await getAllGames();
		setGames(allGames);
	};

	useEffect(() => {
		fetchGames();
	}, []);

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
		if (newGame) navigate(`/game/${newGame.id}`);
	};

	const handleDeleteGame = async (id: string) => {
		await deleteGame(id);
		fetchGames();
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
								{playerOptions.map((opt) => (
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
				</Box>

				<Typography variant="h5" gutterBottom align="center">
					Existing Games
				</Typography>

				<Box width="100%">
					{games.map((game) => (
						<Paper
							key={game.id}
							sx={{
								p: 2,
								mt: 2,
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
							}}
						>
							<Box>
								<Typography>ID: {game.id}</Typography>
								<Typography>Status: {game.status}</Typography>
								<Typography>Turn: {game.current_turn}</Typography>
							</Box>
							<Box>
								<Button variant="outlined" onClick={() => navigate(`/game/${game.id}`)}>
									Play
								</Button>
								<IconButton color="error" onClick={() => handleDeleteGame(game.id)}>
									<DeleteIcon />
								</IconButton>
							</Box>
						</Paper>
					))}
				</Box>
			</Box>
		</Box>
	);
};

export default HomePage;
