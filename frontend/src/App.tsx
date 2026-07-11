import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import ChatWidget from './components/ChatWidget';
import SearchPage from './pages/SearchPage';
import ProfilePage from './pages/ProfilePage';
import FavoritesPage from './pages/FavoritesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<SearchPage />} />
              <Route path="/player/:pin" element={<ProfilePage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
            </Routes>
          </main>
          <ChatWidget />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
