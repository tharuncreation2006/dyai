
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import "./ProtectedLayout.css";
function ProtectedLayout() {
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  return (
    <div className="app-layout">
      <Sidebar
        onAppearanceClick={() => setAppearanceOpen(true)}
      />

      <main className="app-content">
        <Outlet />
      </main>

      {appearanceOpen && (
        <div className="appearance-placeholder">
          <div>
            <h2>Appearance</h2>
            <p>Chatbot theme customization will be added here.</p>
            <button onClick={() => setAppearanceOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProtectedLayout;
