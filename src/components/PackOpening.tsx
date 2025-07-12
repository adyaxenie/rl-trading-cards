import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from './Card';
import { Player } from '@/lib/database';

interface PackOpeningProps {
  onPackOpened: (remainingCredits: number) => void;
}

export default function PackOpening({ onPackOpened }: PackOpeningProps) {
  const [isOpening, setIsOpening] = useState<boolean>(false);
  const [cards, setCards] = useState<Player[]>([]);
  const [showCards, setShowCards] = useState<boolean>(false);
  const [selectedPack, setSelectedPack] = useState<string>('standard');

  const packTypes = {
    standard: {
      name: 'Standard Pack',
      cost: 50,
      description: '5 cards with standard odds',
      gradient: 'from-yellow-400 to-orange-600',
      border: 'border-yellow-300',
      emoji: '📦',
      odds: {
        'Super': '2%',
        'Epic': '10%', 
        'Rare': '29%',
        'Common': '59%'
      }
    },
    premium: {
      name: 'Premium Pack',
      cost: 200,
      description: '5 cards with BOOSTED Super odds!',
      gradient: 'from-purple-500 via-pink-500 to-yellow-500',
      border: 'border-purple-300',
      emoji: '✨',
      odds: {
        'Super': '50%',
        'Epic': '30%',
        'Rare': '16%', 
        'Common': '4%'
      }
    }
  };

  const openPack = async (packType: string): Promise<void> => {
    setIsOpening(true);
    setSelectedPack(packType);
    
    try {
      const response = await fetch('/api/open-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packType })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCards(data.cards);
        
        // Delay showing cards for dramatic effect
        setTimeout(() => {
          setShowCards(true);
          setIsOpening(false);
        }, 1500);
        
        onPackOpened(data.remainingCredits);
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to open pack');
        setIsOpening(false);
      }
    } catch (error) {
      console.error('Error opening pack:', error);
      setIsOpening(false);
    }
  };

  const resetPack = (): void => {
    setCards([]);
    setShowCards(false);
    setSelectedPack('standard');
  };

  return (
    <div className="text-center">
      <AnimatePresence mode="wait">
        {!showCards ? (
          <motion.div
            key="pack-selection"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center"
          >
            {!isOpening ? (
              <>
                <h3 className="text-2xl font-bold text-white mb-8">Choose Your Pack</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {Object.entries(packTypes).map(([type, pack]) => (
                    <motion.div
                      key={type}
                      className={`w-64 h-96 bg-gradient-to-br ${pack.gradient} 
                                 rounded-xl shadow-2xl cursor-pointer mb-6 flex flex-col items-center justify-between
                                 border-4 ${pack.border} relative overflow-hidden group`}
                      whileHover={{ scale: 1.05, y: -10 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => openPack(type)}
                    >
                      {/* Pack Type Badge */}
                      {type === 'premium' && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-pink-500 to-yellow-400 text-black px-2 py-1 rounded-full text-xs font-bold animate-pulse">
                          HOT!
                        </div>
                      )}
                      
                      {/* Pack Visual */}
                      <div className="flex-1 flex flex-col items-center justify-center text-white">
                        <div className="text-6xl mb-4 group-hover:animate-bounce">{pack.emoji}</div>
                        <div className="text-xl font-bold mb-2">{pack.name}</div>
                        <div className="text-sm mb-4 px-4 text-center">{pack.description}</div>
                        <div className="text-3xl font-bold text-black bg-white/90 px-4 py-2 rounded-lg">
                          {pack.cost} Credits
                        </div>
                      </div>

                      {/* Odds Display */}
                      <div className="w-full bg-black/50 backdrop-blur-sm p-4 text-white">
                        <div className="text-sm font-semibold mb-2">Drop Rates:</div>
                        <div className="grid grid-cols-2 gap-1 text-xs">
                          {Object.entries(pack.odds).map(([rarity, rate]) => (
                            <div key={rarity} className="flex justify-between">
                              <span className={
                                rarity === 'Super' ? 'text-yellow-300' :
                                rarity === 'Epic' ? 'text-purple-300' :
                                rarity === 'Rare' ? 'text-blue-300' :
                                'text-gray-300'
                              }>{rarity}:</span>
                              <span className="font-bold">{rate}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <motion.div
                className={`w-64 h-96 bg-gradient-to-br ${packTypes[selectedPack as keyof typeof packTypes].gradient} 
                           rounded-xl shadow-2xl mb-6 flex items-center justify-center
                           border-4 ${packTypes[selectedPack as keyof typeof packTypes].border}`}
                animate={{ rotateY: 360 }}
                transition={{ duration: 1.5 }}
              >
                <div className="text-white text-center">
                  <div className="text-6xl mb-4 animate-pulse">
                    {packTypes[selectedPack as keyof typeof packTypes].emoji}
                  </div>
                  <div className="text-xl font-bold">Opening...</div>
                  <div className="text-sm">
                    {packTypes[selectedPack as keyof typeof packTypes].name}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <h3 className="text-2xl font-bold text-white mb-2">
                {packTypes[selectedPack as keyof typeof packTypes].name} Results!
              </h3>
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-300">
                {Object.entries(
                  cards.reduce((acc, card) => {
                    acc[card.rarity] = (acc[card.rarity] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                ).map(([rarity, count]) => (
                  <span key={rarity} className={`font-semibold ${
                    rarity === 'Super' ? 'text-yellow-400' :
                    rarity === 'Epic' ? 'text-purple-400' :
                    rarity === 'Rare' ? 'text-blue-400' :
                    'text-gray-400'
                  }`}>
                    {count}x {rarity}
                  </span>
                ))}
              </div>
            </motion.div>

            <div className="flex flex-wrap justify-center gap-4 mb-6">
              {cards.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 50, rotateY: 180 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ delay: index * 0.2, duration: 0.6 }}
                >
                  <Card player={card} />
                </motion.div>
              ))}
            </div>
            
            <motion.button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg
                         font-semibold transition-colors"
              onClick={resetPack}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Open Another Pack
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}