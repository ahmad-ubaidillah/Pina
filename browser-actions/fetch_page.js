// Example Browser Action — fetch a public page's title + first heading.
// Usage: browser_action action="script" script="fetch_page" backend="obscura" params={"url":"https://example.com"}
module.exports = async (params, ctx) => {
  const url = String(params?.url ?? "").trim();
  if (!url) return { success: false, error: "params.url required" };
  const r = await fetch(url, { headers: { "user-agent": "Mozilla/5.0 (Pina-Agent)" } });
  const html = await r.text();
  const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
  const h1 = (html.match(/<h1[^>]*>([^<]*)<\/h1>/i) || [])[1] || "";
  return { success: true, url, title: title.trim(), h1: h1.trim(), bytes: html.length };
};
