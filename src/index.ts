import { MyAgent } from "./durable-object";

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    // Example: handle chat route
    if (url.pathname.startsWith("/api/chat")) {
      // Get Durable Object instance for this session
      const id = env.MyAgent.idFromName("session1"); // later: dynamic per user
      const stub = env.MyAgent.get(id);

      // Add user message to DO
      const body = await request.json();
      await stub.fetch("https://do/add", {
        method: "POST",
        body: JSON.stringify(body),
      });

      // Get context from DO
      const context = await stub.fetch("https://do/context").then(r => r.json());

      // Call Workers AI with context
      const messages = [
        { role: "system", content: "You are a helpful assistant." },
        ...context.turns,
      ];
      const aiResp = await env.AI.run("@cf/meta/llama-3.3-8b-instruct", { messages });

      return new Response(aiResp.response);
    }

    return new Response("Worker is alive!");
  },
};
