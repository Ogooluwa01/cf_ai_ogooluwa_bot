import {cf_ai_ogooluwa_bot} from "./durable-object";

export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);

    if (url.pathname === "/realtime") {
      const session = await env.REALTIME.createSession();
      session.addEventListener("message", async (event: any) => {
      const data = JSON.parse(event.data);
      const id = env.cf_ai_ogooluwa_bot.idFromName(data.sessionId || "default");
      //add user message to do
      const stub = env.MyAgent.get(id);
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
      session.send(JSON.stringfy({role:"assistant,content:aiResp.response}));
    });

    return session.toResponse();
  },
};
