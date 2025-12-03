export default {
  async fetch(request, env) {
    const id = env.MyAgent.idFromName("session1"); // later: dynamic per user
    const stub = env.MyAgent.get(id);

    // Add user message to DO
    await stub.fetch("https://do/add", {
      method: "POST",
      body: JSON.stringify({ role: "user", content: "Hello AI!" })
    });

    // Get context from DO
    const context = await stub.fetch("https://do/context").then(r => r.json());

    // Call LLM with context
    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      ...context.turns
    ];
    const aiResp = await env.AI.run("@cf/meta/llama-3.3-8b-instruct", { messages });

    return new Response(aiResp.response);
  }
};
