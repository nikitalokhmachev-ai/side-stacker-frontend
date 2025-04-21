import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getReplay, getGame } from "../api/gameApi";
import { Box, Typography, Button, CircularProgress } from "@mui/material";

const ReplayPage = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [frames, setFrames] = useState<string[][][]>([]);
	const [currentFrame, setCurrentFrame] = useState(0);
	const [loading, setLoading] = useState(true);
	const [game, setGame] = useState<any>(null);

	useEffect(() => {
		const fetchReplay = async () => {
			if (!id) return;
			setLoading(true);
			try {
				const gameData = await getGame(id);
				const framesData = await getReplay(id);

				setGame(gameData);
				setFrames(framesData);

				animateReplay(framesData.length);
			} finally {
				setLoading(false);
			}
		};
		fetchReplay();
	}, [id]);

	const animateReplay = (totalFrames: number) => {
		let frame = 0;
		const interval = setInterval(() => {
			frame++;
			setCurrentFrame(frame);
			if (frame >= totalFrames - 1) {
				clearInterval(interval);
			}
		}, 1000);
	};

	if (loading || !frames.length) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" height="100vh">
				<CircularProgress />
			</Box>
		);
	}

	const board = frames[currentFrame] ?? frames[frames.length - 1];

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
				<Typography variant="h4" sx={{ my: 2 }}>
					Replay: {game?.player_1?.nickname} vs {game?.player_2?.nickname}
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
