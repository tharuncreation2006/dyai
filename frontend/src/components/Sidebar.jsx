
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Bot,
  MessageSquare,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  BarChart3,
  Palette
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Sidebar.css";

function Sidebar({ onAppearanceClick }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Chatbots", path: "/chatbots", icon: Bot },
    { name: "Knowledge Base", path: "/knowledge", icon: FileText },
    { name: "Analytics", path: "/analytics", icon: BarChart3 },
    { name: "AI Chat", path: "/chat", icon: MessageSquare }
  ];

  return (
    <>
      <button
        className="sidebar-mobile-toggle"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        ☰
      </button>

      {menuOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${menuOpen ? "open" : ""}`}>
        <div className="brand">
          <Bot size={30} />
          <span>Dynamic AI</span>
        </div>

        <nav>
          {links.map(({ name, path, icon: Icon }) => (
            <button
              key={path}
              className={`nav-item ${
                location.pathname === path ||
                (path === "/chat" && location.pathname.startsWith("/chat/"))
                  ? "active"
                  : ""
              }`}
              onClick={() => handleNavigate(path)}
            >
              <Icon size={19} />
              {name}
            </button>
          ))}

          
        </nav>

        <div className="sidebar-bottom">
          

          <button
            className="nav-item logout"
            onClick={handleLogout}
          >
            <LogOut size={19} />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
