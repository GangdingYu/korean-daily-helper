import type { ReactNode } from 'react';
import Favorites from './pages/Favorites';
import Home from './pages/Home';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
  /** Accessible without login. Routes without this flag require authentication. Has no effect when RouteGuard is not in use. */
  public?: boolean;
}

export const routes: RouteConfig[] = [
  {
    name: '韩语学习助手',
    path: '/',
    element: <Home />,
    public: true,
  },
  {
    name: '我的收藏',
    path: '/favorites',
    element: <Favorites />,
    public: true,
  },
];
