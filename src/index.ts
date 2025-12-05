import {cf_ai_ogooluwa_bot} from "./durable-object";

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    // WebSocket endpoint for realtime chat
    if (url.pathname === "/realtime") {
      const [client, server] = Object.values(new WebSocketPair());
      server.accept();

      server.addEventListener("message", async (event: any) => {
        const data = JSON.parse(event.data);
        const id = env.cf_ai_ogooluwa_bot.idFromName(data.sessionId || "default");
        const stub = env.cf_ai_ogooluwa_bot.get(id);

        // Add user message to DO
        await stub.fetch("https://do/add", {
          method: "POST",
          body: JSON.stringify({ role: "user", content: data.message }),
        });

        // Get context from DO
        const context = await stub.fetch("https://do/context").then(r => r.json());

        // Call Workers AI with context
        const messages = [
          { role: "system", content: "You are a helpful assistant." },
          ...context.turns,
        ];

        const aiResp = await env.AI.run("@cf/meta/llama-3.3-8b-instruct", { messages });

        server.send(JSON.stringify({ role: "assistant", content: aiResp.response }));
      });

      return new Response(null, { status: 101, webSocket: client });
    }

    return new Response("Expected /realtime WebSocket connection", { status: 400 });
  },
};

// Durable Object implementation
export class cf_ai_ogooluwa_bot {
  state: DurableObjectState;
  env: any;
  turns: Array<{ role: string; content: string }>;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;
    this.turns = [];
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/add") && request.method === "POST") {
      const msg = await request.json();
      this.turns.push(msg);
      await this.state.storage.put("turns", this.turns);
      return new Response("Message added");
    }

    if (url.pathname.endsWith("/context")) {
      const stored = await this.state.storage.get("turns");
      return new Response(JSON.stringify({ turns: stored || [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response("Not found", { status: 404 });
  }
}
