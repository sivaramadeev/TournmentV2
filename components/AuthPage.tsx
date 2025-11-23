
import React, { useState } from 'react';
import { authService } from '../services/authService';
import { User } from '../types';

interface AuthPageProps {
    onLoginSuccess: (user: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLoginSuccess }) => {
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Simulate network delay for realistic feel
        await new Promise(r => setTimeout(r, 800));

        try {
            let user: User;
            if (mode === 'register') {
                if (!formData.name) throw new Error("Name is required");
                user = authService.register(formData.name, formData.email, formData.password);
                // Auto login after register
                user = authService.login(formData.email, formData.password);
            } else {
                user = authService.login(formData.email, formData.password);
            }
            onLoginSuccess(user);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center">
            <div className="w-full max-w-md bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
                <div className="flex border-b border-gray-700">
                    <button 
                        className={`flex-1 py-4 text-sm font-medium ${mode === 'login' ? 'bg-gray-800 text-brand-primary border-b-2 border-brand-primary' : 'bg-gray-750 text-gray-400 hover:text-white'}`}
                        onClick={() => { setMode('login'); setError(''); }}
                    >
                        Sign In
                    </button>
                    <button 
                        className={`flex-1 py-4 text-sm font-medium ${mode === 'register' ? 'bg-gray-800 text-brand-primary border-b-2 border-brand-primary' : 'bg-gray-750 text-gray-400 hover:text-white'}`}
                        onClick={() => { setMode('register'); setError(''); }}
                    >
                        Create Account
                    </button>
                </div>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-white mb-2 text-center">
                        {mode === 'login' ? 'Welcome Back' : 'Start Managing Tournaments'}
                    </h2>
                    <p className="text-gray-400 text-center mb-6 text-sm">
                        {mode === 'login' ? 'Access your dashboard and manage fixtures.' : 'Join the platform to host your own events.'}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'register' && (
                            <div>
                                <label className="block text-xs font-medium text-gray-400 mb-1">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-brand-primary focus:border-brand-primary"
                                    placeholder="John Doe"
                                />
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="you@example.com"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Password</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-brand-primary focus:border-brand-primary"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        {error && <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{error}</p>}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-2.5 px-4 bg-brand-primary hover:bg-brand-secondary text-white font-medium rounded-md shadow-lg transition-all transform hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Processing...' : (mode === 'login' ? 'Sign In' : 'Sign Up & Get Started')}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;
