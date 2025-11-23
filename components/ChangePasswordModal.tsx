
import React, { useState } from 'react';

interface ChangePasswordModalProps {
    onClose: () => void;
    onSave: (newPass: string) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, onSave }) => {
    const [newPass, setNewPass] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPass.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }
        if (newPass !== confirmPass) {
            setError('Passwords do not match.');
            return;
        }
        onSave(newPass);
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-sm border border-gray-700 animate-fade-in">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white">Change Admin Password</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">New Password</label>
                        <input 
                            type="password" 
                            value={newPass}
                            onChange={(e) => setNewPass(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-brand-primary"
                            placeholder="Enter new password"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Confirm Password</label>
                        <input 
                            type="password" 
                            value={confirmPass}
                            onChange={(e) => setConfirmPass(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:ring-brand-primary"
                            placeholder="Confirm new password"
                        />
                    </div>
                    {error && <p className="text-red-400 text-sm">{error}</p>}
                    <div className="flex justify-end gap-3 mt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-md">Cancel</button>
                        <button type="submit" className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white rounded-md">Save Password</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
