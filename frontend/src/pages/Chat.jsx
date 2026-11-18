
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Send,
  Bot,
  User,
  Plus,
  MessageSquare,
  Menu,
  X,
  Pencil,
  Trash2
} from "lucide-react";

import api from "../services/api";
import "./Chat.css";

function Chat() {
  const { chatbotId } = useParams();

  const [chatbot, setChatbot] = useState(null);
  const [botLoading, setBotLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);

  const [conversationId, setConversationId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [error, setError] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Load chatbot details
  useEffect(() => {
    let cancelled = false;

    const loadChatbot = async () => {
      if (!chatbotId) {
        setChatbot(null);
        return;
      }

      try {
        setBotLoading(true);
        setError("");

        const response = await api.get(
          `/api/chatbots/${chatbotId}`
        );

        if (!cancelled) {
          setChatbot(response.data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err.response?.data?.detail ||
            "Unable to load chatbot."
          );
        }
      } finally {
        if (!cancelled) {
          setBotLoading(false);
        }
      }
    };

    setConversationId(null);
    setMessages([]);
    setChatbot(null);

    loadChatbot();

    return () => {
      cancelled = true;
    };
  }, [chatbotId]);

  // Load conversations for the selected chatbot
  const fetchConversations = async () => {
    try {
      const response = await api.get("/api/conversations", {
        params: {
          chatbot_id: chatbotId
        }
      });

      setConversations(response.data);
    } catch (err) {
      console.error("Unable to load conversations:", err);
      setError(
        err.response?.data?.detail ||
        "Unable to load conversation history."
      );
    }
  };

  useEffect(() => {
    setConversations([]);
    fetchConversations();
  }, [chatbotId]);

  // Start a new conversation
  const startNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setMessage("");
    setError("");
    setSidebarOpen(false);
  };

  // Open an existing conversation
  const openConversation = async (id) => {
    try {
      setHistoryLoading(true);
      setError("");

      const response = await api.get(
        `/api/conversations/${id}/messages`,
        {
          params: {
            chatbot_id: chatbotId
          }
        }
      );

      setConversationId(id);
      setMessages(response.data);
      setSidebarOpen(false);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load conversation."
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // Rename a conversation
  const renameConversation = async (item) => {
    const newTitle = window.prompt(
      "Enter a new conversation name:",
      item.title || ""
    );

    if (newTitle === null || !newTitle.trim()) return;

    try {
      await api.patch(
        `/api/conversations/${item.conversation_id}`,
        {
          title: newTitle.trim()
        },
        {
          params: {
            chatbot_id: chatbotId
          }
        }
      );

      await fetchConversations();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to rename conversation."
      );
    }
  };

  // Delete a conversation
  const deleteConversation = async (item) => {
    const confirmed = window.confirm(
      `Delete "${item.title || "this conversation"}"? This cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/api/conversations/${item.conversation_id}`,
        {
          params: {
            chatbot_id: chatbotId
          }
        }
      );

      if (conversationId === item.conversation_id) {
        setConversationId(null);
        setMessages([]);
      }

      await fetchConversations();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete conversation."
      );
    }
  };

  // Send a message
  const sendMessage = async (e) => {
    e.preventDefault();

    if (!message.trim() || loading || botLoading) return;

    const userMessage = message.trim();

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: userMessage
      }
    ]);

    setMessage("");
    setLoading(true);
    setError("");

    try {
      const response = await api.post("/api/chat", {
        message: userMessage,
        conversation_id: conversationId,
        use_documents: true,
        chatbot_id: chatbotId || null
      });

      const data = response.data;

      setConversationId(data.conversation_id);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            data.answer ||
            data.response ||
            "No response received."
        }
      ]);

      await fetchConversations();
    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to get an AI response."
      );
    } finally {
      setLoading(false);
    }
  };

  const welcomeMessage =
    chatbot?.welcome_message ||
    "Start a conversation with your AI assistant.";

  return (
    <div className="chat-layout">

      {/* Conversation sidebar */}
      <aside
        className={`chat-sidebar ${
          sidebarOpen ? "open" : "closed"
        }`}
      >
        <div className="sidebar-header">
          <h2>Conversations</h2>

          <button
            className="sidebar-close"
            onClick={() => setSidebarOpen(false)}
            type="button"
          >
            <X size={19} />
          </button>
        </div>

        <button
          className="new-chat-button"
          onClick={startNewChat}
          type="button"
        >
          <Plus size={18} />
          New Chat
        </button>

        <div className="conversation-list">
          {conversations.length === 0 ? (
            <p className="empty-history">
              No previous conversations
            </p>
          ) : (
            conversations.map((item) => (
              <div
                className="conversation-row"
                key={item.conversation_id}
              >
                <button
                  className={`conversation-item ${
                    conversationId === item.conversation_id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    openConversation(item.conversation_id)
                  }
                  type="button"
                >
                  <MessageSquare size={17} />

                  <span>
                    {item.title || "New conversation"}
                  </span>
                </button>

                <div className="conversation-actions">
                  <button
                    type="button"
                    title="Rename conversation"
                    onClick={() => renameConversation(item)}
                  >
                    <Pencil size={15} />
                  </button>

                  <button
                    type="button"
                    title="Delete conversation"
                    onClick={() => deleteConversation(item)}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </aside>

      {/* Main chat area */}
      <main className="chat-main">

        <header className="chat-header">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            type="button"
          >
            <Menu size={21} />
          </button>

          <Bot size={25} />

          <div>
            <h2>
              {botLoading
                ? "Loading chatbot..."
                : chatbot?.name || "AI Chat Playground"}
            </h2>

            <p>
              {chatbot?.description ||
                "Powered by your AI assistant"}
            </p>
          </div>
        </header>

        <section className="chat-messages">

          {historyLoading && (
            <div className="typing-indicator">
              Loading conversation...
            </div>
          )}

          {!historyLoading &&
            messages.length === 0 &&
            !error && (
              <div className="chat-welcome">
                <Bot size={48} />
                <h2>
                  {chatbot?.name || "Start a conversation"}
                </h2>
                <p>{welcomeMessage}</p>
              </div>
            )}

          {messages.map((item, index) => (
            <div
              className={`chat-message ${item.role}`}
              key={index}
            >
              <div className="message-icon">
                {item.role === "user" ? (
                  <User size={19} />
                ) : (
                  <Bot size={19} />
                )}
              </div>

              <div className="message-content">
                {item.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="typing-indicator">
              AI is thinking...
            </div>
          )}

          {error && (
            <div className="chat-error">{error}</div>
          )}
        </section>

        <form
          className="chat-input-form"
          onSubmit={sendMessage}
        >
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              chatbot
                ? `Ask ${chatbot.name} something...`
                : "Ask your AI assistant..."
            }
            disabled={
              loading ||
              botLoading ||
              historyLoading
            }
          />

          <button
            type="submit"
            disabled={
              loading ||
              botLoading ||
              historyLoading ||
              !message.trim()
            }
          >
            <Send size={19} />
          </button>
        </form>

      </main>
    </div>
  );
}

export default Chat;
