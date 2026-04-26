import { useState } from "react";
import { Link } from "react-router-dom";

export default function TopNav() {
  const [showApps, setShowApps] = useState(false);

  const navLinks = [
    { label: "Gmail", href: "https://mail.google.com" },
    { label: "이미지", href: "https://www.google.co.jp/imghp?hl=ko" },
  ];

  const apps = [
    { label: "계정", icon: "ri-user-line", href: "#" },
    { label: "검색", icon: "ri-search-line", href: "#" },
    { label: "지도", icon: "ri-map-2-line", href: "#" },
    { label: "YouTube", icon: "ri-youtube-line", href: "#" },
    { label: "Play", icon: "ri-google-play-line", href: "#" },
    { label: "뉴스", icon: "ri-newspaper-line", href: "#" },
    { label: "Gmail", icon: "ri-mail-line", href: "#" },
    { label: "주소록", icon: "ri-contacts-line", href: "#" },
    { label: "드라이브", icon: "ri-drive-line", href: "#" },
    { label: "APK 다운", icon: "ri-android-line", href: "/install", internal: true },
    { label: "확장 프로그램", icon: "ri-puzzle-line", href: "/extensions", internal: true },
  ];

  return (
    <div className="fixed top-0 right-0 left-0 z-50 flex items-center justify-end px-4 py-2 bg-black/30 backdrop-blur-sm">
      <nav className="flex items-center gap-1">
        {navLinks.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="text-sm text-white/90 hover:underline px-2 py-1 whitespace-nowrap cursor-pointer"
          >
            {link.label}
          </a>
        ))}

        {/* App grid button */}
        <div className="relative ml-1">
          <button
            onClick={() => setShowApps(!showApps)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 cursor-pointer"
            title="Google 앱"
          >
            <div className="grid grid-cols-3 gap-[3px]">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="w-[4px] h-[4px] rounded-full bg-white" />
              ))}
            </div>
          </button>

          {showApps && (
            <div className="absolute right-0 top-12 w-64 bg-white rounded-2xl shadow-lg border border-gray-200 p-4 z-50">
              <div className="grid grid-cols-3 gap-4">
                {apps.map((app) => (
                  (app as { internal?: boolean }).internal ? (
                    <Link
                      key={app.label}
                      to={app.href}
                      onClick={() => setShowApps(false)}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-green-50 cursor-pointer"
                    >
                      <div className="w-12 h-12 flex items-center justify-center bg-green-100 rounded-full">
                        <i className={`${app.icon} text-green-600 text-xl`} />
                      </div>
                      <span className="text-xs text-[#202124] whitespace-nowrap">{app.label}</span>
                    </Link>
                  ) : (
                    <a
                      key={app.label}
                      href={app.href}
                      className="flex flex-col items-center gap-1 p-2 rounded-xl hover:bg-gray-100 cursor-pointer"
                    >
                      <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-full">
                        <i className={`${app.icon} text-[#5f6368] text-xl`} />
                      </div>
                      <span className="text-xs text-[#202124]">{app.label}</span>
                    </a>
                  )
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Login button */}
        <a
          href="https://accounts.google.com"
          className="ml-2 px-5 py-2 bg-[#1a73e8] text-white text-sm font-medium rounded-md hover:bg-[#1765cc] whitespace-nowrap cursor-pointer"
        >
          로그인
        </a>
      </nav>
    </div>
  );
}
