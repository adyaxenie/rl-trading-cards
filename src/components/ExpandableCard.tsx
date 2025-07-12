"use client";
import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/useOutsideClick";
import { Player } from "@/lib/database";
import { X } from "lucide-react";

interface ExpandableCardProps {
  player: Player;
  quantity: number;
  firstObtained: Date;
}

const rarityColors = {
  'Super': 'from-black via-black-100 to-black',
  'Epic': 'from-purple-600 via-purple-400 to-purple-600',
  'Rare': 'from-blue-600 via-blue-400 to-blue-600',
  'Common': 'from-gray-600 via-gray-400 to-gray-600',
};

const rarityGlow = {
  'Super': 'shadow-glow-super',
  'Epic': 'shadow-glow-epic',
  'Rare': 'shadow-glow-rare',
  'Common': 'shadow-glow-common',
};

const rarityBorder = {
  'Super': 'border-white',
  'Epic': 'border-purple-500',
  'Rare': 'border-blue-500',
  'Common': 'border-gray-500',
};

const rarityBadgeStyle = {
  'Super': 'bg-white text-black font-bold',
  'Epic': 'bg-purple-600 text-white font-bold',
  'Rare': 'bg-blue-600 text-white font-bold',
  'Common': 'bg-gray-600 text-white font-medium',
};

export function ExpandableCard({ player, quantity, firstObtained }: ExpandableCardProps) {
  const [active, setActive] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(false));

  const StatBar = ({ label, value, max = 100 }: { label: string; value: number; max?: number }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-gray-200">{label}</span>
        <span className="font-semibold text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            value >= 90 ? 'bg-gradient-to-r from-yellow-400 to-yellow-200' :
            value >= 80 ? 'bg-gradient-to-r from-purple-500 to-purple-300' :
            value >= 70 ? 'bg-gradient-to-r from-blue-500 to-blue-300' :
            'bg-gradient-to-r from-gray-500 to-gray-300'
          }`}
          style={{ width: `${(value / max) * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <>
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md h-full w-full z-50"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && (
          <div className="fixed inset-0 grid place-items-center z-50 p-4">
            <motion.div
              layoutId={`card-${player.id}-${id}`}
              ref={ref}
              className="w-full max-w-2xl h-full md:h-fit md:max-h-[90%] flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl overflow-hidden border border-white/20"
            >
              <motion.div className="flex justify-between items-start p-6">
                <div className="flex flex-col">
                  <motion.h3
                    layoutId={`title-${player.id}-${id}`}
                    className="text-3xl font-bold text-white mb-2"
                  >
                    {player.name}
                  </motion.h3>
                  <motion.p
                    layoutId={`team-${player.id}-${id}`}
                    className="text-lg text-gray-300"
                  >
                    {player.team} • {player.region}
                  </motion.p>
                </div>
                <motion.button
                  layoutId={`close-${player.id}-${id}`}
                  onClick={() => setActive(false)}
                  className="p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
                >
                  <X className="w-6 h-6 text-white" />
                </motion.button>
              </motion.div>

              <div className="px-6 pb-6 flex-1 overflow-y-auto">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Left Column - Card Visual */}
                  <div className="space-y-4">
                    <motion.div
                      layoutId={`card-visual-${player.id}-${id}`}
                      className={`relative w-full aspect-[3/4] rounded-xl border-2 ${rarityBorder[player.rarity]} 
                                  bg-gradient-to-br ${rarityColors[player.rarity]} 
                                  bg-metal-800 overflow-hidden ${rarityGlow[player.rarity]}`}
                    >
                      {/* Rarity Badge */}
                      <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-sm ${rarityBadgeStyle[player.rarity]}`}>
                        {player.rarity}
                      </div>

                      {/* Quantity Badge */}
                      {quantity > 1 && (
                        <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-bold border border-white/20">
                          x{quantity}
                        </div>
                      )}

                      {/* Player Image Placeholder */}
                      <div className="w-full h-40 bg-metal-700 flex items-center justify-center mt-6">
                        <div className="text-6xl font-bold text-white">{player.name.charAt(0)}</div>
                      </div>

                      {/* Overall Rating */}
                      <div className="absolute bottom-4 left-4 right-4 text-center">
                        <div className="text-4xl font-bold text-white mb-1">{player.overall_rating}</div>
                        <div className="text-sm text-gray-200">OVERALL</div>
                      </div>
                    </motion.div>

                    {/* Collection Info */}
                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                      <h4 className="text-lg font-semibold text-white mb-3">Collection Info</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">Quantity:</span>
                          <span className="text-white font-bold">x{quantity}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">First Obtained:</span>
                          <span className="text-white">{new Date(firstObtained).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">Rarity:</span>
                          <span className={`font-bold ${
                            player.rarity === 'Super' ? 'text-yellow-300' :
                            player.rarity === 'Epic' ? 'text-purple-400' :
                            player.rarity === 'Rare' ? 'text-blue-400' :
                            'text-gray-400'
                          }`}>
                            {player.rarity}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Stats */}
                  <div className="space-y-6">
                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <h4 className="text-xl font-semibold text-white mb-6">Player Stats</h4>
                      <div className="space-y-4">
                        <StatBar label="Defense" value={player.defense} />
                        <StatBar label="Offense" value={player.offense} />
                        <StatBar label="Mechanics" value={player.mechanics} />
                        <StatBar label="Challenges" value={player.challenges} />
                        <StatBar label="Game IQ" value={player.game_iq} />
                        <StatBar label="Team Sync" value={player.team_sync} />
                      </div>
                    </div>

                    {/* Performance Breakdown */}
                    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                      <h4 className="text-xl font-semibold text-white mb-4">Performance</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-400">
                            {Math.round((player.defense + player.challenges) / 2)}
                          </div>
                          <div className="text-sm text-gray-300">Defensive</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-red-400">
                            {Math.round((player.offense + player.mechanics) / 2)}
                          </div>
                          <div className="text-sm text-gray-300">Offensive</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-400">
                            {player.game_iq}
                          </div>
                          <div className="text-sm text-gray-300">IQ</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-purple-400">
                            {player.team_sync}
                          </div>
                          <div className="text-sm text-gray-300">Teamwork</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Collapsed Card */}
      <motion.div
        layoutId={`card-${player.id}-${id}`}
        onClick={() => setActive(true)}
        className={`relative w-full h-80 cursor-pointer rounded-xl border-2 ${rarityBorder[player.rarity]} 
                    bg-gradient-to-br ${rarityColors[player.rarity]} 
                    bg-metal-800 overflow-hidden hover:scale-105 transition-all duration-300 ${rarityGlow[player.rarity]}`}
      >
        {/* Rarity Badge */}
        <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs ${rarityBadgeStyle[player.rarity]}`}>
          {player.rarity}
        </div>

        {/* Quantity Badge */}
        {quantity > 1 && (
          <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-bold border border-white/20">
            x{quantity}
          </div>
        )}

        {/* Player Image Placeholder */}
        <motion.div 
          layoutId={`card-visual-${player.id}-${id}`}
          className="w-full h-32 bg-metal-700 flex items-center justify-center mt-4"
        >
          <div className="text-4xl font-bold text-white">{player.name.charAt(0)}</div>
        </motion.div>

        {/* Player Info */}
        <div className="p-4 text-white">
          <motion.h3 
            layoutId={`title-${player.id}-${id}`}
            className="font-bold text-lg mb-1"
          >
            {player.name}
          </motion.h3>
          <motion.p 
            layoutId={`team-${player.id}-${id}`}
            className="text-sm text-gray-300 mb-2"
          >
            {player.team} • {player.region}
          </motion.p>
          <div className="text-center mb-2">
            <span className="text-2xl font-bold">{player.overall_rating}</span>
            <span className="text-sm text-gray-400 ml-1">OVR</span>
          </div>
          
          {/* Condensed Stats */}
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
          </div>
        </div>
      </motion.div>
    </>
  );
}