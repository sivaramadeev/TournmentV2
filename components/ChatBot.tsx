
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Tournament, Match, MatchStatus } from '../types';
import { ChatIcon, SendIcon, XMarkIcon } from './icons';

interface ChatBotProps {
    tournament: Tournament;
}

interface Message {
    id: number;
    text: string;
    sender: 'user' | 'bot';
    options?: string[];
}

const ChatBot: React.FC<ChatBotProps> = ({ tournament }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [hasUnread, setHasUnread] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Initialize Greeting
    useEffect(() => {
        const initialMessages: Message[] = [];
        
        initialMessages.push({
            id: 1,
            text: `Hi! I'm your Tournament Assistant for ${tournament.settings.name}.`,
            sender: 'bot'
        });

        if (tournament.settings.announcement) {
            initialMessages.push({
                id: 2,
                text: `📢 ANNOUNCEMENT: ${tournament.settings.announcement}`,
                sender: 'bot'
            });
            setHasUnread(true);
        }

        initialMessages.push({
            id: 3,
            text: "How can I help you today?",
            sender: 'bot',
            options: ["Find Player", "Upcoming Matches", "My Status"]
        });

        setMessages(initialMessages);
    }, [tournament.settings.name, tournament.settings.announcement]);


    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setHasUnread(false);
    };

    const addMessage = (text: string, sender: 'user' | 'bot', options?: string[]) => {
        setMessages(prev => [...prev, { id: Date.now(), text, sender, options }]);
    };

    // --- Logic Helpers ---
    const getAllMatches = useMemo(() => {
        const allMatches: (Match & { category: string, type: string, group?: string })[] = [];
        tournament.fixtures.forEach(f => {
            f.groups.forEach(g => {
                g.matches.forEach(m => allMatches.push({ ...m, category: f.category, type: f.type, group: g.name }));
            });
            f.knockoutMatches?.forEach(m => allMatches.push({ ...m, category: f.category, type: f.type }));
        });
        return allMatches;
    }, [tournament.fixtures]);

    const getPlayerStats = (playerId: string) => {
        const matches = getAllMatches.filter(m => m.player1Id === playerId || m.player2Id === playerId);
        let wins = 0;
        let losses = 0;
        let nextMatch: (Match & { category: string, type: string }) | null = null;

        matches.forEach(m => {
            if (m.status === MatchStatus.Completed || m.status === MatchStatus.WalkoverP1 || m.status === MatchStatus.WalkoverP2 || m.status === MatchStatus.Disqualified) {
                const isP1 = m.player1Id === playerId;
                if ((isP1 && m.scoreP1! > m.scoreP2!) || (!isP1 && m.scoreP2! > m.scoreP1!)) {
                    wins++;
                } else {
                    losses++;
                }
            } else if (m.status === MatchStatus.Scheduled || m.status === MatchStatus.InProgress) {
                if (!nextMatch) nextMatch = m;
            }
        });

        return { wins, losses, nextMatch, total: matches.length };
    };

    const handleBotResponse = (input: string) => {
        const lowerInput = input.toLowerCase();

        // 0. Detect all categories mentioned in input
        // Filter categories that appear in the input string
        const matchedCategories = tournament.settings.categories.filter(cat => 
            lowerInput.includes(cat.toLowerCase())
        );

        // 1. Complex Intersection Logic (e.g. "Common in 30+ and 40+")
        if (matchedCategories.length > 1) {
            if (lowerInput.includes('common') || lowerInput.includes('both') || lowerInput.includes('and')) {
                // Find players present in ALL matched categories
                const commonPlayers = tournament.players.filter(p => 
                    matchedCategories.every(cat => p.categories.includes(cat))
                );

                if (commonPlayers.length === 0) {
                    addMessage(`I couldn't find any players who are registered in both ${matchedCategories.join(' and ')}.`, 'bot');
                } else {
                    const names = commonPlayers.map(p => p.name).join(', ');
                    addMessage(`Found ${commonPlayers.length} players playing in both ${matchedCategories.join(' & ')}:`, 'bot');
                    addMessage(names, 'bot');
                }
                return;
            }
        }

        // 2. Single Category Logic
        if (matchedCategories.length === 1) {
            const cat = matchedCategories[0];

            // 2a. "Who is in..." or "List players in..."
            if (lowerInput.includes('who') || lowerInput.includes('list') || lowerInput.includes('show players')) {
                const playersInCat = tournament.players.filter(p => p.categories.includes(cat));
                if (playersInCat.length === 0) {
                    addMessage(`No players found registered for ${cat}.`, 'bot');
                } else if (playersInCat.length > 15) {
                     const firstFew = playersInCat.slice(0, 15).map(p => p.name).join(', ');
                     addMessage(`There are ${playersInCat.length} players in ${cat}. Here are the first 15: ${firstFew}...`, 'bot');
                } else {
                    addMessage(`Players in ${cat}: ${playersInCat.map(p => p.name).join(', ')}.`, 'bot');
                }
                return;
            }

            // 2b. "Matches in..."
            if (lowerInput.includes('match') || lowerInput.includes('fixture')) {
                 const categoryMatches = getAllMatches
                    .filter(m => m.category === cat && m.status === MatchStatus.Scheduled)
                    .slice(0, 5);
                 
                 if (categoryMatches.length > 0) {
                     addMessage(`Here are upcoming matches for ${cat}:`, 'bot');
                     categoryMatches.forEach(m => {
                        const p1 = tournament.players.find(p => p.id === m.player1Id)?.name || 'TBD';
                        const p2 = tournament.players.find(p => p.id === m.player2Id)?.name || 'TBD';
                        addMessage(`🎾 ${p1} vs ${p2} (${m.group || m.roundName || 'Group'})`, 'bot');
                     });
                 } else {
                     addMessage(`No upcoming scheduled matches found specifically for ${cat}.`, 'bot');
                 }
                 return;
            }

            // 2c. "Count..." (Fallback)
            if (lowerInput.includes('how many') || lowerInput.includes('count') || lowerInput.includes('registered') || lowerInput.includes('players')) {
                const count = tournament.players.filter(p => p.categories.includes(cat)).length;
                addMessage(`There are ${count} players registered in the '${cat}' category.`, 'bot');
                return;
            }
        }

        // 3. General "Total Players" check
        if ((lowerInput.includes('how many') || lowerInput.includes('total')) && lowerInput.includes('players')) {
            addMessage(`There are a total of ${tournament.players.length} players registered in this tournament.`, 'bot');
            return;
        }

        // 4. General "Upcoming Matches"
        if (lowerInput.includes("upcoming") || lowerInput.includes("matches")) {
            const scheduled = getAllMatches.filter(m => m.status === MatchStatus.Scheduled).slice(0, 3);
            if (scheduled.length === 0) {
                addMessage("There are no upcoming scheduled matches at the moment.", 'bot');
            } else {
                addMessage("Here are a few upcoming matches:", 'bot');
                scheduled.forEach(m => {
                    const p1 = tournament.players.find(p => p.id === m.player1Id)?.name || 'TBD';
                    const p2 = tournament.players.find(p => p.id === m.player2Id)?.name || 'TBD';
                    addMessage(`🎾 ${m.category}: ${p1} vs ${p2}`, 'bot');
                });
            }
            return;
        }

        // 5. Find Player (Fallback logic)
        // If query is short, don't search blindly
        if (input.length < 3) {
            addMessage("Please be more specific or check your spelling.", 'bot');
            return;
        }

        const foundPlayers = tournament.players.filter(p => p.name.toLowerCase().includes(lowerInput));
        
        if (foundPlayers.length === 1) {
            const p = foundPlayers[0];
            const stats = getPlayerStats(p.id);
            addMessage(`Here is the info for ${p.name}:`, 'bot');
            addMessage(`📊 Stats: ${stats.wins} Wins, ${stats.losses} Losses.`, 'bot');
            
            if (stats.nextMatch) {
                const opponentId = stats.nextMatch.player1Id === p.id ? stats.nextMatch.player2Id : stats.nextMatch.player1Id;
                const opponentName = tournament.players.find(pl => pl.id === opponentId)?.name || 'TBD';
                addMessage(`🕒 Next Match: vs ${opponentName} (${stats.nextMatch.category}) - Status: ${stats.nextMatch.status}`, 'bot');
            } else {
                addMessage("✅ No scheduled matches pending.", 'bot');
            }
        } else if (foundPlayers.length > 1) {
            addMessage(`I found ${foundPlayers.length} players matching "${input}". Please be more specific.`, 'bot');
            addMessage(`Did you mean: ${foundPlayers.slice(0, 3).map(p => p.name).join(', ')}?`, 'bot');
        } else {
            addMessage("I couldn't find a player with that name. Try asking 'Who is in 30+' or 'Upcoming matches'.", 'bot');
        }
    };

    const handleSend = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!inputText.trim()) return;

        const text = inputText.trim();
        addMessage(text, 'user');
        setInputText('');

        // Simulate thinking delay
        setTimeout(() => {
            handleBotResponse(text);
        }, 500);
    };

    const handleOptionClick = (option: string) => {
        if (option === "My Status") {
            addMessage("My Status", 'user');
            setTimeout(() => addMessage("Please type your name so I can find your details.", 'bot'), 500);
        } else if (option === "Find Player") {
            addMessage("Find Player", 'user');
            setTimeout(() => addMessage("Who are you looking for? Type their name.", 'bot'), 500);
        } else {
            addMessage(option, 'user');
            setTimeout(() => handleBotResponse(option), 500);
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={toggleOpen}
                className="fixed bottom-6 right-6 p-4 bg-brand-primary hover:bg-brand-secondary text-white rounded-full shadow-2xl z-50 transition-all hover:scale-110 border-2 border-white/20"
            >
                {isOpen ? <XMarkIcon className="w-6 h-6" /> : <ChatIcon className="w-6 h-6" />}
                {!isOpen && hasUnread && (
                    <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white bg-red-500 animate-pulse" />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 w-80 md:w-96 h-[500px] bg-gray-900 border border-gray-700 rounded-xl shadow-2xl flex flex-col z-50 overflow-hidden animate-fade-in-up">
                    {/* Header */}
                    <div className="bg-gray-800 p-4 border-b border-gray-700 flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <h3 className="font-bold text-white">Tournament Assistant</h3>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900/95">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] px-4 py-2 rounded-lg text-sm ${
                                    msg.sender === 'user' 
                                        ? 'bg-brand-primary text-white rounded-br-none' 
                                        : 'bg-gray-700 text-gray-200 rounded-bl-none border border-gray-600'
                                }`}>
                                    {msg.text}
                                </div>
                                {msg.options && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {msg.options.map(opt => (
                                            <button 
                                                key={opt} 
                                                onClick={() => handleOptionClick(opt)}
                                                className="px-3 py-1 bg-gray-800 border border-gray-600 text-brand-primary text-xs rounded-full hover:bg-gray-700 transition-colors"
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} className="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1 bg-gray-700 border border-gray-600 text-white text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        />
                        <button type="submit" className="p-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-md transition-colors">
                            <SendIcon className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
};

export default ChatBot;
