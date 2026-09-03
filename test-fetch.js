async function test() {
  try {
    const res = await fetch("https://api.gapgpt.app/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Dastavval/1.0" },
      body: JSON.stringify({ model: "gpt-4o-mini", messages: [{role: "user", content: "test"}] })
    });
    console.log(res.status);
    console.log(await res.text());
  } catch(e) {
    console.error("Error:", e.message);
  }
}
test();
