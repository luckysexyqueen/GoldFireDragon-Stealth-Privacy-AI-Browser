import { Link } from "react-router-dom";

export default function BottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-sm border-t border-white/10">
      {/* Country */}
      <div className="flex justify-center py-2 border-b border-white/10">
        <span className="text-sm text-white/70">일본</span>
      </div>

      {/* Links */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-6 py-3 gap-2">
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-white/70 hover:underline whitespace-nowrap cursor-pointer">광고</a>
          <a href="#" className="text-sm text-white/70 hover:underline whitespace-nowrap cursor-pointer">비즈니스</a>
          <a href="#" className="text-sm text-white/70 hover:underline whitespace-nowrap cursor-pointer">검색의 원리</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-sm text-white/70 hover:underline whitespace-nowrap cursor-pointer">개인정보처리방침</a>
          <a href="#" className="text-sm text-white/70 hover:underline whitespace-nowrap cursor-pointer">약관</a>
          <a href="#" className="text-sm text-white/70 hover:underline whitespace-nowrap cursor-pointer">설정</a>
          <Link to="/install" className="text-sm text-yellow-400/80 hover:text-yellow-300 hover:underline whitespace-nowrap cursor-pointer flex items-center gap-1">
            <i className="ri-android-line text-xs" />
            <span>APK 다운</span>
          </Link>
          <Link to="/extensions" className="text-sm text-blue-300/80 hover:text-blue-200 hover:underline whitespace-nowrap cursor-pointer flex items-center gap-1">
            <i className="ri-puzzle-line text-xs" />
            <span>확장 프로그램</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
