
import { Tournament } from '../types';

const GITHUB_API_URL = 'https://api.github.com/gists';

export const gistService = {
    /**
     * Saves tournament data to a GitHub Gist.
     * If gistId is provided, it updates the existing Gist.
     * Otherwise, it creates a new one.
     */
    saveToGist: async (token: string, tournament: Tournament, existingGistId?: string): Promise<string> => {
        const method = existingGistId ? 'PATCH' : 'POST';
        const url = existingGistId ? `${GITHUB_API_URL}/${existingGistId}` : GITHUB_API_URL;

        // We store the specific tournament data in a file named "tournament_data.json"
        const body = {
            description: `Tournament Data: ${tournament.settings.name}`,
            public: true, // Must be public to be readable by players without a token
            files: {
                "tournament_data.json": {
                    content: JSON.stringify(tournament, null, 2)
                }
            }
        };

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to save to Gist');
        }

        const data = await response.json();
        return data.id;
    },

    /**
     * Loads tournament data from a public GitHub Gist ID.
     * No token is required for reading public gists.
     */
    loadFromGist: async (gistId: string): Promise<Tournament> => {
        const response = await fetch(`${GITHUB_API_URL}/${gistId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/vnd.github.v3+json',
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load tournament data');
        }

        const data = await response.json();
        const fileContent = data.files["tournament_data.json"]?.content;

        if (!fileContent) {
            throw new Error('Invalid Gist format: tournament_data.json not found');
        }

        return JSON.parse(fileContent);
    }
};
