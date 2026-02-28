import React from "react";
import { motion } from "motion/react";
import { Sparkles, Volume2, VolumeX } from "lucide-react";
import { useSound } from "./SoundContext";

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  const { playSound, toggleBgm, isBgmPlaying } = useSound();

  const handleStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    playSound("start");
    if (!isBgmPlaying) toggleBgm();
    onStart();
  };

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 text-white select-none">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Ambient floating particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-yellow-100 rounded-full opacity-20"
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              scale: Math.random() * 0.5 + 0.5,
            }}
            animate={{
              y: [null, Math.random() * -100],
              opacity: [0.2, 0.5, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              width: Math.random() * 4 + 2,
              height: Math.random() * 4 + 2,
            }}
          />
        ))}
      </div>

      <motion.h1
        className="text-5xl font-bold mb-8 text-yellow-300 tracking-wider text-center drop-shadow-[0_0_10px_rgba(253,224,71,0.5)]"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        ピクミンゲーム
      </motion.h1>

      <motion.button
        onClick={handleStart}
        className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-500 rounded-full text-xl font-bold shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:scale-105 active:scale-95 transition-all border-2 border-green-300/50 flex items-center gap-2 cursor-pointer z-50 pointer-events-auto"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-5 h-5" />
        START
      </motion.button>

      <div
        className="absolute top-4 right-4 z-50 cursor-pointer pointer-events-auto"
        onClick={(e) => {
          e.stopPropagation();
          toggleBgm();
        }}
      >
        {isBgmPlaying ? (
          <Volume2 className="text-white/70 hover:text-white" />
        ) : (
          <VolumeX className="text-white/70 hover:text-white" />
        )}
      </div>
    </div>
  );
};
