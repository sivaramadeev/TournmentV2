
import { Tournament } from './types';

// Admin credentials removed in favor of dynamic authService

export const DEFAULT_TOURNAMENT: Tournament = {
  id: 'default',
  ownerId: '',
  createdAt: '',
  settings: {
    name: '',
    types: [],
    categories: [],
  },
  players: [],
  fixtures: [],
  isPublished: false,
  status: 'Draft',
};

export const TOURNAMENT_TYPES = ['Men Singles', 'Men Doubles', 'Women Singles', 'Women Doubles', 'Mixed Doubles'];
export const PLAYER_CATEGORIES = ['Open', '30+', '40+', '50+', '60+', '70+'];
