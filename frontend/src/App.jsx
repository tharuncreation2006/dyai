import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

import Analytics from "./pages/analytics";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Chatbots from "./pages/Chatbots";
import KnowledgeBase from "./pages/KnowledgeBase";
import Chat from "./pages/Chat";
import PublicChat from "./pages/PublicChat";

import ProtectedLayout from "./components/ProtectedLayout";

function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div>Loading application...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/public/:publicId" element={<PublicChat />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chatbots" element={<Chatbots />} />
          <Route path="/knowledge" element={<KnowledgeBase />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/chat/:chatbotId" element={<Chat />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;