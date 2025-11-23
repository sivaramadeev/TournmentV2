
import React, { useState, useEffect } from 'react';
import { Tournament } from '../types';
import { gistService } from '../services/gistService';

interface ShareModalProps {
    tournament: Tournament;
    onClose: () => void;
    onSyncComplete: (gistId: string) => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ tournament, onClose, onSyncComplete }) => {
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedLink, setGeneratedLink] = useState('');
    const [saveToken, setSaveToken] = useState(true);

    // Load token from local storage on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('github_gist_token');
        if (savedToken) {
            setToken(savedToken);
        }
    }, []);

    const handleSync = async () => {
        if (!token) {
            setError('Please enter a valid GitHub Personal Access Token.');
            return;
        }
        
        setLoading(true);
        setError('');

        if (saveToken) {
            localStorage.setItem('github_gist_token', token);
        } else {
            localStorage.removeItem('github_gist_token');
        }

        try {
            const gistId = await gistService.saveToGist(token, tournament, tournament.gistId);
            onSyncComplete(gistId);
            
            // Generate the link based on current location using URL API for robustness
            const url = new URL(window.location.href);
            url.search = `?data=${gistId}`;
            url.hash = ''; // Ensure hash doesn't interfere
            setGeneratedLink(url.toString());
        } catch (err: any) {
            setError(err.message || 'An error occurred while syncing.');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generatedLink);
        alert('Link copied to clipboard!');
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-700 animate-fade-in">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Sync to Cloud (GitHub)</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                
                <div className="p-6 space-y-4">
                    {!generatedLink ? (
                        <>
                             <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-600 text-sm space-y-3">
                                <p className="font-bold text-gray-200">Instructions:</p>
                                <ol className="list-decimal list-inside text-gray-400 space-y-2">
                                    <li>
                                        <a 
                                            href="https://github.com/settings/tokens/new?scopes=gist&description=Tournament+Manager+Sync" 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="text-brand-primary hover:text-brand-secondary underline font-medium"
                                        >
                                            Click here to get a GitHub Token
                                        </a>
                                        <span className="block text-xs text-gray-500 ml-4 mt-1">Login to GitHub, scroll to bottom, click "Generate token".</span>
                                    </li>
                                    <li>Copy the token (starts with <code className="bg-gray-800 px-1 rounded">ghp_</code>).</li>
                                    <li>Paste it in the box below.</li>
                                </ol>
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Paste Token Here</label>
                                <input 
                                    type="password" 
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    placeholder="ghp_xxxxxxxxxxxx"
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-brand-primary focus:border-brand-primary"
                                />
                            </div>
                            <div className="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="saveToken" 
                                    checked={saveToken} 
                                    onChange={(e) => setSaveToken(e.target.checked)}
                                    className="h-4 w-4 text-brand-primary bg-gray-700 border-gray-600 rounded focus:ring-brand-primary"
                                />
                                <label htmlFor="saveToken" className="ml-2 text-sm text-gray-400">Remember my token</label>
                            </div>

                            {error && <p className="text-red-400 text-sm bg-red-900/20 p-2 rounded border border-red-800">{error}</p>}
                            
                            <button 
                                onClick={handleSync} 
                                disabled={loading}
                                className="w-full py-2 px-4 bg-brand-primary hover:bg-brand-secondary text-white rounded-md font-medium transition-colors disabled:opacity-50 flex justify-center"
                            >
                                {loading ? (
                                    <span className="flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Syncing...
                                    </span>
                                ) : 'Sync & Generate Link'}
                            </button>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-green-900/30 border border-green-600/50 p-3 rounded-md text-center">
                                <p className="text-green-400 font-bold text-lg">Sync Successful!</p>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Shareable Public Link</label>
                                <div className="flex gap-2">
                                    <input 
                                        readOnly
                                        value={generatedLink}
                                        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-md text-gray-300 text-sm"
                                    />
                                    <button onClick={copyToClipboard} className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md text-sm">
                                        Copy
                                    </button>
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 bg-gray-900 p-3 rounded space-y-2">
                                <p>✅ <strong>Send this link</strong> to players. They will see the live tournament.</p>
                                <p>🔄 <strong>To Update Scores:</strong> Just make changes and click "Cloud Sync" &gt; "Sync Again". No need to send a new link.</p>
                            </div>
                            <button 
                                onClick={() => { setGeneratedLink(''); }}
                                className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-white border border-gray-600 rounded hover:bg-gray-700"
                            >
                                Sync Again (Update Data)
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ShareModal;
