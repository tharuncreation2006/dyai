
import { useEffect, useState } from "react";
import { Upload, FileText, Trash2, Database } from "lucide-react";
import api from "../services/api";
import "./KnowledgeBase.css";

function KnowledgeBase() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/api/documents");

      console.log("Documents API response:", response.data);

      setDocuments(response.data);
      setError("");
    } catch (err) {
      setError(err.response?.data?.detail || "Unable to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowed = [".txt", ".pdf", ".docx"];
    const extension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

    if (!allowed.includes(extension)) {
      setError("Only TXT, PDF and DOCX files are supported.");
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      await api.post("/api/documents/upload", formData, {
        headers: { "Content-Type": undefined }
      });

      setSuccess("Document uploaded successfully!");
      await fetchDocuments();
    } catch (err) {
      setError(err.response?.data?.detail || "Document upload failed.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (id) => {
    if (!id || id === "undefined") {
      setError("Document ID is missing. Please refresh the page.");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this document?")) {
      return;
    }

    try {
      setDeletingId(id);
      setError("");
      setSuccess("");

      const response = await api.delete(`/api/documents/${id}`);

      setSuccess(
        response.data.message || "Document deleted successfully!"
      );

      setDocuments((previousDocuments) =>
        previousDocuments.filter(
          (doc) => String(doc.id || doc._id) !== String(id)
        )
      );

    } catch (err) {
      console.error("Delete error:", err);

      setError(
        err.response?.data?.detail || "Unable to delete document."
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="knowledge-page">
      <div className="knowledge-header">
        <div>
          <span className="knowledge-label">AI KNOWLEDGE</span>
          <h1>Knowledge Base</h1>
          <p>Upload documents to give your AI assistants knowledge.</p>
        </div>

        <label className="upload-btn">
          <Upload size={18} />
          {uploading ? "Uploading..." : "Upload Document"}
          <input
            type="file"
            accept=".txt,.pdf,.docx"
            hidden
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </div>

      {success && <div className="knowledge-success">{success}</div>}
      {error && <div className="knowledge-error">{error}</div>}

      <div className="knowledge-stats">
        <Database size={24} />
        <div>
          <h2>{documents.length}</h2>
          <p>Uploaded documents</p>
        </div>
      </div>

      <div className="document-section">
        <h2>Your Documents</h2>

        {loading ? (
          <p>Loading documents...</p>
        ) : documents.length === 0 ? (
          <div className="document-empty">
            <FileText size={42} />
            <h3>No documents uploaded</h3>
            <p>Upload a TXT, PDF or DOCX document to get started.</p>
          </div>
        ) : (
          documents.map((doc) => {
            console.log("Document object:", doc);
            console.log("Document ID:", doc.id, doc._id);

            const documentId = doc.id || doc._id || doc.document_id;

            return (
              <div className="document-card" key={documentId}>
                <FileText size={23} />

                <div className="document-info">
                  <h3>{doc.filename || doc.name || "Document"}</h3>
                  <p>{doc.status || "Uploaded"}</p>
                </div>

                <button
                  className="delete-document-btn"
                  onClick={() => handleDelete(documentId)}
                  title="Delete document"
                  disabled={!documentId || deletingId === documentId}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default KnowledgeBase;
