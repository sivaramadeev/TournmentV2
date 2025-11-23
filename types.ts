
export type TournamentStatus = 'Draft' | 'Publishing' | 'Published';

export type View = 'login' | 'admin' | 'player' | 'auth';

export enum MatchStatus {
  Scheduled = 'Scheduled',
  InProgress = 'In-Progress',
  Completed = 'Completed',
  WalkoverP1 = 'Walkover P1',
  WalkoverP2 = 'Walkover P2',
  Disqualified = 'Disqualified'
}

export interface User {
  id: string;
  email: string;
  name: string;
  password?: string; // stored in localstorage for mock auth
}

export interface Player {
  id: string;
  name: string;
  mobileNumber: string;
  categories: string[];
  feePaid: boolean;
}

export interface MatchHistoryEntry {
  timestamp: string;
  changedBy: string;
  oldState: { scoreP1: number | null; scoreP2: number | null; status: MatchStatus };
  newState: { scoreP1: number | null; scoreP2: number | null; status: MatchStatus };
  reason: string;
}

export interface Match {
  id: string;
  player1Id: string | null; // Null if waiting for winner or BYE
  player2Id: string | null;
  scoreP1: number | null;
  scoreP2: number | null;
  status: MatchStatus;
  history: MatchHistoryEntry[];
  // Knockout specific
  roundName?: string; 
  nextMatchId?: string;
  nextMatchPlayerIndex?: 0 | 1; // 0 for P1, 1 for P2 in the next match
}

export interface Group {
  id: string;
  name: string;
  playerIds: string[];
  matches: Match[];
}

export interface CategoryFixture {
  category: string;
  type: string;
  format: 'RoundRobin' | 'Knockout'; // Added to distinguish formats
  groups: Group[]; // Used for Round Robin
  knockoutMatches?: Match[]; // Used for Knockout
}

export interface TournamentSettings {
  name: string;
  types: string[];
  categories: string[];
}

export interface Tournament {
  id: string;
  ownerId: string; // SaaS: Links tournament to a specific user
  createdAt: string;
  settings: TournamentSettings;
  players: Player[];
  fixtures: CategoryFixture[];
  isPublished: boolean;
  status: TournamentStatus;
  gistId?: string; 
}
