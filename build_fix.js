const fs = require("fs");
const path = require("path");

function fixDir(dir) {
  const list = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of list) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      if (item.name !== "node_modules" && item.name !== ".next" && item.name !== ".git") {
        fixDir(full);
      }
    } else if (item.isFile() && (item.name.endsWith(".ts") || item.name.endsWith(".tsx") || item.name.endsWith(".js") || item.name.endsWith(".css"))) {
      let raw = fs.readFileSync(full);
      // Remove any UTF-16 BOM or re-encode
      let text = raw.toString("utf8");
      // Replace any corrupted arrow symbols if present
      text = text.replace(/â†’/g, "->").replace(/→/g, "->").replace(/•/g, "-").replace(/👑/g, "").replace(/👤/g, "").replace(/🏢/g, "").replace(/🛵/g, "");
      fs.writeFileSync(full, text, { encoding: "utf8" });
      console.log("Cleaned:", full);
    }
  }
}

fixDir(path.join(__dirname, "src"));
console.log("Done UTF-8 cleanup");
