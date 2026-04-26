import { useState } from "react";
import TopNav from "./components/TopNav";
import SearchBar from "./components/SearchBar";
import BottomNav from "./components/BottomNav";
import SearchResults from "./components/SearchResults";
import ExtensionBanner from "./components/ExtensionBanner";

export default function Home() {
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (q: string) => {
    setSearchQuery(q);
  };

  // 검색결과 화면
  if (searchQuery) {
    return (
      <SearchResults
        query={searchQuery}
        onNewSearch={(q) => setSearchQuery(q)}
      />
    );
  }

  return (
    <div
      className="relative flex flex-col min-h-screen"
      style={{
        backgroundImage: "url('https://cdn-ai.onspace.ai/onspace/project/code/latest/9besdg-WnErExyYPJsw8ZZVzFgW6p-1776522606805196/GoldFireDragonBrowser%20home%20page.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div
        className={`absolute inset-0 transition-all duration-500 ${
          showSearch ? "bg-black/50" : "bg-black/20"
        }`}
      />

      <TopNav />

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-end flex-1 pb-36">

        {/* Logo + Search panel */}
        <div
          className={`flex flex-col items-center w-full transition-all duration-500 ease-out ${
            showSearch
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-10 pointer-events-none"
          }`}
        >
          {/* GoldFireDragonBrowser Logo */}
          <div className="mb-6">
            <img
              src="https://cdn-ai.onspace.ai/onspace/project/code/latest/9besdg-cCYhDexFaSNynPhyC8QrNM-1776790082899152/GoldFireDragonBrowser_logo-removebg-preview.png"
              alt="GoldFireDragonBrowser"
              className="w-[300px] h-[90px] object-contain"
            />
          </div>

          {/* Search */}
          <SearchBar onSearch={handleSearch} />

          {/* Language notice */}
          <p className="mt-5 text-sm text-white/70">
            Google.co.jp 서비스 제공 언어:&nbsp;
            <span className="text-yellow-300 font-medium">한국어</span>
          </p>
        </div>

        {/* Toggle button */}
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`mt-8 flex items-center gap-2 px-6 py-3 rounded-full border transition-all duration-300 cursor-pointer whitespace-nowrap ${
            showSearch
              ? "bg-white/20 border-white/40 text-white backdrop-blur-sm hover:bg-white/30"
              : "bg-yellow-500/80 border-yellow-400 text-white backdrop-blur-sm hover:bg-yellow-500"
          }`}
        >
          <div className="w-5 h-5 flex items-center justify-center">
            <i className={`text-lg transition-transform duration-300 ${
              showSearch ? "ri-close-line" : "ri-search-line"
            }`} />
          </div>
          <span className="text-sm font-medium">
            {showSearch ? "검색 닫기" : "검색 열기"}
          </span>
        </button>

      </main>

      <ExtensionBanner />
      <BottomNav />
    </div>
  );
}
