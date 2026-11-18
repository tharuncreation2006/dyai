
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Bot, Pencil, Trash2, X,
  Database, FileText, Save, MessageCircle, Share2, Copy
} from "lucide-react";
import api from "../services/api";
import "./Chatbots.css";

function Chatbots() {
  const [chatbots, setChatbots] = useState([]);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // Knowledge Base states
  const [selectedBot, setSelectedBot] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [savingDocuments, setSavingDocuments] = useState(false);
  const [kbMessage, setKbMessage] = useState("");

  const [shareBot, setShareBot] = useState(null);
  const [copyMessage, setCopyMessage] = useState("");
  const emptyForm = {
    name: "",
    description: "",
    welcome_message: "Hello! How can I help you?",
    instructions: "Answer questions clearly and politely.",
    model: "llama3.2:3b",
    language: "English",
    color: "#7C3AED",
    logo: ""
  };

  const [form, setForm] = useState(emptyForm);

  const fetchChatbots = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/chatbots");
      setChatbots(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load chatbots.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChatbots();
  }, []);


  useEffect(() => {
     if (!shareBot) return;

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      }
    }, [shareBot]);
  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
    setShowModal(true);
  };

  const openEdit = (bot) => {
    setEditingId(bot.id);
    setForm({
      name: bot.name || "",
      description: bot.description || "",
      welcome_message: bot.welcome_message || "",
      instructions: bot.instructions || "",
      model: bot.model || "llama3.2:3b",
      language: bot.language || "English",
      color: bot.color || "#7C3AED",
      logo: bot.logo || ""
    });
    
    setError("");
    setShowModal(true);
  };

  
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingId) {
        await api.put(`/api/chatbots/${editingId}`, form);
      } else {
        await api.post("/api/chatbots", form);
      }

      setShowModal(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchChatbots();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to save chatbot.");
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this chatbot?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/api/chatbots/${id}`);
      await fetchChatbots();
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to delete chatbot.");
    }
  };

  const handleLogoUpload = (e) => {
  const file = e.target.files?.[0];

   if (!file) return;

  const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp"
    ];

    if (!allowedTypes.includes(file.type)) {
      setError("Please select a PNG, JPG, or WebP image.");
      return;
    }

    if (file.size > 1024 * 1024) {
      setError("Logo size must be less than 1 MB.");
      return;
    }

    const reader = new FileReader();

      reader.onload = () => {
        setForm((previous) => ({
          ...previous,
          logo: reader.result
        }));
        setError("");
      };

      reader.readAsDataURL(file);
    };
  // Open Knowledge Base
  const openKnowledgeBase = async (bot) => {
    setSelectedBot(bot);
    setDocuments([]);
    setSelectedDocuments([]);
    setKbMessage("");
    setDocumentsLoading(true);

    try {
      const [documentResponse, connectedResponse] = await Promise.all([
        api.get("/api/documents"),
        api.get(`/api/chatbots/${bot.id}/documents`)
      ]);

      const allDocuments = documentResponse.data;
      const connectedDocuments = connectedResponse.data;

      setDocuments(allDocuments);

      setSelectedDocuments(
        connectedDocuments.map((doc) => doc.document_id)
      );
    } catch (err) {
      setKbMessage(
        err.response?.data?.detail ||
        "Unable to load documents. Check your backend."
      );
    } finally {
      setDocumentsLoading(false);
    }
  };

  // Select / deselect document
  const toggleDocument = (documentId) => {
    setSelectedDocuments((previous) =>
      previous.includes(documentId)
        ? previous.filter((id) => id !== documentId)
        : [...previous, documentId]
    );
  };

  // Save document connections
  const saveDocuments = async () => {
    if (!selectedBot) return;

    try {
      setSavingDocuments(true);
      setKbMessage("");

      await api.put(
        `/api/chatbots/${selectedBot.id}/documents`,
        { document_ids: selectedDocuments }
      );

      setKbMessage("Knowledge Base updated successfully!");
    } catch (err) {
      setKbMessage(
        err.response?.data?.detail ||
        "Unable to save document connections."
      );
    } finally {
      setSavingDocuments(false);
    }
  };

  // Open Share Modal
const openShare = (bot) => {
  setShareBot(bot);
  setCopyMessage("");
};

// Generate public chatbot URL
const getShareUrl = (bot) => {
  return `${window.location.origin}/public/${bot.public_id}`;
};


const handlePublish = async (chatbotId) => {
  try {
    const response = await api.post(
      `/api/chatbots/${chatbotId}/publish`
    );

    await fetchChatbots();

    const publicUrl =
      `${window.location.origin}/public/${response.data.public_id}`;

    alert("Chatbot published successfully!");

    try {
      await navigator.clipboard.writeText(publicUrl);
      alert("Public link copied:\n" + publicUrl);
    } catch {
      alert("Your public link is:\n" + publicUrl);
    }
  } catch (error) {
    console.error("Publish error:", error.response?.data || error);
    alert(error.response?.data?.detail || "Publishing failed.");
  }
};

const handleUnpublish = async (chatbotId) => {
  if (!window.confirm("Are you sure you want to unpublish this chatbot?")) {
    return;
  }

  try {
    await api.post(`/api/chatbots/${chatbotId}/unpublish`);

    await fetchChatbots();

    alert("Chatbot unpublished successfully!");
  } catch (error) {
    console.error("Unpublish error:", error.response?.data || error);
    alert(error.response?.data?.detail || "Unpublishing failed.");
  }
};


// Copy public URL
const copyShareLink = async () => {
  if (!shareBot?.public_id) return;

 const shareUrl = getShareUrl(shareBot);

  try {
   await navigator.clipboard.writeText(shareUrl);
   setCopyMessage("Link copied successfully!");
  } catch (err) {
      setCopyMessage("Unable to copy. Please copy the link manually.");
   }
};

  const filteredChatbots = chatbots.filter((bot) =>
    `${bot.name} ${bot.description || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="chatbots-page">
      <div className="chatbots-header">
        <div>
          <span className="page-label">AI WORKSPACE</span>
          <h1>My Chatbots</h1>
          <p>Create and manage your AI assistants.</p>
        </div>

        <button className="create-bot-btn" onClick={openCreate}>
          <Plus size={19} />
          Create Chatbot
        </button>
      </div>

      <div className="chatbots-toolbar">
        <div className="chatbot-search">
          <Search size={19} />
          <input
            type="text"
            placeholder="Search chatbots..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <span>{chatbots.length} Chatbots</span>
      </div>

      {error && !showModal && (
        <div className="chatbot-error">{error}</div>
      )}

      {loading ? (
        <div className="chatbot-empty">Loading chatbots...</div>
      ) : filteredChatbots.length === 0 ? (
        <div className="chatbot-empty">
          <Bot size={45} />
          <h2>No chatbots found</h2>
          <p>Create your first AI chatbot to get started.</p>
          <button className="create-bot-btn" onClick={openCreate}>
            <Plus size={18} /> Create Chatbot
          </button>
        </div>
      ) : (
        <div className="chatbot-grid">
          {filteredChatbots.map((bot) => (
            <div
              className="chatbot-card"
              key={bot.id}
              style={{
                "--bot-color": bot.color || "#7C3AED"
              }}
            >
              <div className="chatbot-card-top">
                <div className="bot-icon">
                  <Bot size={25} />
                </div>
                <span className={`bot-status ${bot.status}`}>
                  {bot.status === "published" ? "Published" : "Unpublished"}
                </span>
              </div>

              <h3>{bot.name}</h3>
              <p>{bot.description || "No description provided."}</p>

              <div className="bot-details">
                <span>Model: {bot.model}</span>
                <span>Language: {bot.language}</span>
              </div>
              
              
              <div className="chatbot-actions">
                 <button
                    type="button"
                    onClick={() => {
                      console.log("Selected chatbot:", bot);
                      console.log("Chatbot ID:", bot.id);
                      navigate(`/chat/${bot.id}`);
                   }}
                   
                 >
                   <MessageCircle size={16} /> Chat
                 </button>
                 <button onClick={() => openEdit(bot)}>
                    <Pencil size={16} /> Edit
                 </button>

                  <button onClick={() => openKnowledgeBase(bot)}>
                   <Database size={16} /> Knowledge 
                  </button>

                  {bot.status === "published" ? (
                    <button
                      type="button"
                      className="unpublish-bot-btn"
                      onClick={() => handleUnpublish(bot.id)}
                    >
                      Unpublish
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="publish-bot-btn"
                      onClick={() => handlePublish(bot.id)}
                    >
                      Publish
                    </button>
                  )}

                   <button
                     className="delete-bot-btn"
                      onClick={() => handleDelete(bot.id)}
                   >
                   <Trash2 size={16} /> Delete
                  </button>
                  {bot.status === "published" && bot.public_id && (
                  <button
                    type="button"
                    onClick={() => openShare(bot)}
                  >
                    <Share2 size={16} /> Share
                  </button>
                )}
                {/* Share Chatbot Modal */}
               
                {shareBot && (
                  <div
                    className="chatbot-modal-overlay"
                    onClick={() => setShareBot(null)}
                  >
                    <div
                      className="chatbot-modal share-modal"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="modal-header">
                        <div>
                          <h2>Share Chatbot</h2>
                          <p>Share {shareBot.name} with anyone.</p>
                        </div>

                        <button
                          className="modal-close"
                          onClick={() => setShareBot(null)}
                        >
                          <X size={21} />
                        </button>
                      </div>

                      <label>Public Chatbot Link</label>

                      <div className="share-link-container">
                        <input
                          type="text"
                          readOnly
                          value={getShareUrl(shareBot)}
                        />

                        <button type="button" onClick={copyShareLink}>
                          <Copy size={17} /> Copy
                        </button>
                      </div>

                      <p className="share-copy-message">
                         {copyMessage || "\u00A0"}
                      </p>

                      <div className="modal-actions">
                        <button
                          className="cancel-btn"
                          onClick={() => setShareBot(null)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
             </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showModal && (
        <div
          className="chatbot-modal-overlay"
          onClick={() => setShowModal(false)}
        >
          <div
            className="chatbot-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>{editingId ? "Edit Chatbot" : "Create Chatbot"}</h2>
                <p>Configure your AI assistant.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <label>Chatbot Name *</label>
              <input
                required
                maxLength={100}
                placeholder="Example: Customer Support Bot"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
              />

              <label>Description</label>
              <textarea
                placeholder="Describe your chatbot..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
              />

              <label>Welcome Message</label>
              <textarea
                value={form.welcome_message}
                onChange={(e) =>
                  setForm({ ...form, welcome_message: e.target.value })
                }
              />

              <label>AI Instructions</label>
              <textarea
                placeholder="Tell the AI how it should behave..."
                value={form.instructions}
                onChange={(e) =>
                  setForm({ ...form, instructions: e.target.value })
                }
              />

              <label>AI Model</label>
              <select
                value={form.model}
                onChange={(e) =>
                  setForm({ ...form, model: e.target.value })
                }
              >
                <option value="llama3.2:3b">Llama 3.2 (3B)</option>
              </select>
              
              <label>Chatbot Logo</label>

                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoUpload}
                />

                {form.logo && (
                  <div className="logo-preview">
                    <img src={form.logo} alt="Chatbot logo preview" />

                    <button
                      type="button"
                      onClick={() =>
                        setForm((previous) => ({
                          ...previous,
                          logo: ""
                        }))
                      }
                    >
                      Remove Logo
                    </button>
                  </div>
                )}

              <label>Chatbot Theme Color</label>

              <div className="color-picker-container">
                <input
                  type="color"
                  value={form.color}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      color: e.target.value
                    })
                  }
                />

                <span>{form.color}</span>
              </div>
              <label>Language</label>
              <select
                value={form.language}
                onChange={(e) =>
                  setForm({ ...form, language: e.target.value })
                }
              >
                <option>English</option>
                <option>Tamil</option>
                <option>Hindi</option>
              </select>

              {error && <div className="chatbot-error">{error}</div>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>

                <button type="submit" className="create-bot-btn">
                  {editingId ? "Save Changes" : "Create Chatbot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Knowledge Base Modal */}
      {selectedBot && (
        <div
          className="chatbot-modal-overlay"
          onClick={() => setSelectedBot(null)}
        >
          <div
            className="chatbot-modal knowledge-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>Knowledge Base</h2>
                <p>Connect documents to {selectedBot.name}.</p>
              </div>

              <button
                className="modal-close"
                onClick={() => setSelectedBot(null)}
              >
                <X size={21} />
              </button>
            </div>

            {documentsLoading ? (
              <p>Loading documents...</p>
            ) : documents.length === 0 ? (
              <div className="chatbot-empty">
                <FileText size={35} />
                <h3>No uploaded documents</h3>
                <p>Upload documents from your Knowledge Base page first.</p>
              </div>
            ) : (
              <div className="knowledge-document-list">
                {documents.map((doc) => (
                  <label
                    className="knowledge-document"
                    key={doc.document_id}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocuments.includes(doc.document_id)}
                      onChange={() => toggleDocument(doc.document_id)}
                    />
                    <FileText size={20} />
                    <span>{doc.filename}</span>
                  </label>
                ))}
              </div>
            )}

            {kbMessage && (
              <div className="chatbot-error">{kbMessage}</div>
            )}

            <div className="modal-actions">
              <button
                className="cancel-btn"
                onClick={() => setSelectedBot(null)}
              >
                Close
              </button>

              <button
                className="create-bot-btn"
                onClick={saveDocuments}
                disabled={documentsLoading || savingDocuments}
              >
                <Save size={17} />
                {savingDocuments ? "Saving..." : "Save Connections"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Chatbots;