interface Player {
  id: string;
  username: string;
}

interface GameState {
  grid: (string | null)[];
  currentTurn: number;
}

export interface Room {
  players: Player[];
  gameState: GameState;
}