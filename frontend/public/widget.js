
(function () {
  const script = document.currentScript;

  const chatbotId = script?.getAttribute("data-chatbot-id");
  const baseUrl =
    script?.getAttribute("data-base-url") ||
    new URL(script.src).origin;

  if (!chatbotId) {
    console.error("Chatbot Widget: data-chatbot-id is missing.");
    return;
  }

  // Prevent duplicate widget installation.
  if (document.getElementById("dynamic-ai-widget")) return;

  const host = document.createElement("div");
  host.id = "dynamic-ai-widget";
  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: "open" });

  shadow.innerHTML = `
    <style>
      * {
        box-sizing: border-box;
      }

      .chat-button {
        position: fixed;
        right: 24px;
        bottom: 24px;
        width: 60px;
        height: 60px;
        border: none;
        border-radius: 50%;
        background: #06b6d4;
        color: #06121a;
        font-size: 27px;
        cursor: pointer;
        box-shadow: 0 5px 20px rgba(0,0,0,.3);
        z-index: 999999;
      }

      .chat-panel {
        display: none;
        position: fixed;
        right: 24px;
        bottom: 98px;
        width: 380px;
        height: 560px;
        max-height: calc(100vh - 120px);
        background: white;
        border-radius: 14px;
        overflow: hidden;
        box-shadow: 0 8px 35px rgba(0,0,0,.25);
        z-index: 999999;
      }

      .chat-panel.open {
        display: block;
      }

      .chat-frame {
        width: 100%;
        height: 100%;
        border: none;
        display: block;
      }

      @media (max-width: 480px) {
        .chat-panel {
          width: calc(100vw - 20px);
          height: calc(100vh - 110px);
          max-height: none;
          right: 10px;
          bottom: 85px;
        }

        .chat-button {
          right: 16px;
          bottom: 16px;
        }
      }
    </style>

    <div class="chat-panel">
      <iframe
        class="chat-frame"
        title="AI Chatbot"
        loading="lazy"
      ></iframe>
    </div>

    <button class="chat-button" type="button"
      aria-label="Open chat">
      💬
    </button>
  `;

  const button = shadow.querySelector(".chat-button");
  const panel = shadow.querySelector(".chat-panel");
  const frame = shadow.querySelector(".chat-frame");

  let loaded = false;

  button.addEventListener("click", function () {
    const isOpen = panel.classList.toggle("open");

    if (isOpen && !loaded) {
      frame.src =
        `${baseUrl}/public/${encodeURIComponent(chatbotId)}`;
      loaded = true;
    }

    button.textContent = isOpen ? "×" : "💬";
  });
})();
