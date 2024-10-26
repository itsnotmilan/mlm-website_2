import React from 'react';
import { Twitter } from 'lucide-react';
import { useWallet } from '@solana/wallet-adapter-react';
import ClaimModal from './ClaimModal';

const HomePage = () => {
  const [followers, setFollowers] = React.useState(0);
  const [timeLeft, setTimeLeft] = React.useState({ days: 15, hours: 0, minutes: 0, seconds: 0 });
  const [isClaimModalOpen, setIsClaimModalOpen] = React.useState(false);
  const { publicKey } = useWallet();

  React.useEffect(() => {
    const targetDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });

      if (difference < 0) {
        clearInterval(interval);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setFollowers(prev => Math.min(prev + Math.floor(Math.random() * 10), 5000));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const partners = React.useMemo(() => Array(5).fill(null).map((_, i) => (
    <div key={i} className="w-32 h-32 md:w-40 md:h-40 bg-gray-500 flex-shrink-0 rounded-lg" />
  )), []);

  return (
    <main className="flex-grow pt-20 md:pt-24 animate-fadeIn">
      <div className="w-full bg-white h-48 md:h-64 mb-8 md:mb-12"></div>
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex flex-col items-center mb-8 md:mb-12">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 md:mb-8 text-center text-yellow-400">
            Art Reveal:
          </h2>
          <div className="flex flex-row justify-center gap-2 md:gap-4 mb-4 px-2">
            {Object.entries(timeLeft).map(([unit, value]) => (
              <div key={unit} className="text-center">
                <div className="bg-yellow-400 text-gray-900 text-lg md:text-4xl font-bold p-2 md:p-4 rounded-lg w-16 md:w-24">
                  <span className="countdown-number">{value.toString().padStart(2, '0')}</span>
                </div>
                <div className="text-[10px] md:text-sm mt-1 md:mt-2 uppercase">{unit}</div>
              </div>
            ))}
          </div>
          <div className="text-center mb-6 md:mb-8">
            <p className="text-2xl md:text-4xl mb-2">or</p>
            <div className="flex items-center justify-center space-x-2 text-xl md:text-3xl font-bold">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                <Twitter className="w-6 h-6 md:w-8 md:h-8" />
              </a>
              <span>followers: {followers}/5000</span>
            </div>
          </div>
        </div>
        <div className="space-y-4 md:space-y-6 px-4 sm:px-6 lg:px-8 border-2 border-gray-700 rounded-lg p-4 md:p-6">
          <p className="text-sm md:text-base">
            Welcome to Money Loving Monkeys, the most bananas NFT project in the crypto jungle! Our collection features 10,000 unique, algorithmically generated primates with a passion for finance.
          </p>
          <p className="text-sm md:text-base">
            Each Money Loving Monkey is your ticket to exclusive benefits in our ecosystem, from our banana-backed DeFi platform to DAO voting rights.
          </p>
          <button 
            onClick={() => setIsClaimModalOpen(true)}
            className="w-48 h-48 mx-auto block bg-white rounded-lg hover:opacity-90 transition-opacity cursor-pointer"
          />
          <p className="text-sm md:text-base">
            Get ready for our big reveal and join our community. In the jungle of NFTs, it's not just about monkey business – it's about monkey finance!
          </p>
        </div>
        <div className="mt-8 md:mt-12">
          <h3 className="text-2xl md:text-3xl font-bold mb-4 text-center">Our partners:</h3>
          <div className="relative h-32 md:h-40 overflow-hidden rounded-lg">
            <div className="flex space-x-4 animate-scroll">
              {partners}
              {partners}
            </div>
          </div>
        </div>
      </div>

      <ClaimModal 
        isOpen={isClaimModalOpen} 
        onClose={() => setIsClaimModalOpen(false)}
        publicKey={publicKey}
      />
    </main>
  );
};

export default React.memo(HomePage);