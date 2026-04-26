import type { RouteObject } from "react-router-dom";
import NotFound from "../pages/NotFound";
import Home from "../pages/home/page";
import InstallPage from "../pages/install/page";
import ExtensionsPage from "../pages/extensions/page";
import ExtensionOptionsPage from "../pages/extension-options/page";
import ExtensionPopupPage from "../pages/extension-popup/page";
import ExtensionNewtabPage from "../pages/extension-newtab/page";
import ExtensionWelcomePage from "../pages/extension-welcome/page";

const routes: RouteObject[] = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/install",
    element: <InstallPage />,
  },
  {
    path: "/extensions",
    element: <ExtensionsPage />,
  },
  {
    path: "/extension-options",
    element: <ExtensionOptionsPage />,
  },
  {
    path: "/extension-popup",
    element: <ExtensionPopupPage />,
  },
  {
    path: "/extension-newtab",
    element: <ExtensionNewtabPage />,
  },
  {
    path: "/extension-welcome",
    element: <ExtensionWelcomePage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];

export default routes;
