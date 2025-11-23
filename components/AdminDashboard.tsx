
import React, { useState } from 'react';
import { Tournament } from '../types';
import TournamentSetup from './admin/TournamentSetup';
import PlayerManagement from './admin/PlayerManagement';
import FixtureManagement from './admin/FixtureManagement';
import ShareModal from './ShareModal';

interface AdminDashboardProps {
    tournament: Tournament;
    setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
    onBack: () => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ tournament, setTournament, onBack }) => {
    const [activeTab, setActiveTab] = useState('setup');
    const [showShareModal, setShowShareModal] = useState(false);

    const handlePublish = () => {
        if (publishDisabledReason) {
            alert(`Cannot publish: ${publishDisabledReason}`);
            return;
        }

        setTournament(prev => ({ ...prev, status: 'Publishing' }));

        setTimeout(() => {
            setTournament(prev => ({
                ...prev,
                isPublished: true,
                status: 'Published'
            }));
            alert('Tournament has been published successfully!');
        }, 1500);
    };
    
    const exportToCsv = (data: any[], filename: string) => {
        if (data.length === 0) return;
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportPlayersData = () => {
        const data = tournament.players.map(p => ({
            PlayerID: p.id,
            Name: p.name,
            MobileNumber: p.mobileNumber,
            Category1: p.categories[0] || '',
            Category2: p.categories[1] || '',
            FeePaid: p.feePaid ? 'Yes' : 'No'
        }));
        exportToCsv(data, 'players_data.csv');
    };

    const exportFixturesData = () => {
        const data: any[] = [];
        const playerMap = new Map(tournament.players.map(p => [p.id, p.name]));
        tournament.fixtures.forEach(f => {
            f.groups.forEach(g => {
                const playersInGroup = g.playerIds.map(id => playerMap.get(id) || id).join(' | ');
                data.push({
                    Category: f.category,
                    Type: f.type,
                    Group: g.name,
                    Players: playersInGroup
                });
            });
        });
        exportToCsv(data, 'fixtures_data.csv');
    };

    const exportMatchResultsData = () => {
        const data: any[] = [];
        const playerMap = new Map(tournament.players.map(p => [p.id, p.name]));
        tournament.fixtures.forEach(f => {
            f.groups.forEach(g => {
                g.matches.forEach(m => {
                    const p1Id = m.player1Id;
                    const p2Id = m.player2Id;
                    const p1Name = p1Id ? playerMap.get(p1Id) : null;
                    const p2Name = p2Id ? playerMap.get(p2Id) : null;

                    data.push({
                        Category: f.category,
                        Type: f.type,
                        Group: g.name,
                        Player1: p1Name || 'N/A',
                        Player2: p2Name || 'N/A',
                        ScoreP1: m.scoreP1 ?? '',
                        ScoreP2: m.scoreP2 ?? '',
                        Status: m.status
                    });
                });
            });
        });
        exportToCsv(data, 'match_results.csv');
    };

    const handleSyncComplete = (gistId: string) => {
        setTournament(prev => ({ ...prev, gistId }));
    };

    const publishDisabledReason = (() => {
        if (!tournament.settings.name) return "Tournament name is not set.";
        if (tournament.settings.types.length === 0) return "No tournament types selected.";
        if (tournament.settings.categories.length === 0) return "No player categories selected.";
        if (tournament.players.length === 0) return "No players have been registered.";
        if (tournament.fixtures.length === 0) return "No fixtures have been generated.";
        return null;
    })();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
                <button onClick={onBack} className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                    &larr; Back to Tournament List
                </button>
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-white hidden md:block">
                        {tournament.settings.name || 'New Tournament'}
                    </h2>
                    <button 
                        onClick={() => setShowShareModal(true)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm rounded-md transition-colors border border-indigo-500 shadow-md"
                    >
                        ☁ Cloud Sync & Share
                    </button>
                </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="border-b border-gray-700 md:border-b-0 w-full md:w-auto overflow-x-auto">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActiveTab('setup')} className={`${activeTab === 'setup' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Tournament Setup</button>
                        <button onClick={() => setActiveTab('players')} className={`${activeTab === 'players' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Player Management</button>
                        <button onClick={() => setActiveTab('fixtures')} className={`${activeTab === 'fixtures' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>Fixture & Score Management</button>
                    </nav>
                </div>
                 <div className="relative group">
                    <button
                        onClick={handlePublish}
                        disabled={!!publishDisabledReason || tournament.status === 'Publishing'}
                        className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed"
                    >
                        {tournament.status === 'Publishing' ? 'Publishing...' : 'Publish Tournament'}
                    </button>
                    {publishDisabledReason && (
                        <div className="absolute bottom-full mb-2 w-72 p-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none right-0">
                            {publishDisabledReason}
                        </div>
                    )}
                </div>
            </div>

            <div>
                {activeTab === 'setup' && <TournamentSetup settings={tournament.settings} tournamentId={tournament.id} setTournament={setTournament} />}
                {activeTab === 'players' && <PlayerManagement tournament={tournament} setTournament={setTournament} />}
                {activeTab === 'fixtures' && <FixtureManagement tournament={tournament} setTournament={setTournament} />}
            </div>

            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-xl font-bold mb-4">Data Export</h2>
                <div className="flex flex-wrap gap-4">
                     <button onClick={exportPlayersData} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">Export Players (CSV)</button>
                     <button onClick={exportFixturesData} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">Export Fixtures (CSV)</button>
                     <button onClick={exportMatchResultsData} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium">Export Match Results (CSV)</button>
                </div>
            </div>
            
            {showShareModal && (
                <ShareModal 
                    tournament={tournament} 
                    onClose={() => setShowShareModal(false)} 
                    onSyncComplete={handleSyncComplete}
                />
            )}
        </div>
    );
};

export default AdminDashboard;
