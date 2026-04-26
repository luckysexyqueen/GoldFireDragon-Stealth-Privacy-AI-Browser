import { useState, useRef, useEffect } from "react";
import { ENGINES, Engine } from "./engines";

interface EngineSelectorProps {
  selectedId: string;
  onChange: (id: string) => void;
  variant?: "dark" | "light";
}

export default function EngineSelector({ selectedId, onChange, variant = "dark" }: EngineSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = ENGINES.find((e) => e.id === selectedId) ?? ENGINES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isDark = variant === "dark";

  return (
    <div ref={ref} className="relative">
      {/* 선택된 엔진 버튼 */}
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
          isDark
            ? "bg-white/10 border-white/20 text-white hover:bg-white/20"
            : "bg-gray-100 border-gray-200 text-[#3c4043] hover:bg-gray-200"
        }`}
      >
        <span className="text-sm leading-none">{selected.emoji}</span>
        <span>{selected.name}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold ${selected.badgeColor}`}>
          {selected.badge}
        </span>
        <i className={`ri-arrow-down-s-line text-sm transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {/* 드롭다운 */}
      {open && (
        <div className="absolute bottom-full mb-2 left-0 w-64 bg-white rounded-2xl border border-gray-100 overflow-hidden z-[100]"
          style={{ boxShadow: "0 8px 30px rgba(0,0,0,0.15)" }}
        >
          <div className="px-3 pt-3 pb-1">
            <p className="text-xs font-semibold text-[#5f6368] tracking-wide uppercase">검색 엔진 선택</p>
          </div>
          {ENGINES.map((engine: Engine) => (
            <button
              key={engine.id}
              onClick={() => { onChange(engine.id); setOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors cursor-pointer ${
                engine.id === selectedId
                  ? "bg-[#1a73e8]/8 text-[#1a73e8]"
                  : "text-[#202124] hover:bg-gray-50"
              }`}
            >
              <span className="text-xl leading-none w-6 text-center">{engine.emoji}</span>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">{engine.name}</p>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full text-white font-bold shrink-0 ${engine.badgeColor}`}>
                {engine.badge}
              </span>
              {engine.id === selectedId && (
                <i className="ri-check-line text-[#1a73e8] text-base shrink-0" />
              )}
            </button>
          ))}
          <div className="px-3 py-2 border-t border-gray-100">
            <p className="text-[10px] text-[#9aa0a6]">
              🐉 FireDragon = 일본 Google + 스텔스 UA
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
