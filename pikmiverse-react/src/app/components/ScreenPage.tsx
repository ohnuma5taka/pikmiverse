import React, { useEffect, useRef, useState } from "react";

import openingVideo from "@/assets/videos/opening.mp4";
import mediumVideo from "@/assets/videos/medium.mp4";
import endingVideo from "@/assets/videos/ending.mp4";
import { PageType } from "@/types/page.type";

export const ScreenPage: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const [page, setPage] = useState<PageType>("idle");
  const [isStarted, setIsStarted] = useState(false);

  // WebSocket接続
  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/page`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      const data = parsed.data;
      setPage(data.page);
    };
    ws.onerror = (e) => {
      console.error(e);
    };
    return () => {
      ws.close();
    };
  }, []);

  // page変更時の動画制御
  useEffect(() => {
    if (!videoRef.current || !isStarted) return;

    const video = videoRef.current;

    if (page === "idle") {
      video.pause();
      video.removeAttribute("src");
      video.load();
      return;
    }

    if (page === "opening") {
      video.src = openingVideo;
      video.loop = false;
    }

    if (page === "medium") {
      video.src = mediumVideo;
      video.loop = true;
    }

    if (page === "ending") {
      video.src = endingVideo;
      video.loop = false;
    }

    video.currentTime = 0;
    video.play().catch(() => {});
  }, [page, isStarted]);

  // opening終了 → mediumへ
  const handleEnded = () => {
    if (page === "opening") {
      setPage("medium");
    }
  };

  const handleStart = () => {
    setIsStarted(true);
  };

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      {/* 動画 */}
      {isStarted && page !== "idle" && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          onEnded={handleEnded}
          playsInline
        />
      )}

      {/* 初回クリック用オーバーレイ */}
      {!isStarted && (
        <div
          onClick={handleStart}
          className="absolute inset-0 bg-black flex items-center justify-center text-white text-2xl cursor-pointer"
        >
          画面をタップして開始
        </div>
      )}
    </div>
  );
};
