const chatBox = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");
const clearBtn = document.getElementById("clear");
const sessionInput = document.getElementById("sessionId");
const status = document.getElementById("status");

let socket;

function connect() {
  const sessionId = sessionInput.value || "default";
  socket = new WebSocket("wss://ai-powered-app-on-cloudfare-using-llm.ogooluwamary135.workers.dev/realtime
");

  socket.onopen = () => {
    status.textContent = `Connected (session: ${sessionId})`;
    sendBtn.disabled = false;
  };

  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    addMessage(data.role, data.content);
  };

  socket.onclose = () => {
    status.textContent = "Disconnected";
    sendBtn.disabled = true;
  };
}

function addMessage(role, text) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.textContent = `${role}: ${text}`;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

sendBtn.onclick = () => {
  const text = input.value;
  const sessionId = sessionInput.value || "default";
  if (text && socket.readyState === WebSocket.OPEN) {
    addMessage("user", text);
    socket.send(JSON.stringify({ sessionId, message: text }));
    input.value = "";
  }
};

clearBtn.onclick = () => {
  chatBox.innerHTML = "";
};
