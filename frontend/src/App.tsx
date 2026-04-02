import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { HomeView } from './components/layout/HomeView';
import { AgentView } from './components/agents/AgentView';
import { SkillsView } from './components/skills/SkillsView';
import { ChatPanel } from './components/chat/ChatPanel';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<HomeView />} />
            <Route path="agent/:agentId" element={<AgentView />} />
            <Route path="skills" element={<SkillsView />} />
            <Route path="chat" element={<ChatPanel />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
