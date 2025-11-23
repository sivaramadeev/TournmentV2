
import React from 'react';
import { Tournament } from '../types';
import { EyeIcon } from './icons';

interface PublicTournamentListProps {
    tournaments: Tournament[];
    onSelect: (id: string) => void;
}

const PublicTournamentList: React.FC<PublicTournamentListProps> = ({ tournaments, onSelect }) => {
    // Only show published tournaments to public
    const publishedTournaments = tournaments.filter(t => t.isPublished);

    return (
        <div className="space-y-8">
            <div className="text-center py-10">
                <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary mb-4">
                    Tournament Hub
                </h1>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                    Browse active tournaments, view player lists, check fixtures, and track live match results.
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {publishedTournaments.length === 0 ? (
                    <div className="col-span-full text-center p-12 bg-gray-800/50 rounded-lg border border-gray-700 border-dashed">
                        <p className="text-gray-400 text-lg">No active tournaments found at the moment.</p>
                    </div>
                ) : (
                    publishedTournaments.map(t => (
                        <div key={t.id} className="bg-gray-800 rounded-lg shadow-lg border border-gray-700 hover:border-brand-primary/50 transition-all overflow-hidden flex flex-col group cursor-pointer" onClick={() => onSelect(t.id)}>
                            <div className="p-6 flex-1">
                                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-brand-primary transition-colors">
                                    {t.settings.name}
                                </h3>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {t.settings.types.slice(0, 3).map(type => (
                                        <span key={type} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                                            {type}
                                        </span>
                                    ))}
                                    {t.settings.types.length > 3 && (
                                        <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">+{t.settings.types.length - 3} more</span>
                                    )}
                                </div>
                                <div className="space-y-1 text-sm text-gray-400">
                                    <p><strong>{t.players.length}</strong> Players Registered</p>
                                    <p><strong>{t.fixtures.length}</strong> Categories Scheduled</p>
                                </div>
                            </div>
                            <div className="bg-brand-primary/10 p-4 flex justify-center items-center border-t border-gray-700 group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                <span className="font-semibold flex items-center gap-2">
                                    <EyeIcon className="w-5 h-5" /> View Tournament
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default PublicTournamentList;
