import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Ghost, Settings, X } from "lucide-react";
import { StartScreen } from "./StartScreen";
import { SoundType, useSound } from "./SoundContext";
import pikminGhostImg from "@/assets/images/pikmin_ghost.png";
import BackgroundImg from "@/assets/images/game_main_bg.png";
import spawnButtonImg from "@/assets/images/spawn_button.png";
import tutorial1Img from "@/assets/images/tutorial_1.png";
import tutorial2Img from "@/assets/images/tutorial_2.png";
import flowerImg from "@/assets/images/flower.png";
import clearImg from "@/assets/images/clear.png";
import pikminGlowImg from "@/assets/images/pikmin_glow.png";
import pikminWalkGif from "@/assets/gifs/pikmin_walk.gif";
import enemyGif from "@/assets/gifs/enemy.gif";
import flowerIcon from "@/assets/icons/leaf-2-line.svg";
import flowerWhiteIcon from "@/assets/icons/leaf-2-line-white-small.svg";
import timeIcon from "@/assets/icons/time-line.svg";
import fingerTapIcon from "@/assets/icons/finger-tap-line.svg";
import { Team } from "@/types/team.type";
import { getRank, getTargetScore, getTeam } from "@/api/api";

// Game Constants
const DEFAULT_PIKMIN_SPEED = 0.75;
const DEFAULT_ENEMY_SPEED = 0.25;
const DEFAULT_PIKMIN_WIDTH_PCT = 12.5; // %
const DEFAULT_ENEMY_WIDTH_PCT = 25.0; // %
const ENEMY_MIN_Y = 30; // %
const ENEMY_MAX_Y_FROM_BOTTOM = 50; // %
const SPAWN_AREA_HEIGHT_PCT = 20; // %
const MAX_ACTIVE_PIKMINS = 10;
const TAP_SOUND_COUNT = 4;
const BASE_COLOR = "#33324D";

interface GameEntity {
  id: string;
  x: number;
  y: number;
  dead: boolean;
  opacity: number;
}

interface EnemyEntity {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  facing: "left" | "right";
}

type GameState = "start" | "tutorial-1" | "tutorial-2" | "playing" | "clear";

export const GamePage: React.FC = () => {
  const { playSound, toggleBgm, isBgmPlaying, initAudio } = useSound();
  const [userId, setUserId] = useState<string>("");
  const [gameState, setGameState] = useState<GameState>("start");
  const [team, setTeam] = useState<Team | null>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [endTime, setEndTime] = useState<number>(Date.now());
  const [rank, setRank] = useState<number>(0);
  const [targetScore, setTargetScore] = useState<number>(0);
  const [score, setScore] = useState<number>(0);

  // Settings
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState({
    pikminSpeed: DEFAULT_PIKMIN_SPEED,
    enemySpeed: DEFAULT_ENEMY_SPEED,
    pikminSize: DEFAULT_PIKMIN_WIDTH_PCT,
    enemySize: DEFAULT_ENEMY_WIDTH_PCT,
  });

  const enemyDefaultRef = {
    x: 33.33,
    y: ENEMY_MIN_Y,
    targetX: 50,
    targetY: 10,
    facing: "right" as "left" | "right",
  };

  // Refs
  const gameStateRef = useRef<GameState>("start");
  const pikminsRef = useRef<GameEntity[]>([]);
  const enemyRef = useRef<EnemyEntity>(enemyDefaultRef);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const configRef = useRef(config);
  const wsRef = useRef<WebSocket | null>(null);

  // Render State
  const [renderPikmins, setRenderPikmins] = useState<GameEntity[]>([]);
  const [renderEnemy, setRenderEnemy] = useState<EnemyEntity>(enemyDefaultRef);

  useEffect(() => {
    let userId = sessionStorage.getItem("userId");
    if (!userId) {
      userId = crypto.randomUUID();
      sessionStorage.setItem("userId", userId);
    }

    const fetchTeam = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const teamName = params.get("team");

        if (!teamName) {
          console.error("team query is missing");
          return;
        }

        const targetScore = await getTargetScore();
        const data = await getTeam(teamName);
        setTargetScore(targetScore);
        setTeam(data);
        if (data.score >= targetScore) {
          setGameState("clear");
        }
      } catch (err) {
        console.error("Failed to fetch team:", err);
      }
    };

    fetchTeam();
  }, []);

  useEffect(() => {
    if (!team?.name) return;
    const wsUrl = `ws://${window.location.host}/ws/teams/${team.name}/${userId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        const data = parsed.data;

        // チーム合計更新
        setTeam((prev) => (prev ? { ...prev, score: data.score } : prev));
        if (data.score >= targetScore) {
          setGameState("clear");
        }
      } catch (err) {
        console.error("WS parse error", err);
      }
    };
    return () => {
      ws.close();
    };
  }, [team?.name]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    gameStateRef.current = gameState;
    if (gameState === "clear") {
      playSound("clear");
      fetchRank();
      setEndTime(Date.now());
    } else if (gameState === "playing") {
      setStartTime(Date.now());
    }
  }, [gameState, playSound]);

  const handleStartScreenClick = () => {
    initAudio();
    setGameState("tutorial-1");
  };

  const handleTutorialNext = () => {
    playSound("tap");
    setGameState("tutorial-2");
  };

  const handleTutorialStart = () => {
    playSound("start");
    startGame();
  };

  const startGame = () => {
    setGameState("playing");
    pikminsRef.current = [];
    enemyRef.current = enemyDefaultRef;
    setRenderPikmins([]);
    setRenderEnemy(enemyRef.current);
    setStartTime(Date.now());
  };

  const fetchRank = async () => {
    if (team?.name && userId) {
      try {
        const result = await getRank(team.name, userId);
        setRank(result.rank);
        setScore(result.score);
      } catch (err) {
        console.error("Failed to fetch rank", err);
      }
    }
  };

  const sendIncrement = (increment: number) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ data: { increment } });
      wsRef.current.send(message);
    }
  };

  const spawnPikmin = (e: React.MouseEvent | React.TouchEvent) => {
    if (gameStateRef.current !== "playing") return;
    if (showSettings) return;

    // Count alive pikmins
    const activeCount = pikminsRef.current.filter((p) => !p.dead).length;
    if (activeCount >= MAX_ACTIVE_PIKMINS) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    let clientX, clientY;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const { pikminSize } = configRef.current;

    const xPx = clientX - rect.left;
    const yPx = clientY - rect.top;

    const xPct = (xPx / rect.width) * 100;
    const yPct = (yPx / rect.height) * 100;

    if (yPct > 100 - SPAWN_AREA_HEIGHT_PCT) {
      const randomTap =
        `spawn${Math.floor(Math.random() * TAP_SOUND_COUNT) + 1}` as SoundType;
      playSound(randomTap);

      const newPikmin: GameEntity = {
        id: Math.random().toString(36).substr(2, 9),
        x: xPct - pikminSize / 2,
        y: yPct - (pikminSize / 2) * (rect.width / rect.height),
        dead: false,
        opacity: 1,
      };
      pikminsRef.current.push(newPikmin);
    }
  };

  const gameLoop = useCallback(
    (time: number) => {
      if (gameStateRef.current !== "playing") {
        requestRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (!lastTimeRef.current) lastTimeRef.current = time;
      lastTimeRef.current = time;

      const rect = containerRef.current?.getBoundingClientRect();
      const aspect = rect ? rect.width / rect.height : 0.5;

      const { pikminSpeed, enemySpeed, pikminSize, enemySize } =
        configRef.current;

      const pikminSpeedPct = pikminSpeed * 0.2;
      const enemySpeedPct = enemySpeed * 0.2;

      // Enemy Logic
      const enemy = enemyRef.current;
      const dx = enemy.targetX - enemy.x;
      const dy = enemy.targetY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 1) {
        enemy.targetX = Math.random() * (100 - enemySize);
        const maxY = 100 - ENEMY_MAX_Y_FROM_BOTTOM;
        enemy.targetY =
          ENEMY_MIN_Y +
          Math.random() * (maxY - ENEMY_MIN_Y - enemySize * aspect);
      } else {
        const moveX = (dx / dist) * enemySpeedPct;
        const moveY = (dy / dist) * enemySpeedPct;
        enemy.x += moveX;
        enemy.y += moveY;

        if (Math.abs(dx) > 0.1) {
          enemy.facing = dx > 0 ? "right" : "left";
        }
      }

      // Larger HitBox (1.1x) logic
      const enemyCenterX = enemy.x + enemySize / 2;
      const enemyCenterY = enemy.y + (enemySize * aspect) / 2;

      const enemyHitBoxHalfWidth = (enemySize * 1.1) / 2;
      const enemyHitBoxHalfHeight = (enemySize * aspect * 1.1) / 2;

      const enemyHitBox = {
        l: enemyCenterX - enemyHitBoxHalfWidth,
        r: enemyCenterX + enemyHitBoxHalfWidth,
        t: enemyCenterY - enemyHitBoxHalfHeight,
        b: enemyCenterY + enemyHitBoxHalfHeight,
      };

      // Pikmin Logic
      let activePikmins = pikminsRef.current;
      let scoreIncrement = 0;
      let deadCount = 0;

      activePikmins = activePikmins
        .map((p) => {
          if (p.dead) {
            return { ...p, opacity: p.opacity - 0.01 };
          }

          const newY = p.y - pikminSpeedPct;

          if (newY < -5) {
            scoreIncrement++;
            return null;
          }

          const pHeight = pikminSize * aspect;
          const pikminHitBox = {
            l: p.x + 2,
            r: p.x + pikminSize - 2,
            t: newY + 2,
            b: newY + pHeight - 2,
          };

          const collision = !(
            pikminHitBox.r < enemyHitBox.l ||
            pikminHitBox.l > enemyHitBox.r ||
            pikminHitBox.b < enemyHitBox.t ||
            pikminHitBox.t > enemyHitBox.b
          );

          if (collision) {
            deadCount++;
            return { ...p, y: newY, dead: true };
          }

          return { ...p, y: newY };
        })
        .filter((p): p is GameEntity => p !== null && p.opacity > 0);

      if (deadCount > 0) {
        playSound("dead");
      }

      pikminsRef.current = activePikmins;
      if (scoreIncrement > 0) {
        const multiplier = team?.easy ? 2 : 1;
        const totalIncrement = scoreIncrement * multiplier;
        sendIncrement(totalIncrement);
      }

      setRenderPikmins([...activePikmins]);
      setRenderEnemy({ ...enemy });

      requestRef.current = requestAnimationFrame(gameLoop);
    },
    [playSound],
  );

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => {
      if (requestRef.current !== null) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [gameLoop]);

  // Format time
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none touch-none font-sans"
      style={{ backgroundColor: BASE_COLOR }}
      onClick={spawnPikmin}
    >
      {/* Background */}
      <div
        className="absolute inset-0 bg-no-repeat bg-contain bg-center"
        style={{
          backgroundImage: `url(${BackgroundImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {gameState === "start" && (
        <StartScreen onStart={handleStartScreenClick} />
      )}

      {/* Tutorial Modals */}
      {(gameState === "tutorial-1" || gameState === "tutorial-2") && (
        <div
          className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            key={gameState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border p-4 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col gap-4"
            style={{
              paddingTop: "24px",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <h2
              className="text-2xl font-bold"
              style={{
                color: "#F49202",
                letterSpacing: "3%",
              }}
            >
              HOW TO PLAY ({gameState === "tutorial-1" ? 1 : 2}/2)
            </h2>

            <img
              src={gameState === "tutorial-1" ? tutorial1Img : tutorial2Img}
              className="w-full h-full object-cover"
              alt="Tutorial"
            />
            {/* <div className="absolute inset-0 bg-gradient-to-t from-[#33324D] to-transparent" /> */}

            <div className="space-y-4 text-xl">
              {gameState === "tutorial-1" ? (
                <>
                  <p>
                    画面の下の方を指でタップすると
                    <br />
                    あなたのパワーを
                    <br />
                    <span className="font-bold">ピクミンが蕾に運ぶよ！</span>
                  </p>
                  <p className="text-lg">
                    Tap for the Pikmin to carry your
                    <br />
                    power to the flower!
                  </p>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleTutorialNext}
                      className="w-full text-xl px-6 py-3 bg-[#00823C] text-white font-bold rounded-2xl transition-colors"
                    >
                      次へ NEXT
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    ピクミンが蕾にたどり着くと
                    <br />
                    蕾にパワーが溜まります。
                    <br />
                    卓で合計100パワーを目指そう！
                    <br />
                  </p>
                  <p className="text-lg">
                    Collect 100 points as a group with
                    <br />
                    your the people at your table！
                  </p>
                  <div className="flex justify-end mt-4">
                    <button
                      onClick={handleTutorialStart}
                      className="w-full text-xl px-6 py-3 bg-[#00823C] text-white font-bold rounded-2xl transition-colors"
                    >
                      始める START
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Playing UI */}
      {(gameState === "playing" || gameState === "clear") && (
        <>
          {/* Header UI (Card Style) */}
          <div className="absolute top-0 left-0 w-full flex justify-between items-start pointer-events-none">
            {/* Top Center Card */}
            <div className="z-19 absolute left-1/2 -translate-x-1/2 -translate-y-1/5">
              <img src={flowerImg} alt="Flower" />
            </div>
            <div className="z-21 absolute top-2 left-2 pointer-events-auto">
              <div
                className="flex flex-col items-center bg-white/10 backdrop-blur-md
                border border-white/20 text-white px-3 py-2 rounded-2xl shadow-lg text-xl"
              >
                <span>
                  <img
                    src={flowerWhiteIcon}
                    alt="Flower"
                    className="inline-block"
                    style={{ marginBottom: "4px" }}
                  />
                  Table {team?.name ?? "Loading..."}
                </span>
                <div>
                  <span className="text-[#FFD500]">{team?.score ?? 0}</span>
                  <span>/{targetScore}</span>
                </div>
              </div>
            </div>

            {/* Right Controls */}
            <div className="absolute top-4 right-4 flex gap-2 pointer-events-auto">
              {/* Settings Toggle */}
              <div
                className="cursor-pointer p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/60 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowSettings(true);
                }}
              >
                <Settings className="text-white w-5 h-5" />
              </div>
              {/* Audio Toggle */}
              {/* <div
                className="cursor-pointer p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/60 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBgm();
                }}
              >
                {isBgmPlaying ? (
                  <Volume2 className="text-white w-5 h-5" />
                ) : (
                  <VolumeX className="text-white/50 w-5 h-5" />
                )}
              </div> */}
            </div>
          </div>

          <div
            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/40 to-transparent pointer-events-none border-t border-white/5"
            style={{
              height: `${SPAWN_AREA_HEIGHT_PCT}%`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={spawnButtonImg}
              className="w-full animate-pulse relative z-10"
              style={{ margin: "auto" }}
              alt="Spawn Button"
            />
          </div>

          {/* Enemy */}
          <motion.div
            className="absolute z-10 pointer-events-none transition-transform duration-75 ease-out"
            style={{
              left: `${renderEnemy.x}%`,
              top: `${renderEnemy.y}%`,
              width: `${config.enemySize}%`,
            }}
          >
            {/* Facing Container */}
            <motion.div
              animate={{ scaleX: renderEnemy.facing === "right" ? 1 : -1 }}
              transition={{
                duration: 0.25,
                ease: "easeInOut",
              }}
              style={{ originX: 0.5, width: "100%", height: "100%" }}
            >
              <motion.div
                animate={{
                  y: [0, 5, 0],
                  scaleY: [1, 0.95, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="w-full h-full"
              >
                <div className="w-full aspect-square object-contain">
                  <img
                    src={enemyGif}
                    className="w-full h-full object-cover scale-130"
                    alt="Enemy"
                  />
                </div>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Pikmins */}
          <AnimatePresence>
            {renderPikmins.map((p) => (
              <motion.div
                key={p.id}
                className="absolute z-20 pointer-events-none transition-transform duration-75 ease-out"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  width: `${config.pikminSize}%`,
                }}
              >
                {p.dead ? (
                  <motion.div
                    initial={{ y: 0, opacity: 1 }}
                    animate={{ y: "-100%", opacity: 0 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  >
                    <img
                      src={pikminGhostImg}
                      className="w-full h-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                      alt="Ghost"
                      style={{ width: "50%" }}
                    />
                  </motion.div>
                ) : (
                  <motion.div className="relative pikmin-bounce">
                    {/* 🔥 Glow Image */}
                    <img
                      src={pikminGlowImg}
                      alt="glow"
                      className="absolute left-1/2 -translate-x-1/2 pointer-events-none"
                      style={{
                        top: "-25%",
                        maxWidth: "200%",
                        opacity: 0.8,
                        willChange: "transform",
                      }}
                    />

                    {/* Pikmin本体 */}
                    <img
                      src={pikminWalkGif}
                      className="w-full h-auto relative z-10 brightness-110 contrast-125"
                      alt="Pikmin"
                    />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </>
      )}

      {/* Settings Modal */}
      {/* {showSettings && (
        <div
          className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#33324D] border border-white/20 p-6 rounded-2xl w-full max-w-sm shadow-2xl text-white max-h-[80vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Settings className="w-5 h-5" /> Settings
              </h2>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2 text-sm text-gray-400">
                  <span>Pikmin Speed</span>
                  <span>{config.pikminSpeed.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="5.0"
                  step="0.05"
                  value={config.pikminSpeed}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      pikminSpeed: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-green-500 h-2 bg-black/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm text-gray-400">
                  <span>Enemy Speed</span>
                  <span>{config.enemySpeed.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="5.0"
                  step="0.05"
                  value={config.enemySpeed}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      enemySpeed: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-red-500 h-2 bg-black/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm text-gray-400">
                  <span>Pikmin Size (%)</span>
                  <span>{config.pikminSize.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="2.0"
                  max="20.0"
                  step="0.5"
                  value={config.pikminSize}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      pikminSize: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-green-500 h-2 bg-black/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between mb-2 text-sm text-gray-400">
                  <span>Enemy Size (%)</span>
                  <span>{config.enemySize.toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="10.0"
                  max="60.0"
                  step="1.0"
                  value={config.enemySize}
                  onChange={(e) =>
                    setConfig((prev) => ({
                      ...prev,
                      enemySize: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-red-500 h-2 bg-black/30 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 bg-white text-[#33324D] font-bold rounded-lg hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )} */}

      {/* Result Modal */}
      {gameState === "clear" && (
        <div
          className="absolute inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <motion.div
            key={gameState}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white border p-4 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col gap-4"
            style={{
              paddingTop: "24px",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <h2
              className="text-2xl font-bold"
              style={{
                color: "#F49202",
                letterSpacing: "3%",
              }}
            >
              MISSION COMPLETE
            </h2>
            <img
              src={clearImg}
              className="w-full h-full object-cover"
              alt="clear"
              style={{ maxHeight: "30vh" }}
            />
            {rank ? (
              <div className="w-full flex flex-col gap-2 font-bold">
                <div className="w-full flex align-center justify-between">
                  <span className="text-xl">Rank in Table</span>
                  <span className="text-xl text-[#00823C]">
                    <img
                      src={flowerIcon}
                      alt="Flower"
                      className="inline-block"
                      style={{ transform: "scale(0.8)", marginBottom: "4px" }}
                    />
                    {rank}位
                  </span>
                </div>
                <div className="w-full flex justify-between">
                  <span className="text-xl">Time</span>
                  <span className="text-xl text-[#00823C]">
                    <img
                      src={timeIcon}
                      alt="Time"
                      className="inline-block"
                      style={{ transform: "scale(0.8)", marginBottom: "4px" }}
                    />
                    {formatTime(endTime - startTime)}
                  </span>
                </div>
                <div className="w-full flex justify-between">
                  <span className="text-xl">Your Power</span>
                  <span className="text-xl text-[#00823C]">
                    <img
                      src={fingerTapIcon}
                      alt="Finger Tap"
                      className="inline-block"
                      style={{ transform: "scale(0.8)", marginBottom: "4px" }}
                    />
                    {score}
                  </span>
                </div>
              </div>
            ) : (
              <></>
            )}
            {/* <div className="w-80 pt-4">
              <button
                onClick={startGame}
                className="w-full py-4 bg-[#00823C] rounded-full font-bold text-white"
              >
                Play Again
              </button>
            </div> */}
          </motion.div>
        </div>
      )}
    </div>
  );
};
