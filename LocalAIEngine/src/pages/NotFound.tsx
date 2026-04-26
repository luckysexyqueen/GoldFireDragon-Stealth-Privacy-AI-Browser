import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Cpu, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center glass-panel rounded-2xl p-12 max-w-md mx-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[rgba(0,212,170,0.15)] to-[rgba(0,212,255,0.1)] border border-[rgba(0,212,170,0.2)] flex items-center justify-center mx-auto mb-6">
          <Cpu className="w-8 h-8 text-[#00d4aa]" />
        </div>
        <h1 className="text-6xl font-bold text-gradient-green terminal-text mb-4">404</h1>
        <p className="text-gray-400 text-sm terminal-text mb-6">경로를 찾을 수 없습니다: {location.pathname}</p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(0,212,170,0.12)] border border-[rgba(0,212,170,0.3)] text-[#00d4aa] text-sm font-medium terminal-text hover:bg-[rgba(0,212,170,0.2)] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
