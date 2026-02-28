import React from "react";
import { GameScreen } from "./components/GameScreen";
import { SoundProvider } from "./components/SoundContext";

export default function App() {
  return (
    <SoundProvider>
      <div className="w-full h-screen bg-black overflow-hidden select-none">
        <GameScreen />
      </div>
    </SoundProvider>
  );
}
