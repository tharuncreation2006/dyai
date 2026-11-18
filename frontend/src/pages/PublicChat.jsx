
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { jsPDF } from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel
} from "docx";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import api from "../services/api";
import "./PublicChat.css";
import { Moon, Sun } from "lucide-react";

function PublicChat() {
  const { publicId } = useParams();

  const [chatbot, setChatbot] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const [theme, setTheme] = useState("light");
  const [showExportMenu, setShowExportMenu] = useState(false);

  const [visitor, setVisitor] = useState({
    name: "",
    email: "",
    mobile: ""
  });

  const [visitorSubmitted, setVisitorSubmitted] = useState(false);
  const [visitorSaving, setVisitorSaving] = useState(false);

  const messagesEndRef = useRef(null);

  // Format date and time
  const formatDateTime = (date) => {
    return new Date(date).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  };

  // Safe filename
  const getFileName = (extension) => {
    const name = (chatbot?.name || "Chatbot")
      .replace(/[^a-z0-9]/gi, "_");

    return `${name}_Chat_Export.${extension}`;
  };

  // Load chatbot
  useEffect(() => {
    const fetchChatbot = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get(
          `/api/public/${publicId}`
        );

        setChatbot(response.data.chatbot || response.data);
      } catch (err) {
        setError(
          typeof err.response?.data?.detail === "string"
            ? err.response.data.detail
            : "Unable to load chatbot."
        );
      } finally {
        setLoading(false);
      }
    };

    if (publicId) {
      fetchChatbot();
    } else {
      setError("Invalid chatbot link.");
      setLoading(false);
    }
  }, [publicId]);

  // Scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth"
    });
  }, [messages, sending]);

  // Save visitor details
  const handleVisitorSubmit = async (e) => {
    e.preventDefault();

    if (visitorSaving) return;

    try {
      setVisitorSaving(true);
      setError("");

      await api.post(
        `/api/public/${publicId}/visitors`,
        visitor
      );

      setVisitorSubmitted(true);
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to save your details. Please try again."
      );
    } finally {
      setVisitorSaving(false);
    }
  };

  // Send chat message
  const sendMessage = async (e) => {
    e.preventDefault();

    const question = input.trim();

    if (!question || sending) return;

    setInput("");
    setError("");

    // Save user message with timestamp
    setMessages((previous) => [
      ...previous,
      {
        role: "user",
        content: question,
        createdAt: new Date().toISOString()
      }
    ]);

    setSending(true);

    try {
      const response = await api.post(
        `/api/public/${publicId}/chat`,
        {
          message: question,
          conversation_id: conversationId,
          use_documents: true
        }
      );

      setConversationId(response.data.conversation_id);

      // Save AI response with timestamp
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          content: response.data.answer,
          createdAt: new Date().toISOString()
        }
      ]);
    } catch (err) {
      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to send your message. Please try again."
      );
    } finally {
      setSending(false);
    }
  };

  // Common transcript details
  const getTranscriptInfo = () => {
    return {
      exportDate: formatDateTime(new Date()),
      assistant: chatbot.name,
      totalMessages: messages.length
    };
  };

  // EXPORT AS PDF
  const exportPDF = () => {
    if (!messages.length) return;

    const pdf = new jsPDF();
    const info = getTranscriptInfo();

    let y = 20;

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(17);

    pdf.text(
      `${info.assistant} - Chatbot Conversation Transcript`,
      15,
      y,
      { maxWidth: 180 }
    );

    y += 15;

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10);

    pdf.text(`Exported on: ${info.exportDate}`, 15, y);
    y += 7;

    pdf.text(
      `Total Messages: ${info.totalMessages} | Assistant: ${info.assistant}`,
      15,
      y
    );

    y += 12;

    pdf.setDrawColor(180, 180, 180);
    pdf.line(15, y, 195, y);
    y += 10;

    messages.forEach((message) => {
      const sender =
        message.role === "user" ? "User" : info.assistant;

      const time = formatDateTime(
        message.createdAt || new Date()
      );

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(11);

      if (y > 265) {
        pdf.addPage();
        y = 20;
      }

      pdf.text(`${sender} (${time})`, 15, y);
      y += 7;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(10);

      const lines = pdf.splitTextToSize(
        message.content || "",
        175
      );

      lines.forEach((line) => {
        if (y > 275) {
          pdf.addPage();
          y = 20;
        }

        pdf.text(line, 15, y);
        y += 6;
      });

      y += 8;
    });

    // Footer on every page
    const pageCount = pdf.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "italic");

     pdf.text(
      `Generated by ${info.assistant}`,
      105,
      290,
      { align: "center" }
    );
    }

    pdf.save(getFileName("pdf"));
    setShowExportMenu(false);
  };

  // EXPORT AS WORD
  const exportWord = async () => {
    if (!messages.length) return;

    const info = getTranscriptInfo();

    const children = [
      new Paragraph({
        text: "dyanamic- Chatbot Conversation Transcript",
        heading: HeadingLevel.HEADING_1
      }),

      new Paragraph({
        text: `Export Date: ${info.exportDate}`
      }),

      new Paragraph({
        text: `Assistant: ${info.assistant} | Total Messages: ${info.totalMessages}`
      }),

      new Paragraph({ text: "" })
    ];

    messages.forEach((message) => {
      const sender =
        message.role === "user" ? "User" : info.assistant;

      const time = formatDateTime(
        message.createdAt || new Date()
      );

      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${sender}    ${time}`,
              bold: true
            })
          ]
        })
      );

      children.push(
        new Paragraph({
          text: message.content || ""
        })
      );

      children.push(
        new Paragraph({ text: "" })
      );
    });

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: "Generated by dyanamic AI Assistant ",
            italics: true
          })
        ]
      })
    );

    const doc = new Document({
      sections: [
        {
          children
        }
      ]
    });

    const blob = await Packer.toBlob(doc);

    saveAs(blob, getFileName("docx"));

    setShowExportMenu(false);
  };

  // EXPORT AS EXCEL
  const exportExcel = () => {
    if (!messages.length) return;

    const info = getTranscriptInfo();

    const rows = [
      ["dyanamic- Chatbot Conversation Transcript"],
      [`Export Date: ${info.exportDate}`],
      [`Assistant: ${info.assistant}`],
      [`Total Messages: ${info.totalMessages}`],
      [],
      ["Date & Time", "Sender", "Message"]
    ];

    messages.forEach((message) => {
      rows.push([
        formatDateTime(message.createdAt || new Date()),
        message.role === "user" ? "User" : info.assistant,
        message.content || ""
      ]);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(rows);

    worksheet["!cols"] = [
      { wch: 25 },
      { wch: 22 },
      { wch: 80 }
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Chat Transcript"
    );

    XLSX.writeFile(
      workbook,
      getFileName("xlsx")
    );

    setShowExportMenu(false);
  };

  // Loading
  if (loading) {
    return (
      <div className="public-loading">
        Loading chatbot...
      </div>
    );
  }

  // Chatbot not found
  if (!chatbot) {
    return (
      <div className="public-error-page">
        <h2>Chatbot unavailable</h2>
        <p>
          {error || "This chatbot may not exist or may have been unpublished."}
        </p>
      </div>
    );
  }

  // Visitor registration form
  if (!visitorSubmitted) {
    return (
      <div
        className={`public-chat-page public-theme-${theme}`}
        style={{
          "--bot-color": chatbot.color || "#7C3AED"
        }}
      >
        <div className="visitor-form-container">

          <div className="public-avatar">
            {chatbot.logo ? (
              <img src={chatbot.logo} alt="Chatbot logo" />
            ) : (
              chatbot.name?.charAt(0)?.toUpperCase() || "AI"
            )}
          </div>

          <button
            type="button"
            className="public-theme-toggle"
            onClick={() =>
              setTheme((previous) =>
                previous === "light" ? "dark" : "light"
              )
            }
          >
            {theme === "light" ? <span><Moon size={16} /> Dark</span> : <span><Sun size={16} /> Light</span>}
          </button>

          <h2>{chatbot.name}</h2>

          <p>Please enter your details to start chatting.</p>

          <form onSubmit={handleVisitorSubmit}>

            <input
              type="text"
              placeholder="Your Name"
              value={visitor.name}
              onChange={(e) =>
                setVisitor({
                  ...visitor,
                  name: e.target.value
                })
              }
              required
            />

            <input
              type="email"
              placeholder="Email Address"
              value={visitor.email}
              onChange={(e) =>
                setVisitor({
                  ...visitor,
                  email: e.target.value
                })
              }
              required
            />

            <input
              type="tel"
              placeholder="Mobile Number"
              value={visitor.mobile}
              onChange={(e) =>
                setVisitor({
                  ...visitor,
                  mobile: e.target.value
                })
              }
              pattern="[0-9]{10}"
              maxLength={10}
              required
            />

            {error && (
              <p className="public-chat-error">{error}</p>
            )}

            <button type="submit" disabled={visitorSaving}>
              {visitorSaving ? "Saving..." : "Start Chatting"}
            </button>

          </form>

          <small>
            Your details are required to start this conversation.
          </small>

        </div>
      </div>
    );
  }

  // Chat interface
  return (
    <div
      className={`public-chat-page public-theme-${theme}`}
      style={{
        "--bot-color": chatbot.color || "#7C3AED"
      }}
    >
      <div className="public-chat-container">

        <header className="public-chat-header">

          <div className="public-avatar">
            {chatbot.logo ? (
              <img src={chatbot.logo} alt={`${chatbot.name} logo`} />
            ) : (
              chatbot.name?.charAt(0)?.toUpperCase() || "AI"
            )}
          </div>

          <div className="public-chat-heading">
            <h2>{chatbot.name}</h2>
            <p>{chatbot.description || "AI Assistant"}</p>
          </div>

          {/* Export Chat */}
          <div className="public-export-wrapper">

            <button
              type="button"
              className="public-export-btn"
              onClick={() =>
                setShowExportMenu((previous) => !previous)
              }
              disabled={messages.length === 0}
            >
              ⬇ Export Chat
            </button>

            {showExportMenu && (
              <div className="public-export-menu">

                <button type="button" onClick={exportPDF}>
                  📄 Export as PDF
                </button>

                <button type="button" onClick={exportWord}>
                  📝 Export as Word
                </button>

                <button type="button" onClick={exportExcel}>
                  📊 Export as Excel
                </button>

              </div>
            )}

          </div>

          <button
            type="button"
            className="public-theme-toggle"
            onClick={() =>
              setTheme((previous) =>
                previous === "light" ? "dark" : "light"
              )
            }
          >
            {theme === "light" ? <span><Moon size={16} /> Dark</span> : <span><Sun size={16} /> Light</span>}
          </button>

          <span className="public-online">Online</span>

        </header>

        <main className="public-chat-messages">

          {messages.map((message, index) => (
            <div
              key={index}
              className={`public-message ${
                message.role === "user"
                  ? "public-user-message"
                  : "public-ai-message"
              }`}
            >
              <div className="public-message-bubble">
                {message.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="public-message public-ai-message">
              <div className="public-message-bubble typing">
                Thinking...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />

        </main>

        {error && (
          <div className="public-chat-error">
            {error}
          </div>
        )}

        <form
          className="public-chat-input-area"
          onSubmit={sendMessage}
        >

          <input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={sending}
          />

          <button
            type="submit"
            disabled={!input.trim() || sending}
          >
            {sending ? "Sending..." : "Send"}
          </button>

        </form>

        <footer className="public-chat-footer">
          Powered by Dynamic AI Chatbot Platform
        </footer>

      </div>
    </div>
  );
}

export default PublicChat;
