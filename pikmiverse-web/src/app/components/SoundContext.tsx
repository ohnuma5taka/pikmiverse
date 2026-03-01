import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";

import spawn1Audio from "@/assets/sounds/spawn1.mov";
import spawn2Audio from "@/assets/sounds/spawn2.mov";
import spawn3Audio from "@/assets/sounds/spawn3.mov";
import spawn4Audio from "@/assets/sounds/spawn4.mov";
import deadAudio from "@/assets/sounds/dead.mp3";
import clearAudio from "@/assets/sounds/clear.mp3";

export type SoundType =
  | "tap"
  | "spawn1"
  | "spawn2"
  | "spawn3"
  | "spawn4"
  | "clear"
  | "start"
  | "dead";

interface SoundContextType {
  playSound: (type: SoundType) => void;
  toggleBgm: () => void;
  isBgmPlaying: boolean;
  initAudio: () => void;
}

const SoundContext = createContext<SoundContextType>({
  playSound: () => {},
  toggleBgm: () => {},
  isBgmPlaying: false,
  initAudio: () => {},
});

export const useSound = () => useContext(SoundContext);

export const SoundProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgmOscillatorsRef = useRef<OscillatorNode[]>([]);
  const bgmGainNodeRef = useRef<GainNode | null>(null);
  const audioFileCache = useRef<Partial<Record<SoundType, HTMLAudioElement>>>(
    {},
  );
  const audioFileMap: Partial<Record<SoundType, string>> = {
    spawn1: spawn1Audio,
    spawn2: spawn2Audio,
    spawn3: spawn3Audio,
    spawn4: spawn4Audio,
    dead: deadAudio,
    clear: clearAudio,
  };

  const initAudio = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        audioContextRef.current = new AudioContextClass();
      }
    }

    if (
      audioContextRef.current &&
      audioContextRef.current.state === "suspended"
    ) {
      audioContextRef.current
        .resume()
        .catch((err) => console.error("Audio resume failed", err));
    }
  }, []);

  useEffect(() => {
    const handleInteraction = () => {
      initAudio();
    };

    window.addEventListener("click", handleInteraction, { once: true });
    window.addEventListener("touchstart", handleInteraction, { once: true });
    window.addEventListener("keydown", handleInteraction, { once: true });

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [initAudio]);

  const playSound = useCallback(
    (type: SoundType) => {
      // ----------------------------
      // 🎵 mp3再生（重なり対応版）
      // ----------------------------
      if (audioFileMap[type]) {
        const audio = new Audio(audioFileMap[type]!);
        audio.volume = type.includes("spawn") ? 0.3 : 1; // 必要なら調整
        audio.play().catch(() => {});
        return;
      }

      // ----------------------------
      // 🔊 WebAudio（tap / start)
      // ----------------------------
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "suspended"
      ) {
        initAudio();
      }

      if (!audioContextRef.current) return;
      const ctx = audioContextRef.current;

      if (ctx.state === "suspended") return;

      try {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        switch (type) {
          case "tap":
            osc.type = "sine";
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.start(now);
            osc.stop(now + 0.1);
            break;

          case "start":
            osc.type = "triangle";
            osc.frequency.setValueAtTime(400, now);
            osc.frequency.linearRampToValueAtTime(800, now + 0.5);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.2);
            gain.gain.linearRampToValueAtTime(0, now + 0.5);
            osc.start(now);
            osc.stop(now + 0.5);
            break;
        }
      } catch (e) {
        console.error("Audio playback error:", e);
      }
    },
    [initAudio],
  );

  const startBgm = useCallback(() => {
    initAudio();
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;

    // Stop existing BGM if any
    if (bgmOscillatorsRef.current.length > 0) {
      stopBgm();
    }

    try {
      // Ambient Drone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc1.frequency.value = 110; // A2
      osc2.type = "sine";
      osc2.frequency.value = 164.81; // E3

      // LFO for modulation
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.2;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 50;
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 2); // Fade in

      osc1.start();
      osc2.start();
      lfo.start();

      bgmOscillatorsRef.current = [osc1, osc2, lfo];
      bgmGainNodeRef.current = gain;
      setIsBgmPlaying(true);
    } catch (e) {
      console.error("BGM start error:", e);
    }
  }, [initAudio]);

  const stopBgm = useCallback(() => {
    if (bgmGainNodeRef.current && audioContextRef.current) {
      const gain = bgmGainNodeRef.current;
      const ctx = audioContextRef.current;
      try {
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);

        setTimeout(() => {
          bgmOscillatorsRef.current.forEach((o) => {
            try {
              o.stop();
            } catch (e) {}
          });
          bgmOscillatorsRef.current = [];
        }, 500);
      } catch (e) {
        console.error(e);
      }
    }
    setIsBgmPlaying(false);
  }, []);

  // const toggleBgm = useCallback(() => {
  //   if (isBgmPlaying) {
  //     stopBgm();
  //   } else {
  //     startBgm();
  //   }
  // }, [isBgmPlaying, startBgm, stopBgm]);

  const toggleBgm = useCallback(() => {
    // BGM disabled
    return;
  }, []);

  return (
    <SoundContext.Provider
      value={{ playSound, toggleBgm, isBgmPlaying, initAudio }}
    >
      {children}
    </SoundContext.Provider>
  );
};
