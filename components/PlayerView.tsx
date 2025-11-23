
import React, { useState, useMemo } from 'react';
import { Tournament, MatchStatus } from '../types';
import { CheckCircleIcon } from './icons';

interface PlayerViewProps {
    tournament: Tournament;
    onBack: () => void;
}

const getStatusStyles = (status: MatchStatus) => {
    switch (status) {
        case MatchStatus.Completed:
            return {
                row: 'border-l-4 border-green-500 bg-green-900/20',
                tag: 'bg-green-500/20 text-green-300',
                icon: <CheckCircleIcon className="w-5 h-5 text-green-400" />,
            };
        case MatchStatus.WalkoverP1:
        case MatchStatus.WalkoverP2:
            return {
                row: 'border-l-4 border-yellow-500 bg-yellow-900/20',
                tag: 'bg-yellow-500/20 text-yellow-300',
                icon: null,
            };
        case MatchStatus.Disqualified:
            return {
                row: 'border-l-4 border-red-500 bg-red-900/20',
                tag: 'bg-red-500/20 text-red-300',
                icon: null,
            };
        case MatchStatus.InProgress:
            return {
                row: 'border-l-4 border-blue-500',
                tag: 'bg-blue-500/20 text-blue-300 animate-pulse',
                icon: null,
            };
        default:
            return { row: '', tag: 'bg-gray-600/20 text-gray-400', icon: null };
    }
};

const PlayerView: React.FC<PlayerViewProps> = ({ tournament, onBack }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPlayerCategory, setSelectedPlayerCategory] = useState('All');
    const [selectedFixtureCategory, setSelectedFixtureCategory] = useState('All');
    const [selectedGroup, setSelectedGroup] = useState('All');

    const playerMap = useMemo(() => new Map(tournament.players.map(p => [p.id, p])), [tournament.players]);

    const filteredAndSortedPlayers = useMemo(() => {
        return tournament.players
            .filter(player => {
                const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) || player.mobileNumber.includes(searchTerm);
                const matchesCategory = selectedPlayerCategory === 'All' || player.categories.includes(selectedPlayerCategory);
                return matchesSearch && matchesCategory;
            })
            .sort((a, b) => {
                // Sort by name for public view since mobile is hidden
                return a.name.localeCompare(b.name);
            });
    }, [tournament.players, searchTerm, selectedPlayerCategory]);
    
    const filteredFixtures = useMemo(() => {
        let fixtures = tournament.fixtures;
        if (selectedFixtureCategory !== 'All') {
            fixtures = fixtures.filter(f => f.category === selectedFixtureCategory);
        }
        if (selectedGroup !== 'All') {
            fixtures = fixtures.map(f => ({
                ...f,
                groups: f.groups.filter(g => g.name === selectedGroup)
            })).filter(f => f.groups.length > 0);
        }
        return fixtures;
    }, [tournament.fixtures, selectedFixtureCategory, selectedGroup]);
    
    const availableGroups = useMemo(() => {
        if (selectedFixtureCategory === 'All') return [];
        const fixture = tournament.fixtures.find(f => f.category === selectedFixtureCategory);
        return fixture ? fixture.groups.map(g => g.name) : [];
    }, [tournament.fixtures, selectedFixtureCategory]);


    if (!tournament.isPublished) {
        return (
            <div className="text-center p-10 bg-gray-800 rounded-lg">
                <button onClick={onBack} className="mb-6 text-sm text-gray-400 hover:text-white">&larr; Back to Hub</button>
                <h2 className="text-3xl font-bold text-white mb-4">Tournament Not Yet Published</h2>
                <p className="text-gray-400">Please check back later. The administrator is still setting up the tournament.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-8 pb-24">
            <div className="relative">
                <button onClick={onBack} className="absolute top-0 left-0 text-sm text-gray-400 hover:text-white flex items-center gap-1">
                    &larr; Back to Hub
                </button>
                <h1 className="text-4xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary pt-8 md:pt-0">{tournament.settings.name}</h1>
            </div>

            <div className="grid md:grid-cols-2 gap-4 text-center">
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-bold text-lg">Event Types</h3>
                    <p className="text-gray-400">{tournament.settings.types.join(', ')}</p>
                </div>
                 <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="font-bold text-lg">Player Categories</h3>
                    <p className="text-gray-400">{tournament.settings.categories.join(', ')}</p>
                </div>
            </div>

            {/* Registered Players */}
            <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Registered Players</h2>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <input
                        type="text"
                        placeholder="Search by name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    />
                    <select
                        value={selectedPlayerCategory}
                        onChange={(e) => setSelectedPlayerCategory(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="All">All Categories</option>
                        {tournament.settings.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-700">
                        <thead className="bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Categories</th>
                            </tr>
                        </thead>
                        <tbody className="bg-gray-800 divide-y divide-gray-700">
                            {filteredAndSortedPlayers.map((player) => {
                                return (
                                    <tr key={player.id}>
                                        <td className="px-6 py-4 whitespace-nowrap">{player.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{player.categories.join(', ')}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </section>
            
            {/* Fixtures */}
            <section className="bg-gray-800 p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Match Fixtures & Results</h2>
                 <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <select
                        value={selectedFixtureCategory}
                        onChange={(e) => {
                            setSelectedFixtureCategory(e.target.value)
                            setSelectedGroup('All')
                        }}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary"
                    >
                        <option value="All">All Categories</option>
                        {tournament.settings.categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <select
                        value={selectedGroup}
                        onChange={(e) => setSelectedGroup(e.target.value)}
                        disabled={selectedFixtureCategory === 'All'}
                        className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary disabled:opacity-50"
                    >
                        <option value="All">All Groups</option>
                         {availableGroups.map(group => <option key={group} value={group}>{group}</option>)}
                    </select>
                </div>
                <div className="space-y-6">
                    {filteredFixtures.length === 0 ? (
                        <p className="text-gray-400 text-center py-4">No fixtures found for the selected filters.</p>
                    ) : (
                        filteredFixtures.map(fixture => (
                            <div key={`${fixture.category}-${fixture.type}`}>
                                 <h3 className="text-xl font-semibold my-4">{fixture.category} - {fixture.type}</h3>
                                 {fixture.groups.map(group => (
                                    <div key={group.id} className="mb-6">
                                        <h4 className="text-lg font-bold p-2 bg-gray-700/50 rounded-t-md">{group.name}</h4>
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-700">
                                                <thead className="bg-gray-700/50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Player 1</th>
                                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Player 2</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Score</th>
                                                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-gray-800 divide-y divide-gray-700">
                                                    {group.matches.map(match => {
                                                        const styles = getStatusStyles(match.status);
                                                        const p1Id = match.player1Id;
                                                        const p2Id = match.player2Id;
                                                        const player1 = p1Id ? playerMap.get(p1Id) : undefined;
                                                        const player2 = p2Id ? playerMap.get(p2Id) : undefined;
                                                        
                                                        const isCompleted = match.status === MatchStatus.Completed || match.status.startsWith('Walkover') || match.status === MatchStatus.Disqualified;

                                                        return (
                                                            <tr key={match.id} className={styles.row}>
                                                                <td className="px-4 py-4 whitespace-nowrap">{player1?.name || 'N/A'}</td>
                                                                <td className="px-4 py-4 whitespace-nowrap">{player2?.name || 'N/A'}</td>
                                                                <td className="px-4 py-4 text-center whitespace-nowrap font-mono">{isCompleted ? `${match.scoreP1} - ${match.scoreP2}` : 'N/A'}</td>
                                                                <td className="px-4 py-4 text-center whitespace-nowrap">
                                                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles.tag}`}>
                                                                        {match.status}
                                                                    </span>
                                                                    {styles.icon && <div className="inline-block ml-2 align-middle">{styles.icon}</div>}
                                                                </td>
                                                            </tr>
                                                        )
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                 ))}
                            </div>
                        ))
                    )}
                </div>
            </section>
        </div>
    );
};

export default PlayerView;
