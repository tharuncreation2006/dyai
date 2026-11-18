
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bot,
  MessageSquare,
  FileText,
  Plus,
  Activity
} from "lucide-react";
import api from "../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [totalChatbots, setTotalChatbots] = useState(0);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const results = await Promise.allSettled([
          api.get("/api/documents"),
          api.get("/api/conversations"),
          api.get("/api/analytics/overview")
        ]);

        // Documents
        if (results[0].status === "fulfilled") {
          const docs = results[0].value.data;
          setDocuments(
            Array.isArray(docs) ? docs : docs?.documents || []
          );
        } else {
          console.error("Documents loading failed:", results[0].reason);
        }

        // Conversations
        if (results[1].status === "fulfilled") {
          const chats = results[1].value.data;
          setConversations(
            Array.isArray(chats)
              ? chats
              : chats?.conversations || []
          );
        } else {
          console.error("Conversations loading failed:", results[1].reason);
        }

        // Chatbot count from analytics API
        if (results[2].status === "fulfilled") {
          const analytics = results[2].value.data;

          setTotalChatbots(
            analytics?.overview?.total_chatbots ?? 0
          );
        } else {
          console.error("Analytics loading failed:", results[2].reason);
        }

      } catch (error) {
        console.error("Dashboard loading failed:", error);
      }
    };

    loadDashboard();
  }, []);

  return (
    <div className="dashboard-page">
      <main className="dashboard-main">

        {/* Header */}
        <header className="topbar">
          <div>
            <span className="knowledge-label">AI DASHBOARD</span>
            <h2>Dashboard</h2>
            <p>Your AI workspace overview</p>
          </div>

          <div className="profile">
            <div className="avatar">AI</div>
            <span>Workspace</span>
          </div>
        </header>

        {/* Welcome */}
        <section className="welcome">
          <div>
            <h1>Welcome back! 👋</h1>
            <p>Manage your AI chatbots and knowledge sources.</p>
          </div>

          <button
            className="create-button"
            onClick={() => navigate("/chatbots")}
          >
            <Plus size={19} />
            Create Chatbot
          </button>
        </section>

        {/* Statistics */}
        <section className="stats-grid">

          <div className="stat-card">
            <div className="stat-icon cyan">
              <Bot />
            </div>
            <p>Total Chatbots</p>
            <h2>{totalChatbots}</h2>
            <span>Your created AI chatbots</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">
              <FileText />
            </div>
            <p>Documents</p>
            <h2>{documents.length}</h2>
            <span>Uploaded knowledge sources</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <MessageSquare />
            </div>
            <p>Conversations</p>
            <h2>{conversations.length}</h2>
            <span>Total conversations</span>
          </div>

          <div className="stat-card">
            <div className="stat-icon green">
              <Activity />
            </div>
            <p>AI Status</p>
            <h2>Ready</h2>
            <span>Connects to your AI backend</span>
          </div>

        </section>

        {/* Recent Content */}
        <section className="content-grid">

          {/* Recent Conversations */}
          <div className="content-card">
            <div className="section-heading">
              <div>
                <h3>Recent Conversations</h3>
                <p>Your latest AI conversations</p>
              </div>
              <MessageSquare />
            </div>

            {conversations.length === 0 ? (
              <div className="empty-state">
                <MessageSquare size={35} />
                <p>No conversations yet</p>
              </div>
            ) : (
              conversations.slice(0, 5).map((chat, index) => {
                const conversationId =
                  chat.conversation_id || chat.id || chat._id;

                return (
                  <div
                    className="recent-item"
                    key={conversationId || index}
                  >
                    <MessageSquare size={20} />

                    <span>
                      {chat.title || "Untitled conversation"}
                    </span>

                    <button
                      disabled={!conversationId}
                      onClick={() =>
                        navigate("/chat", {
                          state: {
                            conversationId
                          }
                        })
                      }
                    >
                      Open
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Knowledge Sources */}
          <div className="content-card">
            <div className="section-heading">
              <div>
                <h3>Knowledge Sources</h3>
                <p>Your uploaded documents</p>
              </div>
              <FileText />
            </div>

            {documents.length === 0 ? (
              <div className="empty-state">
                <FileText size={35} />
                <p>No documents uploaded</p>
              </div>
            ) : (
              documents.slice(0, 5).map((doc, index) => {
                const documentId =
                  doc.id || doc._id || doc.document_id;

                return (
                  <div
                    className="recent-item"
                    key={documentId || index}
                  >
                    <FileText size={20} />
                    <span>
                      {doc.filename || doc.name || "Document"}
                    </span>
                  </div>
                );
              })
            )}
          </div>

        </section>

      </main>
    </div>
  );
}

export default Dashboard;
