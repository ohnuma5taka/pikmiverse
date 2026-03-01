import { pikmiverse, sendPage } from "@/api/api";
import { PageType } from "@/types/page.type";
import React, { useEffect, useRef, useState } from "react";

const deviceButtons = [
  {
    label: "紫_新郎",
    color: "#874da1",
    command: "purple_sparkle_odd",
    disabled: (command: string) => command !== "",
  },
  {
    label: "ピンク_新婦",
    color: "#ff59ac",
    command: "pink_sparkle_even",
    disabled: (command: string) => command !== "purple_sparkle_odd",
  },
  { label: "", color: "", command: "", disabled: () => true },
  {
    label: "光不足",
    color: "#dfdfdf",
    command: "poor_light",
    textColor: "#000",
    disabled: (command: string) => command !== "pink_sparkle_even",
  },
  {
    label: "虹色",
    color: "rainbow",
    command: "rainbow_sparkle_all",
    disabled: (command: string) => command !== "poor_light",
  },
  {
    label: "開花",
    color: "red",
    command: "open_all",
    disabled: (command: string) => command !== "rainbow_sparkle_all",
  },
  {
    label: "白",
    color: "#FFFFFF",
    command: "white_static_all",
    textColor: "#000",
    disabled: (command: string) => command !== "open_all",
  },
  {
    label: "消灯",
    color: "#333333",
    command: "turn_off_all",
    disabled: (command: string) =>
      command !== "pink_sparkle_even" && command !== "white_static_all",
  },
];

const pageButtons = [
  {
    label: "Op",
    color: "blue",
    command: "opening" as PageType,
    textColor: "#fff",
    disabled: (page: PageType) => page !== "idle",
  },
  // { label: "Med", color: "yellow", command: "medium" as PageType, textColor: "#000", disabled: (page: PageType) => page !== 'opening'  },
  {
    label: "End",
    color: "red",
    command: "ending" as PageType,
    textColor: "#fff",
    disabled: (page: PageType) => page !== "opening",
  },
];

export const SwitchPage: React.FC = () => {
  const [page, setPage] = useState<PageType>("idle");
  const [command, setCommand] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://${window.location.host}/ws/page`);
    wsRef.current = ws;
    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      const data = parsed.data;
      setPage(data.page);
    };
    return () => {
      ws.close();
    };
  }, []);

  const getBackground = (color: string) => {
    if (color === "rainbow") {
      return "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)";
    }
    return color;
  };

  return (
    <div className="w-full h-screen bg-black flex justify-center overflow-hidden">
      <div className="w-full max-w-md h-full bg-gray-900 text-white flex flex-col p-3 gap-3">
        <div className="text-center text-lg font-bold tracking-wider shrink-0">
          Remote Controller
        </div>

        {/* 装置 */}
        <div className="flex-1 flex flex-col gap-2">
          <div className="text-sm font-semibold shrink-0 text-center">装置</div>
          <div className="text-xs">command: {command}</div>
          <div className="grid grid-cols-2 gap-2 flex-1">
            {deviceButtons.map((btn) => {
              const disabled = btn.disabled?.(command) ?? false;
              return (
                <button
                  key={btn.label ?? ""}
                  disabled={disabled}
                  onClick={() => {
                    if (btn.command) {
                      pikmiverse(btn.command);
                      setCommand(btn.command);
                    }
                  }}
                  className="rounded-xl text-lg font-bold active:scale-95 transition-transform shadow-lg flex items-center justify-center disabled:opacity-40 disabled:brightness-75 disabled:cursor-not-allowed"
                  style={{
                    background: getBackground(btn.color ?? ""),
                    color: btn.textColor ?? "#fff",
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ページ送り */}
        <div className="flex-[0.7] flex flex-col gap-2">
          <div className="text-sm font-semibold shrink-0 text-center">
            ページ送り
          </div>

          <div className="grid grid-rows-2 gap-2 flex-1">
            {pageButtons.map((btn) => {
              const isDisabled = btn.disabled(page);
              return (
                <button
                  key={btn.label}
                  disabled={isDisabled}
                  onClick={() => {
                    sendPage(btn.command);
                  }}
                  className="rounded-xl text-lg font-bold active:scale-95 transition-transform shadow-lg flex items-center justify-center disabled:opacity-40 disabled:brightness-75 disabled:cursor-not-allowed"
                  style={{
                    background: btn.color,
                    color: btn.textColor ?? "#fff",
                  }}
                >
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
