import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getGame } from "../api/gameApi";
import { GameState } from "../types/game";
import { Box, Typography, Button, CircularProgress } from "@mui/material";

const ReplayPage = () => {
	const { id } = useParams<{ id: string }>();
	const [game, setGame] = useState<GameState | null>(null);
	const [board, setBoard] = useState<string[][]>([]);
	const [loading, setLoading] = useState(true);
	const navigate = useNavigate();
	useEffect(() => {
		const fetchAndReplay = async () => {
			if (!id) return;
			setLoading(true);
			try {
				const data = await getGame(id);

				const emptyBoard = Array.from({ length: data.board.length }, () => Array.from({ length: data.board[0].length }, () => "_"));

				setGame(data);
				setBoard(emptyBoard);

				await delay(1000);
				await playReplay(data.moves);
			} finally {
				setLoading(false);
			}
		};

		fetchAndReplay();
	}, [id]);

	const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

	const playReplay = async (moves: { player: string; row: number; side: "L" | "R" }[]) => {
		for (let move of moves) {
			await delay(1000);
			setBoard((prevBoard) => {
				const updated = JSON.parse(JSON.stringify(prevBoard));
				applyMoveLocally(updated, move.row, move.side, move.player);
				return updated;
			});
		}
	};

	const applyMoveLocally = (board: string[][], row: number, side: "L" | "R", symbol: string) => {
		if (side === "L") {
			for (let col = 0; col < board[0].length; col++) {
				if (board[row][col] === "_") {
					for (let shift = col; shift > 0; shift--) {
						board[row][shift] = board[row][shift - 1];
					}
					board[row][0] = symbol;
					break;
				}
			}
		} else {
			for (let col = board[0].length - 1; col >= 0; col--) {
				if (board[row][col] === "_") {
					for (let shift = col; shift < board[0].length - 1; shift++) {
						board[row][shift] = board[row][shift + 1];
					}
					board[row][board[0].length - 1] = symbol;
					break;
				}
			}
		}
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
				{/* Board rendering, player names, etc (copy from GamePage but no move buttons) */}

				<Typography variant="h4" sx={{ my: 2 }}>
					Replay: {game.player_1.nickname} vs {game.player_2.nickname}
				</Typography>

				<Box>
					{board.map((row, rowIndex) => (
						<Box key={rowIndex} display="flex" alignItems="center" mb={1}>
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
					))}
				</Box>

				<Button variant="contained" sx={{ mt: 4 }} onClick={() => navigate("/")}>
					Return Home
				</Button>
			</Box>
		</Box>
	);
};

export default ReplayPage;
