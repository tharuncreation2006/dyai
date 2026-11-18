
import { useEffect, useState } from "react";
import api from "../services/api";
import {
  Bot, Globe, MessageSquare, FileText,
  TrendingUp, Eye, EyeOff, RefreshCw
} from "lucide-react";
import "./analytics.css";

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await api.get("/api/analytics/overview");
      setData(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) return <p>Loading analytics...</p>;
  if (error) return <p>{error} <button onClick={loadAnalytics}>Retry</button></p>;
  if (!data) return null;

  const stats = data.overview || {};

  const cards = [
    { title: "Total Chatbots", value: stats.total_chatbots, icon: Bot },
    { title: "Published", value: stats.published_chatbots, icon: Globe },
    { title: "Unpublished", value: stats.unpublished_chatbots, icon: EyeOff },
    { title: "Conversations", value: stats.total_conversations, icon: MessageSquare },
    { title: "Messages", value: stats.total_messages, icon: TrendingUp },
    { title: "Documents", value: stats.total_documents ?? 0, icon: FileText }
  ];

  return (
    <div className="analytics-page">
      <div className="analytics-heading">
        <div>
          <span className="knowledge-label">AI ANALYTICS</span>
          <h1>Analytics Overview</h1>
          <p>Monitor your chatbot platform performance.</p>
        </div>
        <button onClick={loadAnalytics} className="refresh-btn">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="analytics-grid">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div className="analytics-card" key={card.title}>
              <div className="analytics-icon"><Icon size={22} /></div>
              <p>{card.title}</p>
              <h2>{card.value}</h2>
            </div>
          );
        })}
      </div>

      <div className="analytics-table">
        <h2>Chatbot Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Chatbot</th>
              <th>Status</th>
              <th>Conversations</th>
            </tr>
          </thead>
          <tbody>
            {data.chatbot_stats.map((bot) => (
              <tr key={bot.id}>
                <td>{bot.name}</td>
                <td>
                  <span className={bot.is_published ? "status-published" : "status-unpublished"}>
                    {bot.is_published ? "Published" : "Unpublished"}
                  </span>
                </td>
                <td>{bot.conversations}</td>
              </tr>
            ))}
            {data.chatbot_stats.length === 0 && (
              <tr><td colSpan="3">No chatbots created yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
