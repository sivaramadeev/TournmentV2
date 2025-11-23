
import React from 'react';
import { View, TournamentStatus } from '../types';
import { EyeIcon, AdminIcon } from './icons';

interface HeaderProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    isAdminLoggedIn: boolean;
    onLogout: () => void;
    tournamentStatus: TournamentStatus;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, isAdminLoggedIn, onLogout, tournamentStatus }) => {
    const getStatusChip = () => {
        switch (tournamentStatus) {
            case 'Published':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-green-600 bg-green-200">Published</span>;
            case 'Publishing':
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-yellow-600 bg-yellow-200">Publishing...</span>;
            case 'Draft':
            default:
                return <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 bg-gray-200">Draft</span>;
        }
    };
    
    return (
        <header className="bg-gray-800 shadow-md sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-white">Tournament Manager</h1>
                        {isAdminLoggedIn && getStatusChip()}
                    </div>
                    <nav className="flex items-center space-x-4">
                        <button
                            onClick={() => setCurrentView('player')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'player' ? 'bg-brand-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                        >
                           <EyeIcon className="w-5 h-5"/> Player View
                        </button>
                        {isAdminLoggedIn ? (
                            <>
                                <button
                                    onClick={() => setCurrentView('admin')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-brand-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                                >
                                    <AdminIcon className="w-5 h-5"/> Admin
                                </button>
                                <button
                                    onClick={onLogout}
                                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-700 hover:text-white transition-colors"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => setCurrentView('login')}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'login' ? 'bg-brand-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                            >
                                Admin Login
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;