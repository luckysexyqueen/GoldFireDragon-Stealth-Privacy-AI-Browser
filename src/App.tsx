import { BrowserRouter, useNavigate } from "react-router-dom";
import { AppRoutes } from "./router";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import { useEffect } from "react";

// window.REACT_APP_NAVIGATE를 라우터에 연결하는 내부 컴포넌트
function NavigateConnector() {
  const navigate = useNavigate();
  useEffect(() => {
    // FreeAIServicePanel, ChatInterface 등에서 window.REACT_APP_NAVIGATE('/settings') 호출 가능
    (window as unknown as Record<string, unknown>).REACT_APP_NAVIGATE = navigate;
    return () => {
      delete (window as unknown as Record<string, unknown>).REACT_APP_NAVIGATE;
    };
  }, [navigate]);
  return null;
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <BrowserRouter basename={__BASE_PATH__}>
        <NavigateConnector />
        <AppRoutes />
      </BrowserRouter>
    </I18nextProvider>
  );
}

export default App;
