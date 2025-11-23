
import { User } from '../types';

const USERS_STORAGE_KEY = 'saas_users_db';
const SESSION_STORAGE_KEY = 'saas_current_user';

export const authService = {
    getUsers: (): User[] => {
        const users = localStorage.getItem(USERS_STORAGE_KEY);
        return users ? JSON.parse(users) : [];
    },

    saveUser: (user: User) => {
        const users = authService.getUsers();
        users.push(user);
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    },

    register: (name: string, email: string, password: string): User => {
        const users = authService.getUsers();
        if (users.find(u => u.email === email)) {
            throw new Error('User with this email already exists');
        }

        const newUser: User = {
            id: `user-${Date.now()}`,
            name,
            email,
            password 
        };

        authService.saveUser(newUser);
        return newUser;
    },

    login: (email: string, password: string): User => {
        const users = authService.getUsers();
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
            throw new Error('Invalid email or password');
        }
        
        // Explicitly create the return object to satisfy strict type checking
        // We allow the password field to be undefined as per the User interface
        const safeUser: User = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(safeUser));
        return safeUser;
    },

    logout: () => {
        localStorage.removeItem(SESSION_STORAGE_KEY);
    },

    getCurrentUser: (): User | null => {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        return stored ? JSON.parse(stored) : null;
    }
};
