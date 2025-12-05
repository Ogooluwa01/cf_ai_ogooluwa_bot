export class cf_ai_ogooluwa_bot {
  state: DurableObjectState;
  env: any;
  clients: Set<WebSocket>;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
    this.clients = new Set();
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    // Handle WebSocket connections
    if (request.headers.get("Upgrade") === "websocket") {
      const [client, server] = Object.values(new WebSocketPair());
      server.accept();

      this.clients.add(server);

      server.addEventListener("message", async (event) => {
        const data = JSON.parse(event.data);

        // Store user message
        const turns = (await this.state.storage.get("turns")) || [];
        turns.push({ role: "user", content: data.message });
        await this.state.storage.put("turns", turns);

        // Build context
        const messages = [
          { role: "system", content: "You are a helpful assistant." },
          ...turns,
        ];

        // Call Workers AI with streaming
        const response = await this.env.AI.run("@cf/meta/llama-3.3-8b-instruct", {
          messages,
          stream: true,
        });

        for await (const chunk of response) {
          const msg = { role: "assistant", content: chunk.response ?? "" };

          // Save assistant response
          turns.push(msg);
          await this.state.storage.put("turns", turns);

          // Broadcast to all clients
          for (const ws of this.clients) {
            try {
              ws.send(JSON.stringify(msg));
            } catch {
              this.clients.delete(ws);
            }
          }
        }
      });

      server.addEventListener("close", () => {
        this.clients.delete(server);
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    // REST endpoints for context/history
    if (url.pathname.endsWith("/context")) {
      const turns = (await this.state.storage.get("turns")) || [];
      return Response.json({ turns });
    }

    if (url.pathname.endsWith("/add")) {
      const body = await request.json();
      const turns = (await this.state.storage.get("turns")) || [];
      turns.push(body);
      await this.state.storage.put("turns", turns);
      return new Response("added");
    }

    return new Response("Not found", { status: 404 });
  }
}
