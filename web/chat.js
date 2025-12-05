const chatBox = document.getElementById("chat");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send");

let socket;

function connect() {
  socket = new WebSocket("wss://YOUR_WORKER_URL/realtime");

  socket.onopen = () => console.log("Connected to Realtime Worker");
  socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    addMessage("assistant", data.content);
  };
  socket.onclose = () => console.log("Disconnected");
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
  if (text && socket.readyState === WebSocket.OPEN) {
    addMessage("user", text);
    socket.send(JSON.stringify({ sessionId: "demo", message: text }));
    input.value = "";
  }
};

