import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
});

export interface PlayerSummary {
  pin: number;
  firstName: string;
  lastName: string;
  countryCode: string;
  grade: string;
  rating: number | null;
  club: string | null;
  totalTournaments: number | null;
  lastAppearance: string | null;
}

export interface SearchResponse {
  data: PlayerSummary[];
  total: number;
  currentPage: number;
  hasMorePages: boolean;
}

export interface RatingHistoryEntry {
  date: string;
  tournament: string;
  city: string;
  nation: string;
  placement: number;
  grade: string;
  rating_before: number | null;
  rating_after: number | null;
  won: number;
  lost: number;
  jigo: number;
}

export interface PlayerDetail extends PlayerSummary {
  deltaRating: number | null;
  proposedGrade: string | null;
  egfPlacement: number | null;
  rating_history: RatingHistoryEntry[];
  biography?: { type?: string; biography?: string; photo?: string };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  model: string | null;
  tool_calls?: string[];
}

export async function searchPlayers(query: string): Promise<SearchResponse> {
  const res = await api.get<SearchResponse>('/search', { params: { q: query } });
  return res.data;
}

export async function getPlayer(pin: number): Promise<PlayerDetail> {
  const res = await api.get<PlayerDetail>(`/player/${pin}`);
  return res.data;
}

export async function getPlayerTournaments(pin: number) {
  const res = await api.get(`/player/${pin}/tournaments`);
  return res.data;
}

export interface PlayerGame {
  id: string;
  date: string;
  round: number;
  result: string;
  handicap: number;
  player1: { pin: number; firstName: string; lastName: string };
  player2: { pin: number; firstName: string; lastName: string };
  color1: string;
  color2: string;
  tournament: { code: string; description: string };
}

export interface GamesResponse {
  data: PlayerGame[];
  total: number;
  currentPage: number;
  hasMorePages: boolean;
}

export async function getPlayerGames(
  pin: number,
  limit: number = 200
): Promise<GamesResponse> {
  const res = await api.get<GamesResponse>(`/player/${pin}/games`, {
    params: { limit },
  });
  return res.data;
}

export async function sendChatMessage(
  message: string,
  context?: string,
  history?: ChatMessage[]
): Promise<ChatResponse> {
  const res = await api.post<ChatResponse>('/chat', {
    message,
    context,
    history,
  });
  return res.data;
}
