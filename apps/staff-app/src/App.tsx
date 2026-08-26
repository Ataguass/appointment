import { useState } from 'react';
import LoginPage from './pages/Login';
import DashboardShell from './pages/DashboardShell';

function App() {
  const [user, setUser] = useState<{
    id: string;
    email: string;
    role: string;
    accessToken: string;
  } | null>(null);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  return <DashboardShell user={user} onLogout={() => setUser(null)} />;
}

export default App;
