import { RouteObject } from 'react-router-dom';
import Home from '@/pages/home/page';
import AIAssistantPage from '@/pages/ai-assistant/page';
import PromptsPage from '@/pages/prompts/page';
import AIToolsPage from '@/pages/ai-tools/page';
import WalletPage from '@/pages/wallet/page';
import IPFSPage from '@/pages/ipfs/page';
import MCPPage from '@/pages/mcp/page';
import SettingsPage from '@/pages/settings/page';
import AIBuilderPage from '@/pages/ai-builder/page';
import AIBuilderEditPage from '@/pages/ai-builder/edit/page';
import AIBuilderChatPage from '@/pages/ai-builder/chat/page';
import MyCharactersPage from '@/pages/my-characters/page';
import ExtensionsPage from '@/pages/extensions/page';
import UserscriptsPage from '@/pages/userscripts/page';
import GalleryPage from '@/pages/gallery/page';
import NotFound from '@/pages/NotFound';

const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  { path: '/ai-assistant', element: <AIAssistantPage /> },
  { path: '/prompts', element: <PromptsPage /> },
  { path: '/ai-tools', element: <AIToolsPage /> },
  { path: '/wallet', element: <WalletPage /> },
  { path: '/ipfs', element: <IPFSPage /> },
  { path: '/mcp', element: <MCPPage /> },
  { path: '/settings', element: <SettingsPage /> },
  { path: '/ai-builder', element: <AIBuilderPage /> },
  { path: '/ai-builder/:id', element: <AIBuilderEditPage /> },
  { path: '/ai-builder/:id/chat', element: <AIBuilderChatPage /> },
  { path: '/my-characters', element: <MyCharactersPage /> },
  { path: '/extensions', element: <ExtensionsPage /> },
  { path: '/userscripts', element: <UserscriptsPage /> },
  { path: '/gallery', element: <GalleryPage /> },
  { path: '*', element: <NotFound /> },
];

export default routes;