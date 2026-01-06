import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/common/Layout';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ProfileDesign } from './pages/ProfileDesign';
import BrandStrategy from './pages/BrandStrategy';
import { PostIdeas } from './pages/PostIdeas';
import { DailyLogs } from './pages/DailyLogs';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import ContentLibrary from './pages/ContentLibrary';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/profile" element={<ProfileDesign />} />
            <Route path="/strategy" element={<BrandStrategy />} />
            <Route path="/library" element={<ContentLibrary />} />
            <Route path="/ideas" element={<PostIdeas />} />
            <Route path="/logs" element={<DailyLogs />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
