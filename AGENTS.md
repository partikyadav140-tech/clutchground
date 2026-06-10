# ClutchGround AI Agent Guide

**Project**: ClutchGround | Free Fire esports tournament platform | [README.md](README.md)

---

## Quick Start for AI Agents

### Essential Knowledge
1. **No REST API** — All backend calls use `createServerFn()` from TanStack Start (RPC-style)
2. **Type-Safe**: Server functions are fully typed; server code is in `src/api.ts`
3. **Database**: PostgreSQL on Supabase with custom pool wrapper in `src/lib/db.ts`
4. **Routing**: TanStack Router; routes auto-generated in `routeTree.gen.ts`
5. **UI Library**: shadcn/ui + Radix primitives + Tailwind CSS 4
6. **Build**: Vite 7 with multi-target deployment (Vercel/Workers/Node.js)

### Build & Run Commands
```bash
npm run dev        # Start dev server (:8080) with hot reload
npm run build      # Production build
npm run lint       # Run ESLint
npm run format     # Run Prettier
npm run preview    # Preview production build locally
```

### Key Directories
- **Routes** → `src/routes/_app/` (TanStack Router file-based routing)
- **Server Functions** → `src/api.ts` (all `createServerFn()` handlers)
- **UI Components** → `src/components/ui/` (30+ shadcn/ui components)
- **Utilities** → `src/lib/` (db, auth, payments, notifications, etc.)
- **Team Management** → `src/routes/_app/team-chat.tsx` + `src/lib/team-utils.ts`

---

## Chat History Feature

### Current Status
- **UI**: Team chat page exists at `/team-chat` with mock messages
- **Database**: `chat_messages` table ready (sender_id, receiver_id, team_id, message, is_read, created_at)
- **Auto-cleanup**: Cron job runs daily at 3 AM to delete messages older than 7 days
- **Backend API**: NOT yet implemented (marked with `TODO` in [team-chat.tsx](src/routes/_app/team-chat.tsx#L107))

### Database Schema
```sql
CREATE TABLE chat_messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER NOT NULL,          -- User ID of sender
  receiver_id INTEGER,                 -- For DM; NULL for team chat
  team_id INTEGER,                     -- For team chat; NULL for DM
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
);
```

### Maintenance
- **Retention Policy**: Messages deleted after 7 days (runs at 3 AM daily)
- **Scaling Concern**: Free tier DB space limited; auto-cleanup is intentional
- **Location**: Cleanup job in [cron.cjs](cron.cjs#L68-L82)

### Common Tasks

#### Add Backend API for Chat
1. Create `sendTeamMessage` function in [src/api.ts](src/api.ts)
2. Signature:
   ```typescript
   export const sendTeamMessage = createServerFn({ method: "POST" })
     .handler(async ({ data: { teamId, message } }) => {
       // Verify user is team member
       // Insert into chat_messages (sender_id, team_id, message, is_read=false)
       // Return new message object
     });
   ```
3. Hook it up in [team-chat.tsx](src/routes/_app/team-chat.tsx#L107) where the TODO is
4. Add `getTeamMessages` for chat history pagination (limit 50, order by created_at DESC)

#### Add "Mark as Read" Feature
- Modify `chat_messages.is_read` on first view of a message
- Add endpoint: `markMessagesAsRead(teamId: number)` to set `is_read = true` for current user
- Update chat page to track unread count in UI

#### Add Direct Messages (DM)
- Reuse `chat_messages` table; set `team_id = NULL, receiver_id = user.id`
- Create new route: `/messages/:userId` for DM thread
- Add DM unread badge to Navbar

### Architecture Pattern
```typescript
// Server function (api.ts)
export const sendTeamMessage = createServerFn({ method: "POST" }).handler(async ({ data }) => {
  const userId = await getCurrentUserId(data.sessionId);
  const { teamId, message } = data;
  
  // Verify membership
  const member = await db.prepare(
    `SELECT id FROM team_members WHERE team_id = ? AND user_id = ? LIMIT 1`
  ).get(teamId, userId);
  if (!member) throw new Error("Not a team member");
  
  // Insert message
  const result = await db.prepare(
    `INSERT INTO chat_messages (sender_id, team_id, message) VALUES (?, ?, ?)`
  ).run(userId, teamId, message);
  
  return { id: result.lastID, sender_id: userId, team_id: teamId, message, created_at: new Date() };
});

// Client usage (team-chat.tsx)
const result = await sendTeamMessage({ data: { teamId: myTeam.id, message: messageInput } });
```

---

## Database Patterns

### Column Remapping
PostgreSQL lowercases unquoted names. The project normalizes via `src/lib/db.ts`:
- Query `SELECT * FROM users` returns `{ userId, userName, createdAt }`
- Queries use `?` placeholders (converted to `$1, $2, ...` internally)

```typescript
// Example
const user = await db.prepare(`SELECT * FROM users WHERE id = ?`).get(userId);
console.log(user.userId); // Works! Not user.id
```

### Transactions
```typescript
await db.transaction(async (tx) => {
  // All queries in this callback use the same connection
  await tx.prepare(`UPDATE teams SET ...`).run(...);
  await tx.prepare(`INSERT INTO notifications ...`).run(...);
  // If an error is thrown, the entire transaction rolls back
});
```

### Prepared Statements
Always use `.prepare()` + `.run()` or `.get()` for parameterized queries (SQL injection prevention):
```typescript
// ✅ Good
const res = await db.prepare(`SELECT * FROM users WHERE phone = ?`).get(phone);

// ❌ Never
const res = await db.prepare(`SELECT * FROM users WHERE phone = '${phone}'`).get();
```

---

## Authentication & Sessions

### Pattern
- Session-based, 7-day expiration
- Phone + password login (10-digit Indian phone format)
- Sessions stored in `sessions` table with `user_id`, `expires_at`

### Client Usage
```typescript
import { useAuth } from "@/lib/auth-client";

const { user, loading } = useAuth();
if (loading) return <Spinner />;
if (!user) return <Navigate to="/login" />;
```

### Server Usage
- Extract session ID from request header or cookie
- Look up user from `sessions` table
- Verify expiration; refresh if needed

---

## Team System Conventions

### Team Structure
- **Captain**: 1 team leader (can invite players, manage roster)
- **Players**: 3 registered players + 1 substitute = 5 total members
- **Constants**: See `TEAM_ROSTER` in [src/lib/team-utils.ts](src/lib/team-utils.ts)

```typescript
export const TEAM_ROSTER = {
  CAPTAIN: "captain",
  PLAYERS: 3,
  SUBSTITUTE: 1,
  MAX_MEMBERS: 5,
};
```

### Notifications & Context-Aware Routing
- All notifications support `redirect_url` field for intelligent routing
- Team-related notifications redirect to `/teams` or team detail page
- See [/memories/repo/clickable-notifications.md](/memories/repo/clickable-notifications.md) for full context

---

## Common Pitfalls & Patterns

| Pitfall | Solution |
|---------|----------|
| **Forgetting to verify team membership** before chat operations | Always check: `SELECT id FROM team_members WHERE team_id = ? AND user_id = ?` |
| **Not handling chat history pagination** (loading all messages at once) | Implement: `LIMIT 50 OFFSET ?` with timestamp-based cursors for efficiency |
| **Hard-deleting old chat messages without archive** | Consider archiving to cold storage before deletion; 7-day retention is aggressive |
| **Not normalizing phone numbers** | Use the same format everywhere: `phone.slice(-10)` for Indian numbers |
| **Async race conditions in chat** | Use transactions or unique constraint on `(team_id, sender_id, created_at)` if needed |
| **Not handling offline chat** | Service Worker can queue messages; retry on reconnect |

---

## Component Library

### UI Components Location
All 30+ components in [src/components/ui/](src/components/ui/). Common examples:
- `Button`, `Input`, `Card`, `Dialog`, `Sheet`, `Accordion`
- `Tabs`, `Badge`, `Avatar`, `Dropdown`, `Toast` (via Sonner)

### Example
```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";

<div className="flex gap-2">
  <Input placeholder="Type message..." />
  <Button size="icon" className="bg-blue-600">
    <Send className="w-4 h-4" />
  </Button>
</div>
```

---

## Performance & Optimization

- **Code Splitting**: framer-motion, recharts, lucide-react, @radix-ui in separate chunks
- **Theme**: CSS variables in `src/lib/theme.tsx` for dark/light mode switching
- **Images**: Cloudinary CDN only (no local images in repo)
- **Bundle Size**: Warning threshold 800KB; esbuild minification enabled in prod

---

## Deployment

### Preset Detection
- `vercel.json` → Runs `SERVER_PRESET=vercel npm run build`
- `wrangler.jsonc` → Cloudflare Workers setup
- `server.mjs` → Custom Node.js / Render deployment

Build automatically detects environment and selects preset.

---

## Next Steps for Chat History

1. **Implement Backend API** (sendTeamMessage, getTeamMessages)
2. **Add Real-Time Updates** (WebSocket or polling)
3. **Implement Unread Notifications**
4. **Add Message Reactions** (emoji, etc.)
5. **Archive Chat History** before 7-day cleanup

---

## Questions?

Refer to:
- Project structure → [README.md](README.md)
- Server functions → [src/api.ts](src/api.ts)
- Team chat UI → [src/routes/_app/team-chat.tsx](src/routes/_app/team-chat.tsx)
- Database setup → [migrate-to-supabase.cjs](migrate-to-supabase.cjs)
- Cron jobs → [cron.cjs](cron.cjs)
