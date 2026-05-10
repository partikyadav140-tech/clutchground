import { db } from "./src/lib/db";
async function run() {
  const tickets = await db.prepare("SELECT * FROM tickets").all();
  console.log("Tickets:", tickets);
  const replies = await db.prepare("SELECT * FROM ticket_replies").all();
  console.log("Replies:", replies);
  process.exit(0);
}
run();
