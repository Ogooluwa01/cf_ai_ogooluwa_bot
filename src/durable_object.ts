export class cf_ai_ogoooluwa_bot {
  state: DurableObjectState;
  storage: DurableObjectStorage;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.storage = state.storage;
  }

  async fetch(request: Request) {
    const url = new URL(request.url);

    if (url.pathname.endsWith("/context")) {
      const turns = (await this.storage.get("turns")) || [];
      return Response.json({ turns });
    }

    if (url.pathname.endsWith("/add")) {
      const body = await request.json();
      const turns = (await this.storage.get("turns")) || [];
      turns.push(body);
      await this.storage.put("turns", turns);
      return new Response("added");
    }

    return new Response("Not found", { status: 404 });
  }
}
