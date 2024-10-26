import React, { useEffect, useState } from 'react';

interface LevelMeterProps {
  level: number;
  experience: number;
  maxExperience: number;
}

export const LevelMeter: React.FC<LevelMeterProps> = ({ level, experience, maxExperience }) => {
  const [isLevelingUp, setIsLevelingUp] = useState(false);
  const [prevLevel, setPrevLevel] = useState(level);
  const [prevExperience, setPrevExperience] = useState(experience);

  useEffect(() => {
    if (level > prevLevel) {
      setIsLevelingUp(true);
      const timer = setTimeout(() => setIsLevelingUp(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevLevel(level);
  }, [level, prevLevel]);

  useEffect(() => {
    setPrevExperience(experience);
  }, [experience]);

  const progressWidth = `${(experience / maxExperience) * 100}%`;
  const isProgressAnimated = experience > prevExperience;

  return (
    <div className="space-y-2 relative">
      <div className="flex justify-between items-center">
        <div className={`text-sm transition-all duration-500 ${isLevelingUp ? 'animate-levelUp text-yellow-400' : ''}`}>
          Level {level} <span className="text-green-400">+{level * 20}%</span>
        </div>
        <span className="text-xs text-gray-400">{experience}/{maxExperience} XP</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden relative">
        <div 
          className={`h-full bg-gradient-to-r from-green-500 to-green-300 transition-all duration-500 ${
            isProgressAnimated ? 'animate-xpProgress' : ''
          }`}
          style={{ width: progressWidth }}
        />
        {isLevelingUp && (
          <>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
            <div className="sparkle"></div>
          </>
        )}
      </div>
    </div>
  );
};

export default React.memo(LevelMeter);