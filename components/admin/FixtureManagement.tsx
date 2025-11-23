
import React, { useState, useMemo, useEffect } from 'react';
import { Tournament, MatchStatus, Match, MatchHistoryEntry, Player, CategoryFixture } from '../../types';
import { HistoryIcon, DeleteIcon, CheckCircleIcon } from '../icons';

interface FixtureManagementProps {
    tournament: Tournament;
    setTournament: React.Dispatch<React.SetStateAction<Tournament>>;
}

const HistoryModal: React.FC<{ history: MatchHistoryEntry[], onClose: () => void }> = ({ history, onClose }) => (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-gray-700">
                <h3 className="text-lg font-bold">Match History</h3>
            </div>
            <div className="p-4 overflow-y-auto">
                <div className="space-y-4">
                    {history.length > 0 ? history.map((entry, index) => (
                        <div key={index} className="p-3 bg-gray-700/50 rounded-md text-sm">
                            <p><strong>Timestamp:</strong> {new Date(entry.timestamp).toLocaleString()}</p>
                            <p><strong>Changed By:</strong> {entry.changedBy}</p>
                            <p><strong>Old State:</strong> Score {entry.oldState.scoreP1}-{entry.oldState.scoreP2}, Status: {entry.oldState.status}</p>
                            <p><strong>New State:</strong> Score {entry.newState.scoreP1}-{entry.newState.scoreP2}, Status: {entry.newState.status}</p>
                            <p><strong>Reason:</strong> {entry.reason}</p>
                        </div>
                    )) : <p>No history for this match.</p>}
                </div>
            </div>
            <div className="p-4 border-t border-gray-700 text-right">
                <button onClick={onClose} className="px-4 py-2 bg-brand-primary text-white rounded-md">Close</button>
            </div>
        </div>
    </div>
);

const FixtureManagement: React.FC<FixtureManagementProps> = ({ tournament, setTournament }) => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedType, setSelectedType] = useState('');
    const [fixtureFormat, setFixtureFormat] = useState<'RoundRobin' | 'Knockout'>('RoundRobin');
    const [historyModalMatch, setHistoryModalMatch] = useState<Match | null>(null);

    // Load saved configuration
    useEffect(() => {
        const key = `autosave_fixture_config_${tournament.id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
            try {
                const { cat, type, format } = JSON.parse(saved);
                // Verify if category/type still exist in settings
                if (tournament.settings.categories.includes(cat)) setSelectedCategory(cat);
                if (tournament.settings.types.includes(type)) setSelectedType(type);
                if (format) setFixtureFormat(format);
            } catch (e) {}
        }
    }, [tournament.id, tournament.settings]);

    // Save configuration
    useEffect(() => {
        const key = `autosave_fixture_config_${tournament.id}`;
        localStorage.setItem(key, JSON.stringify({
            cat: selectedCategory,
            type: selectedType,
            format: fixtureFormat
        }));
    }, [selectedCategory, selectedType, fixtureFormat, tournament.id]);

    const playerMap = useMemo(() => new Map(tournament.players.map(p => [p.id, p])), [tournament.players]);

    const existingFixture = useMemo(() => {
        return tournament.fixtures.find(f => f.category === selectedCategory && f.type === selectedType);
    }, [tournament.fixtures, selectedCategory, selectedType]);

    // --- HELPER: Generate Knockout Bracket ---
    const generateKnockoutBracket = (players: Player[]): Match[] => {
        const playerCount = players.length;
        // Find next power of 2 (e.g., 9 -> 16)
        const bracketSize = Math.pow(2, Math.ceil(Math.log2(playerCount)));
        const totalRounds = Math.log2(bracketSize);
        const matches: Match[] = [];
        
        // Shuffle players
        const shuffledPlayers = [...players].sort(() => 0.5 - Math.random());
        
        // Create Slots (Players + Byes)
        // A "Bye" is represented as null in this temporary array
        const slots: (string | null)[] = new Array(bracketSize).fill(null);
        
        // Place players in slots. 
        // Strategy: Fill slots 0 to N-1 with players. The rest are Byes.
        // (Random shuffle above handles the "randomness" of who gets a bye if we fill linearly)
        for (let i = 0; i < playerCount; i++) {
            slots[i] = shuffledPlayers[i].id;
        }

        // We need to generate matches round by round, starting from the LAST round (Finals) back to Round 1
        // or create them all and link them. Let's create by Level.
        
        // Helper to get Round Name
        const getRoundName = (roundIndex: number, total: number) => {
            const roundsFromFinal = total - 1 - roundIndex;
            if (roundsFromFinal === 0) return 'Final';
            if (roundsFromFinal === 1) return 'Semi Final';
            if (roundsFromFinal === 2) return 'Quarter Final';
            return `Round of ${Math.pow(2, roundsFromFinal + 1)}`;
        };

        const roundMatches: Match[][] = [];

        // Generate empty matches for all rounds
        let numMatchesInRound = bracketSize / 2;
        for (let r = 0; r < totalRounds; r++) {
            const currentRoundMatches: Match[] = [];
            for (let m = 0; m < numMatchesInRound; m++) {
                currentRoundMatches.push({
                    id: `ko-match-${Date.now()}-r${r}-m${m}`,
                    player1Id: null,
                    player2Id: null,
                    scoreP1: null,
                    scoreP2: null,
                    status: MatchStatus.Scheduled,
                    history: [],
                    roundName: getRoundName(r, totalRounds)
                });
            }
            roundMatches.push(currentRoundMatches);
            numMatchesInRound /= 2;
        }

        // Link Matches (Next Match ID)
        for (let r = 0; r < totalRounds - 1; r++) {
            for (let m = 0; m < roundMatches[r].length; m++) {
                const nextRoundMatchIndex = Math.floor(m / 2);
                const nextRoundMatch = roundMatches[r + 1][nextRoundMatchIndex];
                const currentMatch = roundMatches[r][m];
                
                currentMatch.nextMatchId = nextRoundMatch.id;
                currentMatch.nextMatchPlayerIndex = (m % 2) as 0 | 1;
            }
        }

        // Fill Round 1 (The first array in roundMatches) with players/byes
        const round1 = roundMatches[0];
        for (let i = 0; i < round1.length; i++) {
            const player1Id = slots[i * 2];
            const player2Id = slots[i * 2 + 1];

            round1[i].player1Id = player1Id;
            round1[i].player2Id = player2Id;

            // Handle BYES immediately
            if (player1Id && !player2Id) {
                // Player 1 gets a bye
                round1[i].status = MatchStatus.Completed; // Auto complete
                round1[i].scoreP1 = 1; // Dummy score
                round1[i].scoreP2 = 0;
                // We need to advance them immediately logic is in the main handler, 
                // but since we are generating, we can pre-fill the next round
                if (round1[i].nextMatchId) {
                    const nextMatch = roundMatches[1].find(m => m.id === round1[i]!.nextMatchId);
                    if (nextMatch) {
                        if (round1[i].nextMatchPlayerIndex === 0) nextMatch.player1Id = player1Id;
                        else nextMatch.player2Id = player1Id;
                    }
                }
            } else if (!player1Id && player2Id) {
                // Player 2 gets a bye (Unlikely with linear fill, but for safety)
                round1[i].status = MatchStatus.Completed;
                round1[i].scoreP1 = 0;
                round1[i].scoreP2 = 1;
                if (round1[i].nextMatchId) {
                    const nextMatch = roundMatches[1].find(m => m.id === round1[i]!.nextMatchId);
                    if (nextMatch) {
                        if (round1[i].nextMatchPlayerIndex === 0) nextMatch.player1Id = player2Id;
                        else nextMatch.player2Id = player2Id;
                    }
                }
            } else if (!player1Id && !player2Id) {
                // Double Bye (Empty slot vs Empty slot) - rare unless player count is very low compared to bracket
                 round1[i].status = MatchStatus.Completed;
            }
        }

        // Flatten matches array
        roundMatches.forEach(round => matches.push(...round));
        return matches;
    };

    const handleGenerateFixtures = () => {
        if (!selectedCategory || !selectedType) {
            alert('Please select a category and type to generate fixtures.');
            return;
        }

        if (existingFixture) {
            if (!window.confirm(`Fixtures already exist for ${selectedCategory} - ${selectedType}. \n\nWARNING: Regenerating will DELETE all existing matches and scores for this category. \n\nDo you want to continue?`)) {
                return;
            }
        }

        const playersInCategory = tournament.players.filter(p => p.categories.includes(selectedCategory));
        
        // --- VALIDATION ---
        if (fixtureFormat === 'RoundRobin') {
            if (playersInCategory.length < 4) {
                alert(`Insufficient players for Round Robin. Found ${playersInCategory.length}, but minimum 4 are required.`);
                return;
            }
        } else {
            // Knockout Validation
            if (playersInCategory.length < 8) {
                 if (!window.confirm(`Knockout rounds usually require at least 8 players (Quarter Finals). You only have ${playersInCategory.length}. \n\nDo you want to proceed anyway? (This will create many Byes)`)) {
                    return;
                 }
            }
        }

        let newCategoryFixture: CategoryFixture;

        if (fixtureFormat === 'RoundRobin') {
            // Shuffle players
            let shuffledPlayers = [...playersInCategory].sort(() => 0.5 - Math.random());
            const totalPlayers = shuffledPlayers.length;

            const minGroupSize = 4;
            const maxGroupSize = 6;
            const minGroups = Math.ceil(totalPlayers / maxGroupSize);
            const maxGroups = Math.floor(totalPlayers / minGroupSize);

            if (minGroups > maxGroups) {
                alert(`Cannot evenly distribute ${totalPlayers} players into groups of size 4 to 6. Please add or remove players.`);
                return;
            }

            const numGroups = maxGroups; 
            const baseSize = Math.floor(totalPlayers / numGroups);
            const remainder = totalPlayers % numGroups;

            const groups: { name: string, players: Player[] }[] = [];
            let startIndex = 0;

            for (let i = 0; i < numGroups; i++) {
                const size = i < remainder ? baseSize + 1 : baseSize;
                const groupPlayers = shuffledPlayers.slice(startIndex, startIndex + size);
                startIndex += size;

                groups.push({
                    name: `Group ${String.fromCharCode(65 + i)}`,
                    players: groupPlayers,
                });
            }

            newCategoryFixture = {
                category: selectedCategory,
                type: selectedType,
                format: 'RoundRobin',
                groups: groups.map(group => {
                    const matches: Match[] = [];
                    for (let i = 0; i < group.players.length; i++) {
                        for (let j = i + 1; j < group.players.length; j++) {
                            matches.push({
                                id: `match-${Date.now()}-${group.name}-${i}-${j}`,
                                player1Id: group.players[i].id,
                                player2Id: group.players[j].id,
                                scoreP1: null,
                                scoreP2: null,
                                status: MatchStatus.Scheduled,
                                history: [],
                            });
                        }
                    }
                    return { id: `group-${Date.now()}-${group.name}`, name: group.name, playerIds: group.players.map(p => p.id), matches };
                }),
                knockoutMatches: []
            };

        } else {
            // KNOCKOUT GENERATION
            const knockoutMatches = generateKnockoutBracket(playersInCategory);
            newCategoryFixture = {
                category: selectedCategory,
                type: selectedType,
                format: 'Knockout',
                groups: [],
                knockoutMatches: knockoutMatches
            };
        }

        setTournament(prev => {
            const otherFixtures = prev.fixtures.filter(f => !(f.category === selectedCategory && f.type === selectedType));
            return { ...prev, fixtures: [...otherFixtures, newCategoryFixture] };
        });
    };
    
    const handleDeleteFixtures = () => {
        if (!existingFixture) return;
        if (window.confirm(`Are you sure you want to delete fixtures for ${selectedCategory} - ${selectedType}? This cannot be undone.`)) {
            setTournament(prev => ({
                ...prev,
                fixtures: prev.fixtures.filter(f => !(f.category === selectedCategory && f.type === selectedType))
            }));
            alert('Fixtures deleted.');
        }
    };

    const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const customFixtures = JSON.parse(event.target?.result as string);
                setTournament(prev => ({ ...prev, fixtures: customFixtures }));
                alert('Custom fixtures uploaded successfully.');
            } catch (error) {
                alert('Invalid JSON file.');
                console.error(error);
            }
        };
        reader.readAsText(file);
    };

    // --- UPDATE LOGIC (Shared between RR and KO) ---
    const updateMatchInState = (matchId: string, updates: Partial<Match>, reason: string) => {
        setTournament(prev => {
            const newFixtures = prev.fixtures.map(f => {
                // Handle Groups (Round Robin)
                const updatedGroups = f.groups.map(g => ({
                    ...g,
                    matches: g.matches.map(m => {
                        if (m.id === matchId) {
                            const newHistoryEntry: MatchHistoryEntry = {
                                timestamp: new Date().toISOString(),
                                changedBy: 'admin',
                                oldState: { scoreP1: m.scoreP1, scoreP2: m.scoreP2, status: m.status },
                                newState: { scoreP1: updates.scoreP1 ?? m.scoreP1, scoreP2: updates.scoreP2 ?? m.scoreP2, status: updates.status ?? m.status },
                                reason,
                            };
                            return { ...m, ...updates, history: [...m.history, newHistoryEntry] };
                        }
                        return m;
                    })
                }));

                // Handle Knockout Matches
                let updatedKnockoutMatches = f.knockoutMatches || [];
                const targetMatchIndex = updatedKnockoutMatches.findIndex(m => m.id === matchId);
                
                if (targetMatchIndex !== -1) {
                    const m = updatedKnockoutMatches[targetMatchIndex];
                    const newHistoryEntry: MatchHistoryEntry = {
                        timestamp: new Date().toISOString(),
                        changedBy: 'admin',
                        oldState: { scoreP1: m.scoreP1, scoreP2: m.scoreP2, status: m.status },
                        newState: { scoreP1: updates.scoreP1 ?? m.scoreP1, scoreP2: updates.scoreP2 ?? m.scoreP2, status: updates.status ?? m.status },
                        reason,
                    };
                    const updatedMatch = { ...m, ...updates, history: [...m.history, newHistoryEntry] };
                    updatedKnockoutMatches = [...updatedKnockoutMatches];
                    updatedKnockoutMatches[targetMatchIndex] = updatedMatch;

                    // Check Auto-Advancement for Knockout
                    if (updatedMatch.status === MatchStatus.Completed && updatedMatch.nextMatchId) {
                        const winnerId = (updatedMatch.scoreP1! > updatedMatch.scoreP2!) ? updatedMatch.player1Id : updatedMatch.player2Id;
                        
                        // Find next match
                        const nextMatchIndex = updatedKnockoutMatches.findIndex(nm => nm.id === updatedMatch.nextMatchId);
                        if (nextMatchIndex !== -1 && winnerId) {
                            const nextMatch = { ...updatedKnockoutMatches[nextMatchIndex] };
                            if (updatedMatch.nextMatchPlayerIndex === 0) {
                                nextMatch.player1Id = winnerId;
                            } else {
                                nextMatch.player2Id = winnerId;
                            }
                            updatedKnockoutMatches[nextMatchIndex] = nextMatch;
                        }
                    }
                }

                return { ...f, groups: updatedGroups, knockoutMatches: updatedKnockoutMatches };
            });
            return { ...prev, fixtures: newFixtures };
        });
    };
    
    const handleStatusChange = (match: Match, newStatus: MatchStatus) => {
        let updates: Partial<Match> = { status: newStatus };
        if (newStatus === MatchStatus.WalkoverP1) {
            updates = { ...updates, scoreP1: 1, scoreP2: 0, status: MatchStatus.Completed };
        } else if (newStatus === MatchStatus.WalkoverP2) {
             updates = { ...updates, scoreP1: 0, scoreP2: 1, status: MatchStatus.Completed };
        } else if (newStatus === MatchStatus.Disqualified) {
             updates = { ...updates, scoreP1: 0, scoreP2: 0, status: MatchStatus.Completed };
        } else if (newStatus === MatchStatus.Scheduled || newStatus === MatchStatus.InProgress) {
            updates = { ...updates, scoreP1: null, scoreP2: null };
        } else if (newStatus === MatchStatus.Completed) {
             if (match.scoreP1 === null || match.scoreP2 === null) {
                alert('Please enter scores before marking a match as completed.');
                return;
            }
        }
        updateMatchInState(match.id, updates, `Status changed to ${newStatus}`);
    };
    
    const handleScoreChange = (matchId: string, player: 'P1' | 'P2', score: string) => {
        const scoreValue = score === '' ? null : parseInt(score, 10);
        if (scoreValue !== null && isNaN(scoreValue)) return;
        
        const field = player === 'P1' ? 'scoreP1' : 'scoreP2';
        updateMatchInState(matchId, { [field]: scoreValue }, `Score updated for ${player}`);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg space-y-6">
            <h2 className="text-xl font-bold">3. Fixture & Score Management</h2>

            <div className="p-4 border border-gray-700 rounded-md space-y-4 bg-gray-750">
                 <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Generate Fixtures</h3>
                 </div>
                 <div className="grid md:grid-cols-12 gap-4 items-end">
                    <div className="md:col-span-3">
                        <label className="block text-xs text-gray-400 mb-1">Category</label>
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            <option value="">-- Select --</option>
                            {tournament.settings.categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-3">
                         <label className="block text-xs text-gray-400 mb-1">Event Type</label>
                         <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white">
                            <option value="">-- Select --</option>
                            {tournament.settings.types.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div className="md:col-span-3">
                         <label className="block text-xs text-gray-400 mb-1">Format</label>
                         <div className="flex rounded-md shadow-sm" role="group">
                            <button 
                                type="button" 
                                onClick={() => setFixtureFormat('RoundRobin')}
                                className={`px-3 py-2 text-xs font-medium border border-gray-600 rounded-l-lg ${fixtureFormat === 'RoundRobin' ? 'bg-brand-primary text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                            >
                                Groups
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setFixtureFormat('Knockout')}
                                className={`px-3 py-2 text-xs font-medium border border-gray-600 rounded-r-lg ${fixtureFormat === 'Knockout' ? 'bg-brand-primary text-white' : 'bg-gray-700 text-gray-200 hover:bg-gray-600'}`}
                            >
                                Knockout
                            </button>
                        </div>
                    </div>
                    <div className="md:col-span-3 flex gap-2">
                         <button 
                            onClick={handleGenerateFixtures} 
                            disabled={!selectedCategory || !selectedType}
                            className={`flex-1 px-4 py-2 rounded-md text-white font-medium transition-colors ${existingFixture ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-brand-primary hover:bg-brand-secondary'} disabled:bg-gray-600 disabled:cursor-not-allowed`}
                         >
                             {existingFixture ? 'Re-generate' : 'Generate'}
                         </button>
                         {existingFixture && (
                            <button 
                                onClick={handleDeleteFixtures}
                                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md"
                                title="Delete these fixtures"
                            >
                                <DeleteIcon className="w-5 h-5"/>
                            </button>
                         )}
                    </div>
                </div>
                
                {selectedCategory && selectedType && (
                    <div className="text-sm mt-2">
                        Status: {existingFixture 
                            ? <span className="text-green-400 font-medium flex items-center gap-1 inline-block"><CheckCircleIcon className="w-4 h-4 inline"/> {existingFixture.format || 'Generated'} Fixtures ({existingFixture.format === 'Knockout' ? `${existingFixture.knockoutMatches?.length} Matches` : `${existingFixture.groups.length} Groups`})</span> 
                            : <span className="text-gray-400">Not generated yet</span>
                        }
                    </div>
                )}

                 <div className="pt-4 border-t border-gray-700 mt-4">
                     <label htmlFor="json-upload" className="block text-sm font-medium text-gray-300 mb-2">Or Upload Custom Fixtures (JSON)</label>
                     <input id="json-upload" type="file" accept=".json" onChange={handleJsonUpload} className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-brand-primary/20 file:text-brand-primary hover:file:bg-brand-primary/30"/>
                 </div>
            </div>

            <div className="space-y-8">
                {tournament.fixtures.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No fixtures available yet. Select a category above to generate them.</p>
                ) : (
                    tournament.fixtures.map(fixture => (
                        <div key={`${fixture.category}-${fixture.type}`} className="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
                            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-xl font-bold text-brand-primary">{fixture.category} - {fixture.type}</h3>
                                    <span className="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{fixture.format || 'Round Robin'}</span>
                                </div>
                            </div>
                            
                            {/* ROUND ROBIN VIEW */}
                            {(!fixture.format || fixture.format === 'RoundRobin') && (
                                <div className="grid gap-6 lg:grid-cols-2">
                                    {fixture.groups.map(group => (
                                        <div key={group.id} className="bg-gray-800 rounded-md overflow-hidden border border-gray-700">
                                            <h4 className="text-sm font-bold p-2 bg-gray-700 text-white flex justify-between">
                                                <span>{group.name}</span>
                                                <span className="font-normal text-gray-400 text-xs">{group.matches.length} Matches</span>
                                            </h4>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-700 text-sm">
                                                    <thead className="bg-gray-700/30">
                                                        <tr>
                                                            <th className="px-2 py-2 text-left text-xs text-gray-400">Match</th>
                                                            <th className="px-2 py-2 text-center text-xs text-gray-400">Score</th>
                                                            <th className="px-2 py-2 text-center text-xs text-gray-400">Status</th>
                                                            <th className="px-2 py-2 text-center text-xs text-gray-400">Log</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-700">
                                                        {group.matches.map(match => (
                                                            <tr key={match.id} className={match.status === MatchStatus.Completed ? 'bg-green-900/10' : ''}>
                                                                <td className="px-2 py-2">
                                                                    <div className="flex flex-col">
                                                                        <span className={match.scoreP1! > match.scoreP2! && match.status === MatchStatus.Completed ? 'font-bold text-green-400' : ''}>
                                                                            {playerMap.get(match.player1Id || '')?.name || 'Unknown'}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500">vs</span>
                                                                        <span className={match.scoreP2! > match.scoreP1! && match.status === MatchStatus.Completed ? 'font-bold text-green-400' : ''}>
                                                                            {playerMap.get(match.player2Id || '')?.name || 'Unknown'}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-2 align-middle">
                                                                    <div className="flex flex-col gap-1 items-center">
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="0"
                                                                            value={match.scoreP1 ?? ''} 
                                                                            onChange={(e) => handleScoreChange(match.id, 'P1', e.target.value)} 
                                                                            className="w-12 text-center bg-gray-700 border border-gray-600 rounded-sm text-sm p-0.5" 
                                                                        />
                                                                        <input 
                                                                            type="number" 
                                                                            placeholder="0"
                                                                            value={match.scoreP2 ?? ''} 
                                                                            onChange={(e) => handleScoreChange(match.id, 'P2', e.target.value)} 
                                                                            className="w-12 text-center bg-gray-700 border border-gray-600 rounded-sm text-sm p-0.5" 
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-2 text-center align-middle">
                                                                    <select 
                                                                        value={match.status} 
                                                                        onChange={(e) => handleStatusChange(match, e.target.value as MatchStatus)} 
                                                                        className={`bg-gray-700 border-gray-600 rounded-sm text-xs p-1 max-w-[100px] ${match.status === MatchStatus.Completed ? 'text-green-400 border-green-900' : ''}`}
                                                                    >
                                                                        {Object.values(MatchStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                                    </select>
                                                                </td>
                                                                <td className="px-2 py-2 text-center align-middle">
                                                                    <button onClick={() => setHistoryModalMatch(match)} className="text-gray-500 hover:text-brand-primary transition-colors">
                                                                        <HistoryIcon />
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* KNOCKOUT VIEW */}
                            {fixture.format === 'Knockout' && fixture.knockoutMatches && (
                                <div className="space-y-4">
                                    {/* Group by Round Name for display */}
                                    {Array.from(new Set(fixture.knockoutMatches.map(m => m.roundName))).map(roundName => (
                                        <div key={roundName} className="bg-gray-800 rounded-md overflow-hidden border border-gray-700">
                                            <h4 className="text-sm font-bold p-2 bg-gray-700 text-white">{roundName}</h4>
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full divide-y divide-gray-700 text-sm">
                                                    <tbody className="divide-y divide-gray-700">
                                                        {fixture.knockoutMatches?.filter(m => m.roundName === roundName).map(match => (
                                                            <tr key={match.id} className={match.status === MatchStatus.Completed ? 'bg-green-900/10' : ''}>
                                                                <td className="px-4 py-2 w-1/3">
                                                                    <div className={`flex items-center justify-between ${match.scoreP1! > match.scoreP2! && match.status === MatchStatus.Completed ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                                                                        <span>{match.player1Id ? (playerMap.get(match.player1Id)?.name || 'Unknown') : (match.roundName?.includes('Round') ? 'TBD' : 'Bye')}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-2 w-1/6 text-center">
                                                                    <div className="flex gap-1 justify-center items-center">
                                                                        <input 
                                                                            type="number" 
                                                                            value={match.scoreP1 ?? ''} 
                                                                            onChange={(e) => handleScoreChange(match.id, 'P1', e.target.value)} 
                                                                            className="w-10 text-center bg-gray-700 border border-gray-600 rounded-sm text-sm" 
                                                                            disabled={!match.player1Id || !match.player2Id}
                                                                        />
                                                                        <span>-</span>
                                                                         <input 
                                                                            type="number" 
                                                                            value={match.scoreP2 ?? ''} 
                                                                            onChange={(e) => handleScoreChange(match.id, 'P2', e.target.value)} 
                                                                            className="w-10 text-center bg-gray-700 border border-gray-600 rounded-sm text-sm" 
                                                                            disabled={!match.player1Id || !match.player2Id}
                                                                        />
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-2 w-1/3 text-right">
                                                                    <div className={`flex items-center justify-between ${match.scoreP2! > match.scoreP1! && match.status === MatchStatus.Completed ? 'text-green-400 font-bold' : 'text-gray-300'}`}>
                                                                         <span>{match.player2Id ? (playerMap.get(match.player2Id)?.name || 'Unknown') : (match.roundName?.includes('Round') ? 'TBD' : 'Bye')}</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-2 py-2 w-1/6 text-center">
                                                                     <select 
                                                                        value={match.status} 
                                                                        onChange={(e) => handleStatusChange(match, e.target.value as MatchStatus)} 
                                                                        className={`bg-gray-700 border-gray-600 rounded-sm text-xs p-1 w-full ${match.status === MatchStatus.Completed ? 'text-green-400 border-green-900' : ''}`}
                                                                        disabled={!match.player1Id || !match.player2Id}
                                                                    >
                                                                        {Object.values(MatchStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                                                    </select>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                        </div>
                    ))
                )}
            </div>

            {historyModalMatch && <HistoryModal history={historyModalMatch.history} onClose={() => setHistoryModalMatch(null)} />}
        </div>
    );
};

export default FixtureManagement;
