import React from 'react';
import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { Toaster } from '@/components/ui/sonner';
import { FavoritesProvider } from '@/contexts/FavoritesContext';
import { LocaleProvider } from '@/hooks/useLocale';

import { routes } from './routes';

const App: React.FC = () => {
  return (
    <Router>
      <LocaleProvider>
        <FavoritesProvider>
          <IntersectObserver />
          <div className="flex flex-col min-h-screen">
            <main className="flex-grow">
              <Routes>
                {routes.map((route, index) => (
                  <Route
                    key={index}
                    path={route.path}
                    element={route.element}
                  />
                ))}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </div>
          <Toaster />
        </FavoritesProvider>
      </LocaleProvider>
    </Router>
  );
};

export default App;
