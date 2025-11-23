
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Tournament } from './types';
import { DEFAULT_TOURNAMENT, ADMIN_USERNAME, ADMIN_PASSWORD } from './constants';
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';
import PlayerView from './components/PlayerView';
import Header from './components/Header';
import AdminTournamentList from './components/AdminTournamentList';
import PublicTournamentList from './components/PublicTournamentList';
import { gistService } from './services/gistService';
import { View } from './types';

const App: React.FC = () => {
    // Store array of tournaments in local storage
    const [tournaments, setTournaments] = useLocalStorage<Tournament[]>('tournamentServiceData', []);
    
    const [isAdminLoggedIn, setIsAdminLoggedIn] = useLocalStorage<boolean>('isAdminLoggedIn', false);
    const [currentView, setCurrentView] = useState<View>('player');
    
    // Persist the active tournament ID so refresh doesn't kick user back to list
    const [activeTournamentId, setActiveTournamentId] = useLocalStorage<string | null>('activeTournamentId', null);
    
    const [loading, setLoading] = useState(true);

    // Check for cloud data in URL on mount
    useEffect(() => {
        const loadCloudData = async () => {
            const params = new URLSearchParams(window.location.search);
            const gistId = params.get('data');
            
            if (gistId) {
                try {
                    setLoading(true);
                    // Always fetch from cloud to ensure we have the latest data (Live Scoring)
                    const cloudTournament = await gistService.loadFromGist(gistId);
                    
                    // Update local storage with the fresh cloud data
                    setTournaments(prev => {
                        // Remove potential duplicates by ID to ensure we replace the old version
                        const filtered = prev.filter(t => t.id !== cloudTournament.id);
                        return [...filtered, cloudTournament];
                    });
                    
                    setActiveTournamentId(cloudTournament.id);
                } catch (error) {
                    console.error('Failed to load from cloud:', error);
                    
                    // Fallback: If cloud fails, check if we have a local copy
                    // We need to access the current tournaments state here. 
                    // Since we can't easily access the up-to-date state inside this effect without dependencies,
                    // we rely on the fact that useLocalStorage initializes synchronously.
                    const storedData = window.localStorage.getItem('tournamentServiceData');
                    if (storedData) {
                        const parsed: Tournament[] = JSON.parse(storedData);
                        const existing = parsed.find(t => t.gistId === gistId);
                        if (existing) {
                            setActiveTournamentId(existing.id);
                            alert('Network error: Could not sync latest data. Showing cached version.');
                        } else {
                             alert('Failed to load tournament from link. Please check your connection.');
                        }
                    } else {
                        alert('Failed to load tournament from link. Please check the URL.');
                    }
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        // Ensure tournaments is always an array (recovers from potential corrupted storage)
        if (!Array.isArray(tournaments)) {
            setTournaments([]);
        }
        
        loadCloudData();

        if (isAdminLoggedIn) {
            setCurrentView('admin');
        } else {
            setCurrentView('player');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Run once on mount

    const handleLogin = useCallback((user: string, pass: string): boolean => {
        if (user === ADMIN_USERNAME && pass === ADMIN_PASSWORD) {
            setIsAdminLoggedIn(true);
            setCurrentView('admin');
            return true;
        }
        return false;
    }, [setIsAdminLoggedIn]);

    const handleLogout = useCallback(() => {
        setIsAdminLoggedIn(false);
        setCurrentView('login');
        setActiveTournamentId(null);
    }, [setIsAdminLoggedIn, setActiveTournamentId]);

    const createNewTournament = (name: string) => {
        const newTournament: Tournament = {
            ...DEFAULT_TOURNAMENT,
            id: `tourn-${Date.now()}`,
            createdAt: new Date().toISOString(),
            settings: {
                ...DEFAULT_TOURNAMENT.settings,
                name: name
            }
        };
        setTournaments(prev => [...prev, newTournament]);
        setActiveTournamentId(newTournament.id);
    };

    const deleteTournament = (id: string) => {
        if (confirm('Are you sure you want to delete this tournament? This action cannot be undone.')) {
            setTournaments(prev => prev.filter(t => t.id !== id));
            if (activeTournamentId === id) setActiveTournamentId(null);
        }
    };
    
    const handleImportTournaments = (importedData: Tournament[], mode: 'merge' | 'replace') => {
        if (mode === 'replace') {
            setTournaments(importedData);
            alert(`Successfully replaced database with ${importedData.length} tournaments.`);
        } else {
            setTournaments(prev => {
                const incomingMap = new Map(importedData.map(t => [t.id, t]));
                const existingFiltered = prev.filter(t => !incomingMap.has(t.id));
                return [...existingFiltered, ...importedData];
            });
            alert(`Successfully merged. Total tournaments: ${tournaments.length + importedData.length} (roughly)`);
        }
    };

    const handleUpdateActiveTournament = (
        value: Tournament | ((prev: Tournament) => Tournament)
    ) => {
        if (!activeTournamentId) return;

        setTournaments(prevList => {
            const index = prevList.findIndex(t => t.id === activeTournamentId);
            if (index === -1) return prevList;

            const oldTournament = prevList[index];
            const updatedTournament = typeof value === 'function' ? value(oldTournament) : value;

            const newList = [...prevList];
            newList[index] = updatedTournament;
            return newList;
        });
    };

    const renderContent = () => {
        if (loading) {
            return <div className="flex h-screen items-center justify-center text-xl text-brand-primary animate-pulse">Loading Application Data...</div>;
        }

        const activeTournament = Array.isArray(tournaments) ? tournaments.find(t => t.id === activeTournamentId) : null;

        switch (currentView) {
            case 'login':
                return <AdminLogin onLogin={handleLogin} />;
            
            case 'admin':
                if (isAdminLoggedIn) {
                    if (activeTournamentId && activeTournament) {
                        return (
                            <AdminDashboard 
                                tournament={activeTournament} 
                                setTournament={handleUpdateActiveTournament}
                                onBack={() => setActiveTournamentId(null)}
                            />
                        );
                    }
                    return (
                        <AdminTournamentList 
                            tournaments={tournaments} 
                            onCreate={createNewTournament}
                            onSelect={setActiveTournamentId}
                            onDelete={deleteTournament}
                            onImport={handleImportTournaments}
                        />
                    );
                }
                return <AdminLogin onLogin={handleLogin} />;
            
            case 'player':
            default:
                if (activeTournamentId && activeTournament) {
                    return (
                        <PlayerView 
                            tournament={activeTournament} 
                            onBack={() => setActiveTournamentId(null)}
                        />
                    );
                }
                return (
                    <PublicTournamentList 
                        tournaments={tournaments}
                        onSelect={setActiveTournamentId}
                    />
                );
        }
    };

    const currentStatus = activeTournamentId && Array.isArray(tournaments) 
        ? tournaments.find(t => t.id === activeTournamentId)?.status || 'Draft' 
        : 'Draft';

    return (
        <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
            <Header
                currentView={currentView}
                setCurrentView={(view) => {
                    setCurrentView(view);
                    setActiveTournamentId(null);
                }}
                isAdminLoggedIn={isAdminLoggedIn}
                onLogout={handleLogout}
                tournamentStatus={currentStatus}
            />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                {renderContent()}
            </main>
        </div>
    );
};

export default App;
