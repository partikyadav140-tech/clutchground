const fs = require("fs");

let code = fs.readFileSync("src/api.ts", "utf8");

// 1. Replace db.transaction(() => { ... })();
code = code.replace(/db\.transaction\(\(\) => \{([\s\S]*?)\}\)\(\);/g, (match, body) => {
  let newBody = body.replace(/db\./g, "tx.");
  return "await db.transaction(async (tx) => {" + newBody + "});";
});

// 2. Add await to tx.prepare and db.prepare chained calls
code = code.replace(
  /(tx|db)\.prepare\((.*?)\)\.(get|all|run)\((.*?)\)/g,
  "await $1.prepare($2).$3($4)",
);

// 3. Fix cases where stmt is assigned to a variable and called later
// e.g. const stmt = db.prepare('...'); stmt.run();
const varsToAwait = [
  "stmt",
  "checkStmt",
  "insertStmt",
  "userStmt",
  "old",
  "insertNotif",
  "insertMember",
  "addPrize",
  "insertAdmin",
  "insertTournament",
  "countStmt",
];
varsToAwait.forEach((v) => {
  const regex = new RegExp("\\b" + v + "\\.(run|get|all)\\(", "g");
  code = code.replace(regex, "await " + v + ".$1(");
});

// Remove double awaits
code = code.replace(/await\s+await\s+/g, "await ");

fs.writeFileSync("src/api.ts", code);
console.log("Refactoring completed successfully.");
