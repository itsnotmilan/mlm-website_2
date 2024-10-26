import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Clock, HelpCircle, AlertCircle, X } from 'lucide-react';
import { useWalletBalance } from '../hooks/useWalletBalance';
import { useGameState } from '../context/GameStateContext';
import LevelMeter from './LevelMeter';
import ReferralSystem from './ReferralSystem';

const InfoModal = React.memo(({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4">
    <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 relative">
      <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
        <X className="w-6 h-6" />
      </button>
      <h3 className="text-xl font-bold text-yellow-400 mb-4">How It Works</h3>
      <div className="space-y-3 text-gray-300">
        <p>• Stake SOL to earn rewards at the current APR</p>
        <p>• Level up by gaining XP from staking and compounds</p>
        <p>• Higher levels increase your APR and rewards</p>
        <p>• Compound rewards to earn bonus XP</p>
        <p>• 24h cooldown starts after compound/claim</p>
        <p>• Invite friends to earn 10% of their rewards</p>
      </div>
    </div>
  </div>
));

InfoModal.displayName = 'InfoModal';

function StakingComponent() {
  const { publicKey } = useWallet();
  const { balance } = useWalletBalance();
  const { gameState, updateGameState } = useGameState();
  const [stakeAmount, setStakeAmount] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [baseAPR] = useState(150);

  // Calculate actual APR based on level
  const currentAPR = baseAPR * (1 + (gameState.level * 0.2));

  const handleLevelUp = (currentLevel: number, currentXP: number, maxXP: number) => {
    if (currentXP >= maxXP) {
      const excessXP = currentXP - maxXP;
      const nextMaxXP = Math.floor(maxXP * 1.2); // 20% increase per level
      
      updateGameState({
        level: currentLevel + 1,
        maxExperience: nextMaxXP,
        experience: 0
      });

      // If there's excess XP, recursively apply it to the next level
      if (excessXP > 0) {
        setTimeout(() => {
          handleLevelUp(currentLevel + 1, excessXP, nextMaxXP);
        }, 600); // Wait for level up animation to complete
      }
    } else {
      updateGameState({
        experience: currentXP
      });
    }
  };

  // Calculate XP to earn based on stake amount
  const xpToEarn = React.useMemo(() => {
    const amount = parseFloat(stakeAmount);
    return amount && amount > 0 ? Math.floor(amount * 100) : 0;
  }, [stakeAmount]);

  // Calculate compound XP based on rewards
  const compoundXp = React.useMemo(() => {
    return Math.floor(parseFloat(gameState.rewardAmount) * 1000);
  }, [gameState.rewardAmount]);

  // Update rewards based on staked amount and APR
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (parseFloat(gameState.stakedAmount) > 0) {
        const dailyRate = currentAPR / 365 / 100;
        const newReward = parseFloat(gameState.stakedAmount) * dailyRate / 24; // Hourly rewards
        updateGameState({
          rewardAmount: (parseFloat(gameState.rewardAmount) + newReward).toFixed(6)
        });
      }
    }, 3600000); // Update every hour

    return () => clearInterval(interval);
  }, [gameState.stakedAmount, currentAPR, updateGameState]);

  // Timer countdown
  React.useEffect(() => {
    if (gameState.timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      updateGameState({
        timeLeft: Math.max(0, gameState.timeLeft - 1)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.timeLeft, updateGameState]);

  const formatTime = (seconds: number) => {
    if (seconds === 0) return 'Ready';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStake = async () => {
    setError('');
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      setError('Please enter a valid stake amount.');
      return;
    }
    if (parseFloat(stakeAmount) > balance) {
      setError('Insufficient balance for staking.');
      return;
    }

    setIsLoading(true);
    try {
      const newStakedAmount = (parseFloat(gameState.stakedAmount) + parseFloat(stakeAmount)).toFixed(6);
      updateGameState({ stakedAmount: newStakedAmount });
      
      const newTotalXP = gameState.experience + xpToEarn;
      handleLevelUp(gameState.level, newTotalXP, gameState.maxExperience);
      
      setStakeAmount('');
    } catch (err) {
      console.error('Error staking:', err);
      setError('Failed to stake. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompound = async () => {
    setError('');
    if (parseFloat(gameState.rewardAmount) <= 0) {
      setError('No rewards to compound.');
      return;
    }
    
    setIsLoading(true);
    try {
      const newStakedAmount = (parseFloat(gameState.stakedAmount) + parseFloat(gameState.rewardAmount)).toFixed(6);
      
      const newTotalXP = gameState.experience + compoundXp;
      handleLevelUp(gameState.level, newTotalXP, gameState.maxExperience);
      
      updateGameState({
        stakedAmount: newStakedAmount,
        rewardAmount: '0',
        timeLeft: 24 * 60 * 60
      });
    } catch (err) {
      console.error('Error compounding:', err);
      setError('Failed to compound. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClaim = async () => {
    setError('');
    if (parseFloat(gameState.rewardAmount) <= 0) {
      setError('No rewards to claim.');
      return;
    }

    setIsLoading(true);
    try {
      updateGameState({
        rewardAmount: '0',
        timeLeft: 24 * 60 * 60
      });
      setIsClaimModalOpen(false);
    } catch (err) {
      console.error('Error claiming:', err);
      setError('Failed to claim. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center py-12 px-4">
        <div className="max-w-sm w-full bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-3xl font-bold mb-6 text-yellow-400">SOL Staking</h2>
          <p className="text-gray-300 mb-6">Connect your wallet to start staking</p>
          <WalletMultiButton className="!bg-yellow-500 hover:!bg-yellow-600 !transition-colors" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 space-y-8">
      <div className="w-full max-w-sm bg-gray-800 rounded-lg shadow-lg overflow-hidden relative">
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-2">SOL Staking</h2>
            <span className="text-sm text-gray-400">
              Connected: {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
            </span>
          </div>

          <button
            onClick={() => setIsInfoModalOpen(true)}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          <div className="space-y-4">
            <LevelMeter 
              level={gameState.level} 
              experience={gameState.experience} 
              maxExperience={gameState.maxExperience} 
            />

            <div className="flex justify-between items-center bg-gray-700 p-3 rounded-lg">
              <div>
                <span className="text-sm text-gray-400">Current APR</span>
                <p className="text-xl font-bold text-green-400">{currentAPR.toFixed(0)}%</p>
              </div>
              <div>
                <span className="text-sm text-gray-400">Next Level</span>
                <p className="text-xl font-bold text-gray-400">{(currentAPR * 1.2).toFixed(0)}%</p>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm flex items-center">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <h3 className="text-lg mb-1">Stake Amount (SOL)</h3>
              <div className="relative">
                <input
                  type="number"
                  value={stakeAmount}
                  onChange={(e) => setStakeAmount(e.target.value)}
                  className="w-full bg-gray-700 p-3 rounded-lg text-xl font-bold appearance-none"
                  placeholder="0.00"
                />
                <span className={`absolute right-3 top-1/2 transform -translate-y-1/2 text-sm ${xpToEarn === 0 ? 'text-gray-400' : 'text-green-400'}`}>
                  +{xpToEarn} XP
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-400 text-right">
                Balance: {balance.toFixed(4)} SOL
              </div>
            </div>

            <button
              onClick={handleStake}
              disabled={isLoading}
              className="stake-btn w-full py-3 text-lg font-bold bg-yellow-400 text-gray-900 hover:bg-yellow-500 transition-colors duration-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Stake SOL'}
            </button>

            <div>
              <h3 className="text-lg mb-1">Current Rewards</h3>
              <div className="bg-gray-700 p-3 rounded-lg text-xl font-bold">
                <span>{parseFloat(gameState.rewardAmount).toFixed(6)} SOL</span>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={handleCompound}
                disabled={isLoading || gameState.timeLeft > 0 || parseFloat(gameState.rewardAmount) <= 0}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  gameState.timeLeft > 0 || parseFloat(gameState.rewardAmount) <= 0
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Compound
                <span className={`block text-xs ${compoundXp === 0 ? 'text-gray-400' : 'text-green-400'}`}>+{compoundXp} XP</span>
              </button>

              <button
                onClick={() => setIsClaimModalOpen(true)}
                disabled={isLoading || gameState.timeLeft > 0 || parseFloat(gameState.rewardAmount) <= 0}
                className={`flex-1 py-2 px-4 rounded-lg font-semibold transition-colors ${
                  gameState.timeLeft > 0 || parseFloat(gameState.rewardAmount) <= 0
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                Claim
              </button>
            </div>

            <div className="text-center text-sm text-gray-400 flex items-center justify-center">
              <Clock className="w-4 h-4 mr-2" />
              <p>{formatTime(gameState.timeLeft)}</p>
            </div>
          </div>
        </div>
      </div>

      <ReferralSystem />

      {isInfoModalOpen && <InfoModal onClose={() => setIsInfoModalOpen(false)} />}

      {isClaimModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">Confirm Claim</h3>
            <p className="text-gray-300">Are you sure you want to claim now?</p>
            <p className="mt-2 text-green-400">You'll miss out on +{compoundXp} XP!</p>
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => setIsClaimModalOpen(false)}
                className="flex-1 py-2 px-4 bg-yellow-400 text-gray-900 rounded-lg hover:bg-yellow-500 transition-colors"
              >
                Wait, go back!
              </button>
              <button
                onClick={handleClaim}
                className="flex-1 py-2 px-4 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default React.memo(StakingComponent);