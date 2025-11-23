
import { Tournament } from './types';

export const ADMIN_USERNAME = 'admin';
export const ADMIN_PASSWORD = 'password';

export const DEFAULT_TOURNAMENT: Tournament = {
  id: 'default',
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
