
await import("../src/database/models.registry.js");
const mongoose = (await import("mongoose")).default;
console.log("models registered:", mongoose.modelNames().length);
const { default: app } = await import("../src/app.js");
const router = (await import("../src/routes/v1/index.js")).default;

const collect = (stack, prefix = "") => {
  const out = [];
  for (const layer of stack) {
    if (layer.route) {
      for (const m of Object.keys(layer.route.methods)) out.push(`${m.toUpperCase()} ${prefix}${layer.route.path}`);
    } else if (layer.name === "router" && layer.handle.stack) {
      const src = layer.regexp.source;
      const m = src.match(/^\^\\\/([a-z-]+)/);
      out.push(...collect(layer.handle.stack, prefix + (m ? "/" + m[1] : "")));
    }
  }
  return out;
};
const routes = collect(router.stack).filter((r) => /book|author|publisher|library/.test(r));
console.log(routes.join("\n"));

// ordering check: static routes must come before /:id
const order = (base, statics) => {
  const list = routes.filter((r) => r.includes(base) && r.startsWith("GET"));
  const idIdx = list.findIndex((r) => r.endsWith("/:id"));
  for (const s of statics) {
    const i = list.findIndex((r) => r.endsWith(s));
    console.log(`order ${base}${s} before /:id ->`, i !== -1 && i < idIdx);
  }
};
order("/book-issues", ["/my", "/overdue", "/borrowers/search", "/borrowers/:userId/status"]);
order("/book-copies", ["/barcode/:barcode"]);
process.exit(0);
