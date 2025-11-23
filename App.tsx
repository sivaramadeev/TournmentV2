
import React, { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Tournament, User, View } from './types';
import { DEFAULT_TOURNAMENT } from './constants';
import AdminDashboard from './components/AdminDashboard';
import PlayerView from './components/PlayerView';
import Header from './components/Header';
import AdminTournamentList from './components/AdminTournamentList';
import PublicTournamentList from './components/PublicTournamentList';
import AuthPage from './components/AuthPage';
import ChangePasswordModal from './components/ChangePasswordModal';
import { gistService } from './services/gistService';
import { authService } from './services/authService';

const App: React.FC = () => {
    // Store array of tournaments in local storage (Global DB in simulation)
    const [tournaments, setTournaments] = useLocalStorage<Tournament[]>('tournamentServiceData', []);
    
    // Auth State
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    const [currentView, setCurrentView] = useState<View>('player');
    
    // Persist the active tournament ID so refresh doesn't kick user back to list
    const [activeTournamentId, setActiveTournamentId] = useLocalStorage<string | null>('activeTournamentId', null);
    
    const [loading, setLoading] = useState(true);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    // Initialize
    useEffect(() => {
        const loadInitialData = async () => {
            // 1. Check for logged in user
            const savedUser = authService.getCurrentUser();
            if (savedUser) {
                setCurrentUser(savedUser);
                // If user was logged in, default to admin view unless specific link
                if (!window.location.search) setCurrentView('admin');
            }

            // 2. Check for cloud data (Gist)
            const params = new URLSearchParams(window.location.search);
            const gistId = params.get('data');
            
            if (gistId) {
                try {
                    setLoading(true);
                    const cloudTournament = await gistService.loadFromGist(gistId);
                    
                    setTournaments(prev => {
                        const filtered = prev.filter(t => t.id !== cloudTournament.id);
                        return [...filtered, cloudTournament];
                    });
                    
                    setActiveTournamentId(cloudTournament.id);
                    setCurrentView('player'); // Viewer mode for shared links
                } catch (error) {
                    console.error('Failed to load from cloud:', error);
                    // Fallback to local
                    const storedData = window.localStorage.getItem('tournamentServiceData');
                    if (storedData) {
                        const parsed: Tournament[] = JSON.parse(storedData);
                        if (parsed.find(t => t.gistId === gistId)) {
                             alert('Network error: Could not sync latest data. Showing cached version.');
                        }
                    }
                }
            }
            setLoading(false);
        };

        // Recover from corrupted storage
        if (!Array.isArray(tournaments)) {
            setTournaments([]);
        }
        
        loadInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    const handleLoginSuccess = (user: User) => {
        setCurrentUser(user);
        setCurrentView('admin');
    };

    const handleLogout = useCallback(() => {
        authService.logout();
        setCurrentUser(null);
        setCurrentView('login');
        setActiveTournamentId(null);
    }, [setActiveTournamentId]);

    // Mock functionality for SaaS (Changing own password in authService is not implemented in this mock, 
    // but we keep the UI flow for demonstration)
    const handleChangePassword = (newPass: string) => {
        // In a real app, call API to change password
        setShowPasswordModal(false);
        alert('Password changed successfully.');
    };

    const createNewTournament = (name: string) => {
        if (!currentUser) return;

        const newTournament: Tournament = {
            ...DEFAULT_TOURNAMENT,
            id: `tourn-${Date.now()}`,
            ownerId: currentUser.id, // SaaS: Assign owner
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
        // In SaaS mode, imported tournaments become owned by the importer
        const normalizedData = importedData.map(t => ({
            ...t,
            ownerId: currentUser?.id || t.ownerId // Take ownership
        }));

        if (mode === 'replace') {
            // Only replace USER'S tournaments, keep others
            setTournaments(prev => {
                const others = prev.filter(t => t.ownerId !== currentUser?.id);
                return [...others, ...normalizedData];
            });
            alert(`Successfully replaced your dashboard with ${importedData.length} tournaments.`);
        } else {
            setTournaments(prev => {
                const incomingMap = new Map(normalizedData.map(t => [t.id, t]));
                const existingFiltered = prev.filter(t => !incomingMap.has(t.id));
                return [...existingFiltered, ...normalizedData];
            });
            alert(`Successfully merged.`);
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
                return <AuthPage onLoginSuccess={handleLoginSuccess} />;
            
            case 'admin':
                if (currentUser) {
                    if (activeTournamentId && activeTournament) {
                        return (
                            <AdminDashboard 
                                tournament={activeTournament} 
                                setTournament={handleUpdateActiveTournament}
                                onBack={() => setActiveTournamentId(null)}
                            />
                        );
                    }
                    // Filter tournaments: Only show ones owned by current user
                    const myTournaments = tournaments.filter(t => t.ownerId === currentUser.id);

                    return (
                        <AdminTournamentList 
                            tournaments={myTournaments} 
                            onCreate={createNewTournament}
                            onSelect={setActiveTournamentId}
                            onDelete={deleteTournament}
                            onImport={handleImportTournaments}
                        />
                    );
                }
                return <AuthPage onLoginSuccess={handleLoginSuccess} />;
            
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
                        tournaments={tournaments} // Public view shows ALL published tournaments
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
                currentUser={currentUser}
                onLogout={handleLogout}
                tournamentStatus={currentStatus}
                onChangePassword={() => setShowPasswordModal(true)}
            />
            <main className="container mx-auto p-4 md:p-6 lg:p-8">
                {renderContent()}
            </main>
            {showPasswordModal && (
                <ChangePasswordModal 
                    onClose={() => setShowPasswordModal(false)}
                    onSave={handleChangePassword}
                />
            )}
        </div>
    );
};

export default App;
