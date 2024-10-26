import React, { useState } from 'react';
import { Copy } from 'lucide-react';
import { useGameState } from '../context/GameStateContext';

export default function ReferralSystem() {
  const { gameState, updateGameState } = useGameState();
  const [isCopied, setIsCopied] = useState(false);
  const [inputReferralCode, setInputReferralCode] = useState('');
  const [error, setError] = useState('');

  const copyReferralCode = () => {
    navigator.clipboard.writeText(gameState.referralCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleInputReferralCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (inputReferralCode === gameState.referralCode) {
      setError("You can't use your own referral code!");
      return;
    }

    if (gameState.referredBy) {
      setError("You've already used a referral code!");
      return;
    }

    // In a real app, you'd validate this against a backend
    updateGameState({
      referredBy: inputReferralCode,
      experience: gameState.experience + 200 // Bonus XP for using a referral code
    });

    setInputReferralCode('');
  };

  return (
    <div className="w-full max-w-sm bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4 text-center text-yellow-400">Referral Program</h2>
        <p className="text-gray-300 mb-4 text-center">
          Invite friends to earn 10% of their rewards and <span className="text-green-400">+200 XP</span> bonus!
        </p>
        <div className="flex items-center justify-between bg-gray-700 p-3 rounded-lg mb-4">
          <span className="text-lg font-semibold">{gameState.referralCode}</span>
          <button
            onClick={copyReferralCode}
            className="px-3 py-1.5 bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors flex items-center"
          >
            {isCopied ? 'Copied!' : 'Copy'}
            <Copy className="ml-2 h-4 w-4" />
          </button>
        </div>
        
        {!gameState.referredBy && (
          <form onSubmit={handleInputReferralCode} className="mt-4">
            <h3 className="text-lg mb-2">Enter Referral Code</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={inputReferralCode}
                onChange={(e) => setInputReferralCode(e.target.value)}
                placeholder="Enter code"
                className="flex-grow bg-gray-700 p-2 rounded-lg text-white"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Submit
              </button>
            </div>
            {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
          </form>
        )}

        {gameState.referredBy && (
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <p className="text-sm text-gray-300">
              Referred by: <span className="text-yellow-400">{gameState.referredBy}</span>
            </p>
          </div>
        )}

        {gameState.totalReferrals > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-gray-300">
              Total Referrals: <span className="text-yellow-400">{gameState.totalReferrals}</span>
            </p>
            <p className="text-sm text-gray-300">
              Earnings from Referrals: <span className="text-yellow-400">{gameState.referralEarnings.toFixed(4)} SOL</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}