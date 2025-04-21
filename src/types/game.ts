export type PlayerType = "human" | "easy_bot" | "medium_bot" | "hard_bot";

export interface PlayerCreate {
	nickname: string;
	type: PlayerType;
}

export interface PlayerInfo extends PlayerCreate {
	id: string;
}

export interface GameState {
	id: string;
	board: string[][];
	current_turn: string;
	status: string;
	player_1: PlayerInfo;
	player_2: PlayerInfo;
	moves: { player: string; row: number; side: "L" | "R" }[];
}
