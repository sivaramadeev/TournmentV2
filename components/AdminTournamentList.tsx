
import React, { useState, useRef } from 'react';
import { Tournament } from '../types';
import { DeleteIcon, EditIcon, CheckCircleIcon } from './icons';

interface AdminTournamentListProps {
    tournaments: Tournament[];
    onCreate: (name: string) => void;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onImport: (data: Tournament[], mode: 'merge' | 'replace') => void;
}

const AdminTournamentList: React.FC<AdminTournamentListProps> = ({ tournaments, onCreate, onSelect, onDelete, onImport }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newTournamentName, setNewTournamentName] = useState('');

    // Import Modal State
    const [isImportModalOpen, setImportModalOpen] = useState(false);
    const [importLogs, setImportLogs] = useState<string[]>([]);
    const [pendingData, setPendingData] = useState<Tournament[] | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newTournamentName.trim()) {
            onCreate(newTournamentName.trim());
            setNewTournamentName('');
            setIsCreating(false);
        }
    };

    const handleExportAll = () => {
        const dataStr = JSON.stringify(tournaments, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `tournament_manager_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const addLog = (msg: string) => setImportLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const processImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportLogs([]);
        setPendingData(null);
        addLog(`Reading file: ${file.name} (${(file.size / 1024).toFixed(2)} KB)...`);

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                addLog('File read successful. Parsing JSON...');
                const rawData = event.target?.result as string;
                const json = JSON.parse(rawData);

                if (!Array.isArray(json)) {
                    addLog('Error: Root element is not an array.');
                    alert('Invalid file format. Expected a JSON array of tournaments.');
                    return;
                }

                addLog(`JSON Parsed. Found ${json.length} items. Validating structure...`);
                
                // Basic validation
                const validTournaments = json.filter((t: any) => {
                    return t && typeof t === 'object' && t.id && t.settings && Array.isArray(t.players);
                });

                if (validTournaments.length === 0) {
                    addLog('Error: No valid tournament data found in file.');
                    return;
                }

                if (validTournaments.length < json.length) {
                    addLog(`Warning: Skipped ${json.length - validTournaments.length} invalid items.`);
                }

                addLog(`Validation Complete. ${validTournaments.length} valid tournaments ready to restore.`);
                setPendingData(validTournaments as Tournament[]);

            } catch (err) {
                addLog(`Error: Failed to parse JSON. ${(err as Error).message}`);
                console.error(err);
            }
        };
        reader.onerror = () => {
            addLog('Error: Failed to read file.');
        };
        reader.readAsText(file);
    };

    const confirmImport = (mode: 'merge' | 'replace') => {
        if (pendingData) {
            onImport(pendingData, mode);
            setImportModalOpen(false);
            setPendingData(null);
            setImportLogs([]);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-3xl font-bold text-white">Your Tournaments</h2>
                <div className="flex gap-3">
                     <button
                        onClick={handleExportAll}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md font-medium transition-colors text-sm border border-gray-600"
                        title="Download a backup of all tournament data"
                    >
                        ⬇ Backup Data
                    </button>
                    <button
                        onClick={() => setImportModalOpen(true)}
                        className="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-md font-medium transition-colors text-sm border border-gray-600"
                        title="Restore data from a backup file"
                    >
                        ⬆ Restore Data
                    </button>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-md font-medium transition-colors"
                    >
                        + Create New Tournament
                    </button>
                </div>
            </div>

            {isCreating && (
                <div className="bg-gray-800 p-6 rounded-lg shadow-lg border border-gray-700 animate-fade-in">
                    <h3 className="text-xl font-semibold mb-4">New Tournament Details</h3>
                    <form onSubmit={handleCreateSubmit} className="flex gap-4">
                        <input
                            type="text"
                            value={newTournamentName}
                            onChange={(e) => setNewTournamentName(e.target.value)}
                            placeholder="Enter Tournament Name (e.g. Winter Cup 2024)"
                            className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary text-white"
                            autoFocus
                        />
                        <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md">Create & Setup</button>
                        <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Cancel</button>
                    </form>
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {tournaments.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">
                        <p className="text-gray-400 text-lg mb-4">No tournaments found.</p>
                        <p className="text-sm text-gray-500">Create a new one or Import a backup file to get started.</p>
                    </div>
                ) : (
                    tournaments.map(t => (
                        <div key={t.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 hover:border-gray-500 transition-all overflow-hidden flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="text-xl font-bold text-white truncate" title={t.settings.name || 'Untitled'}>
                                        {t.settings.name || 'Untitled Tournament'}
                                    </h3>
                                    {t.isPublished ? (
                                        <span className="bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                            <CheckCircleIcon className="w-3 h-3" /> Published
                                        </span>
                                    ) : (
                                        <span className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded-full">Draft</span>
                                    )}
                                </div>
                                <div className="space-y-2 text-sm text-gray-400">
                                    <p>Created: {new Date(t.createdAt).toLocaleDateString()}</p>
                                    <p>Players: {t.players.length}</p>
                                    <p>Fixtures: {t.fixtures.length} Categories</p>
                                </div>
                            </div>
                            <div className="bg-gray-750 bg-gray-900/30 p-4 flex justify-between border-t border-gray-700">
                                <button
                                    onClick={() => onSelect(t.id)}
                                    className="flex items-center gap-2 text-brand-primary hover:text-white transition-colors font-medium"
                                >
                                    <EditIcon className="w-4 h-4" /> Manage
                                </button>
                                <button
                                    onClick={() => onDelete(t.id)}
                                    className="flex items-center gap-2 text-red-400 hover:text-red-300 transition-colors font-medium"
                                >
                                    <DeleteIcon className="w-4 h-4" /> Delete
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Restore Data Modal */}
            {isImportModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg border border-gray-700 flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white">Restore Data</h3>
                            <button onClick={() => setImportModalOpen(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1 space-y-4">
                            {!pendingData ? (
                                <div className="space-y-4">
                                    <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center bg-gray-700/30">
                                        <p className="text-gray-300 mb-2">Select a JSON backup file to restore</p>
                                        <input 
                                            type="file" 
                                            accept=".json" 
                                            ref={fileInputRef}
                                            onChange={processImportFile}
                                            className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-secondary cursor-pointer"
                                        />
                                    </div>
                                    {importLogs.length > 0 && (
                                        <div className="bg-black/50 p-3 rounded text-xs font-mono text-green-400 h-32 overflow-y-auto">
                                            {importLogs.map((log, i) => <div key={i}>{log}</div>)}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                     <div className="bg-black/50 p-3 rounded text-xs font-mono text-green-400 h-32 overflow-y-auto">
                                        {importLogs.map((log, i) => <div key={i}>{log}</div>)}
                                    </div>
                                    <div className="bg-brand-primary/20 border border-brand-primary p-4 rounded-md">
                                        <p className="text-white font-medium">Ready to restore {pendingData.length} tournaments.</p>
                                        <p className="text-sm text-gray-300 mt-1">Choose how you want to proceed:</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button 
                                            onClick={() => confirmImport('merge')}
                                            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors text-sm"
                                        >
                                            Merge with Existing
                                            <span className="block text-xs font-normal opacity-75 mt-1">Keep current & add missing</span>
                                        </button>
                                        <button 
                                            onClick={() => confirmImport('replace')}
                                            className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium transition-colors text-sm"
                                        >
                                            Replace All
                                            <span className="block text-xs font-normal opacity-75 mt-1">Delete current & use backup</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminTournamentList;
