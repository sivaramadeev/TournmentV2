
import React from 'react';
import { View, TournamentStatus, User } from '../types';
import { EyeIcon, AdminIcon, KeyIcon, TennisIcon } from './icons';

interface HeaderProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    currentUser: User | null;
    onLogout: () => void;
    tournamentStatus: TournamentStatus;
    onChangePassword?: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, currentUser, onLogout, tournamentStatus, onChangePassword }) => {
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
                        <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('player')}>
                            <TennisIcon className="w-8 h-8 text-lime-400" />
                            <h1 className="text-xl md:text-2xl font-bold text-white">TournManager <span className="text-xs font-normal text-brand-primary bg-brand-primary/10 px-1 rounded border border-brand-primary/50">SaaS</span></h1>
                        </div>
                        {currentUser && currentView === 'admin' && getStatusChip()}
                    </div>
                    <nav className="flex items-center space-x-2 md:space-x-4">
                        <button
                            onClick={() => setCurrentView('player')}
                            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'player' ? 'bg-brand-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                        >
                           <EyeIcon className="w-5 h-5"/> <span className="hidden md:inline">Public Hub</span>
                        </button>
                        {currentUser ? (
                            <>
                                <button
                                    onClick={() => setCurrentView('admin')}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'admin' ? 'bg-brand-primary text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}`}
                                >
                                    <AdminIcon className="w-5 h-5"/> 
                                    <span className="hidden md:inline">My Dashboard</span>
                                </button>
                                <div className="h-6 w-px bg-gray-600 mx-2 hidden md:block"></div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 hidden lg:block">Hello, {currentUser.name}</span>
                                    {onChangePassword && (
                                        <button
                                            onClick={onChangePassword}
                                            className="p-2 rounded-md text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                                            title="Change Password"
                                        >
                                            <KeyIcon className="w-5 h-5"/>
                                        </button>
                                    )}
                                    <button
                                        onClick={onLogout}
                                        className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-red-900/50 hover:text-red-200 transition-colors border border-transparent hover:border-red-800"
                                    >
                                        Logout
                                    </button>
                                </div>
                            </>
                        ) : (
                            <button
                                onClick={() => setCurrentView('login')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${currentView === 'login' ? 'bg-brand-primary text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
                            >
                                Sign In / Register
                            </button>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
};

export default Header;
