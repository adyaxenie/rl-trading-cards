import { motion } from 'framer-motion';
import { Player } from '@/lib/database';

interface CardProps {
  player: Player;
  isRevealed?: boolean;
  onClick?: () => void;
}

const rarityColors = {
  'Super': 'from-black via-gray-900 to-black',
  'Epic': 'from-yellow-600 via-yellow-400 to-yellow-600',
  'Rare': 'from-slate-600 via-slate-400 to-slate-600',
  'Common': 'from-amber-700 via-amber-500 to-amber-700',
};

const rarityGlow = {
  'Super': 'shadow-glow-super',
  'Epic': 'shadow-glow-epic',
  'Rare': 'shadow-glow-rare',
  'Common': 'shadow-glow-common',
};

const rarityBorder = {
  'Super': 'border-white',
  'Epic': 'border-yellow-500',
  'Rare': 'border-slate-500',
  'Common': 'border-amber-600',
};

export default function Card({ player, isRevealed = true, onClick }: CardProps) {
  const cardVariants = {
    hidden: { rotateY: 0, scale: 0.8 },
    revealed: { rotateY: 0, scale: 1 },
    hover: { scale: 1.05, rotateY: 5 }
  };

  return (
    <motion.div
      className={`relative w-48 h-72 cursor-pointer perspective-1000 rounded-xl ${rarityGlow[player.rarity]}`}
      variants={cardVariants}
      initial="hidden"
      animate={isRevealed ? "revealed" : "hidden"}
      whileHover="hover"
      onClick={onClick}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <div className={`w-full h-full rounded-xl border-2 ${rarityBorder[player.rarity]} 
                      bg-gradient-to-br ${rarityColors[player.rarity]} 
                      bg-metal-800 relative overflow-hidden`}>
        
        {/* Foil effect for Super cards */}
        {player.rarity === 'Super' && (
          <>
            {/* Holographic overlay */}
            <div className="absolute inset-0 opacity-30 bg-gradient-to-tr from-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
            
            {/* Shimmer effect */}
            <div className="absolute inset-0 opacity-40 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 animate-shimmer" />
            
            {/* Reflective highlights */}
            <div className="absolute top-4 left-4 right-4 h-16 rounded-lg opacity-20 bg-gradient-to-b from-white/60 to-transparent" />
          </>
        )}
        
        {/* Rarity Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-bold z-10
                        ${player.rarity === 'Super' ? 'bg-white text-black' : 
                          player.rarity === 'Epic' ? 'bg-yellow-600 text-black' :
                          player.rarity === 'Rare' ? 'bg-slate-600 text-white' :
                          'bg-amber-600 text-white'}`}>
          {player.rarity}
        </div>

        {/* Player Image Placeholder */}
        <div className="w-full h-32 bg-metal-700 flex items-center justify-center mt-4 relative z-10">
          <div className="text-4xl font-bold text-white">{player.name.charAt(0)}</div>
        </div>

        {/* Player Info */}
        <div className="p-4 text-white relative z-10">
          <h3 className="font-bold text-lg mb-1">{player.name}</h3>
          <p className="text-sm text-gray-300 mb-2">{player.team} • {player.region}</p>
          <div className="text-center mb-2">
            <span className="text-2xl font-bold">{player.overall_rating}</span>
            <span className="text-sm text-gray-400 ml-1">OVR</span>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 gap-1 text-xs">
            <div className="flex justify-between">
              <span>DEF</span>
              <span>{player.defense}</span>
            </div>
            <div className="flex justify-between">
              <span>OFF</span>
              <span>{player.offense}</span>
            </div>
            <div className="flex justify-between">
              <span>MEC</span>
              <span>{player.mechanics}</span>
            </div>
            <div className="flex justify-between">
              <span>CHA</span>
              <span>{player.challenges}</span>
            </div>
            <div className="flex justify-between">
              <span>IQ</span>
              <span>{player.game_iq}</span>
            </div>
            <div className="flex justify-between">
              <span>SYN</span>
              <span>{player.team_sync}</span>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%) skewX(-12deg); }
          100% { transform: translateX(200%) skewX(-12deg); }
        }
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
      `}</style>
    </motion.div>
  );
}