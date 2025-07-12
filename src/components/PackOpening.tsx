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

  const openPack = async (): Promise<void> => {
    setIsOpening(true);
    
    try {
      const response = await fetch('/api/open-pack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      }
    } catch (error) {
      console.error('Error opening pack:', error);
      setIsOpening(false);
    }
  };

  const resetPack = (): void => {
    setCards([]);
    setShowCards(false);
  };

  return (
    <div className="text-center">
      <AnimatePresence mode="wait">
        {!showCards ? (
          <motion.div
            key="pack"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center"
          >
            <motion.div
              className="w-64 h-96 bg-gradient-to-br from-yellow-400 to-orange-600 
                         rounded-xl shadow-2xl cursor-pointer mb-6 flex items-center justify-center
                         border-4 border-yellow-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openPack}
              animate={isOpening ? { rotateY: 360 } : {}}
              transition={{ duration: 1.5 }}
            >
              <div className="text-white text-center">
                <div className="text-6xl mb-4">📦</div>
                <div className="text-xl font-bold">
                  {isOpening ? 'Opening...' : 'Click to Open'}
                </div>
                <div className="text-sm">Standard Pack</div>
                <div className="text-sm">50 Credits</div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="cards"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center"
          >
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