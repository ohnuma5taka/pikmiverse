import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SoundProvider } from "@/app/components/SoundContext";
import { GamePage } from "@/app/components/GamePage";
import { SwitchPage } from "@/app/components/SwitchPage";
import { ScreenPage } from "@/app/components/ScreenPage";

export default function App() {
  return (
    <BrowserRouter>
      <SoundProvider>
        <div
          className="bg-black overflow-hidden select-none"
          style={{
            height: "100dvh",
            width: "100vw",
          }}
        >
          <Routes>
            {/* ルートアクセス時にリダイレクト */}
            <Route path="/" element={<Navigate to="/pikmiverse" replace />} />

            <Route path="/pikmiverse" element={<GamePage />} />
            <Route path="/switch" element={<SwitchPage />} />
            <Route path="/screen" element={<ScreenPage />} />

            {/* 存在しないURL対策（任意） */}
            <Route path="*" element={<Navigate to="/pikmiverse" replace />} />
          </Routes>
        </div>
      </SoundProvider>
    </BrowserRouter>
  );
}
