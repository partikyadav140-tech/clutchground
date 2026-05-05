const fs = require("fs");
let content = fs.readFileSync("src/api.ts", "utf8");

const newCode = `
export const deleteUser = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    const { id } = data as unknown as { id: number };
    
    // First, clear any sessions for this user so they are immediately logged out
    await db.prepare("DELETE FROM sessions WHERE user_id = $1").run(id);
    
    // Then delete the user (cascade deletes will handle the rest)
    await db.prepare("DELETE FROM users WHERE id = $1").run(id);
    
    return { success: true };
  });

export const deleteAllUsers = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    // Only keep admin (assuming role = 'admin')
    await db.prepare("DELETE FROM users WHERE role != 'admin'").run();
    return { success: true };
  });

export const deleteAllTournaments = createServerFn({ method: "POST" })
  .handler(async ({ data }) => {
    const { db } = await import("./lib/db");
    await db.prepare("DELETE FROM tournaments").run();
    return { success: true };
  });
`;

fs.writeFileSync("src/api.ts", content + "\n" + newCode);
