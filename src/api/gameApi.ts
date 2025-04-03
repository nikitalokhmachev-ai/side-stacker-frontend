import axios from "axios";
import { GameState, PlayerCreate } from "../types/game";

const API = axios.create({
	baseURL: import.meta.env.VITE_API_BASE_URL,
});

export const getAllGames = async (): Promise<GameState[]> => {
	const res = await API.get("/games");
	return res.data;
};

export const createPlayer = async (player: PlayerCreate): Promise<string> => {
	const res = await API.post("/player", player);
	return res.data.id;
};

export const createGame = async (player1Id: string, player2Id: string): Promise<GameState> => {
	const res = await API.post("/game", {
		player_1_id: player1Id,
		player_2_id: player2Id,
	});
	return res.data;
};

export const deleteGame = async (id: string): Promise<void> => {
	await API.delete(`/games/${id}`);
};

export const getGame = async (id: string): Promise<GameState> => {
	const res = await API.get(`/games/${id}`);
	return res.data;
};

export const makeMove = async (gameId: string, move: { player: string; row: number; side: "L" | "R" }): Promise<GameState> => {
	const res = await API.post(`/games/${gameId}/move`, move);
	return res.data;
};

export const makeBotMove = async (gameId: string, difficulty: string): Promise<GameState> => {
	const res = await API.post(`/games/${gameId}/bot_move/${difficulty}`);
	return res.data;
};
