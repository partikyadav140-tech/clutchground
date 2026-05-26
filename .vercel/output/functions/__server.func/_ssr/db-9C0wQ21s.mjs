import{P as R}from"../_libs/pg.mjs";import{e as I}from"./env-Bsb_hgUW.mjs";import"events";import"dns";import"net";import"tls";import"../_libs/react.mjs";import"../_libs/pg-types.mjs";import"../_libs/postgres-array.mjs";import"../_libs/postgres-date.mjs";import"../_libs/postgres-interval.mjs";import"../_libs/xtend.mjs";import"../_libs/postgres-bytea.mjs";import"../_libs/pg-int8.mjs";import"util";import"crypto";import"../_libs/pg-connection-string.mjs";import"fs";import"../_libs/pg-protocol.mjs";import"../_libs/pg-cloudflare.mjs";import"../_libs/pgpass.mjs";import"path";import"stream";import"../_libs/split2.mjs";import"string_decoder";import"../_libs/pg-pool.mjs";let a=I("DATABASE_URL");(!a||a.includes("arena.db"))&&(a="postgresql://neondb_owner:npg_Z2IiLU7CrfqO@ep-morning-shape-a4x9wieu-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");if(!a)throw new Error("DATABASE_URL environment variable is required");const E=new R({connectionString:a}),i={pool:E,query:async(N,e=[],T=E)=>{let t=N,L=1;for(;t.includes("?");)t=t.replace("?","$"+L++);return T.query(t,e)},transaction:async N=>{const e=await E.connect();try{await e.query("BEGIN");const T={query:(L,r)=>i.query(L,r,e),prepare:L=>({get:async(...r)=>{const{rows:A}=await T.query(L,r);return A[0]||null},all:async(...r)=>{const{rows:A}=await T.query(L,r);return A},run:async(...r)=>{let A=L;L.trim().toUpperCase().startsWith("INSERT")&&!L.toUpperCase().includes("RETURNING")&&(A=L+" RETURNING id");const{rows:s}=await T.query(A,r);return{lastInsertRowid:s[0]?.id}}})},t=await N(T);return await e.query("COMMIT"),t}catch(T){throw await e.query("ROLLBACK"),T}finally{e.release()}},prepare:N=>({get:async(...e)=>{const{rows:T}=await i.query(N,e);return T[0]||null},all:async(...e)=>{const{rows:T}=await i.query(N,e);return T},run:async(...e)=>{let T=N;N.trim().toUpperCase().startsWith("INSERT")&&!N.toUpperCase().includes("RETURNING")&&(T=N+" RETURNING id");const{rows:t}=await i.query(T,e);return{lastInsertRowid:t[0]?.id}}})};async function n(){try{await E.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deposit_balance INTEGER DEFAULT 0,
        winning_balance INTEGER DEFAULT 0,
        ign TEXT,
        uid TEXT,
        email TEXT,
        phone TEXT,
        banned BOOLEAN DEFAULT false,
        avatar_url TEXT
      );

      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        game TEXT NOT NULL,
        mode TEXT NOT NULL,
        format TEXT NOT NULL,
        entry INTEGER NOT NULL DEFAULT 0,
        prize INTEGER NOT NULL DEFAULT 0,
        slots INTEGER NOT NULL DEFAULT 0,
        filled INTEGER NOT NULL DEFAULT 0,
        startsAt TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        banner TEXT NOT NULL DEFAULT 'from-orange-600 to-red-700',
        room_id TEXT,
        room_pass TEXT,
        is_hero BOOLEAN DEFAULT false,
        hosted_by TEXT,
        per_kill_coin INTEGER DEFAULT 0,
        first_place_coin INTEGER DEFAULT 0,
        results_announced BOOLEAN DEFAULT false
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        leader_id INTEGER NOT NULL,
        logo TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (leader_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        tournament_id INTEGER NOT NULL,
        team_name TEXT,
        players_json TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        kills INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        points INTEGER DEFAULT 0,
        awarded_prize INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (tournament_id) REFERENCES tournaments(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        user_id INTEGER,
        ign TEXT NOT NULL,
        uid TEXT NOT NULL,
        role TEXT DEFAULT 'player',
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS team_requests (
        id SERIAL PRIMARY KEY,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        ign TEXT NOT NULL,
        uid TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        action_type TEXT,
        action_data TEXT,
        redirect_url TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tournament_requests (
        id SERIAL PRIMARY KEY,
        team_id INTEGER,
        tournament_id INTEGER NOT NULL,
        requested_by INTEGER NOT NULL,
        team_name TEXT,
        players_json TEXT NOT NULL,
        contact_email TEXT,
        contact_phone TEXT,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS withdrawals (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        upi_id TEXT NOT NULL,
        upi_number TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS razorpay_orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        order_id TEXT UNIQUE NOT NULL,
        amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        paid_at TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS upi_deposits (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        txn_ref TEXT UNIQUE NOT NULL,
        utr TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        description TEXT,
        reject_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP,
        approved_at TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        subject TEXT NOT NULL,
        status TEXT DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ticket_replies (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_admin BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS friendships (
        id SERIAL PRIMARY KEY,
        user_id1 INTEGER NOT NULL,
        user_id2 INTEGER NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id1) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id2) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id1, user_id2)
      );

      CREATE TABLE IF NOT EXISTS chat_messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER, -- NULL if team chat
        team_id INTEGER, -- NULL if direct message
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        endpoint TEXT UNIQUE NOT NULL,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);try{await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;"),await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS ign TEXT;"),await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS uid TEXT;"),await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;"),await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;"),await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS deposit_balance INTEGER DEFAULT 0;"),await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS winning_balance INTEGER DEFAULT 0;"),await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;"),await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS upi_id TEXT;"),await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS security_question TEXT;"),await E.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS security_answer TEXT;"),await E.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open';"),await E.query("ALTER TABLE tickets ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;"),await E.query("ALTER TABLE ticket_replies ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;"),await E.query("ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS is_read BOOLEAN DEFAULT false;"),await E.query("ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS results_announced BOOLEAN DEFAULT false;")}catch{}try{await E.query("DELETE FROM users WHERE username = 'admin'"),await E.query(`
        INSERT INTO users (username, password, role, phone)
        VALUES ('admin', 'admin123', 'admin', '8307224756')
      `)}catch{}}catch{}}n();export{i as db};
