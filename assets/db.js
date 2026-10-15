// Real SQLite in the browser via sql.js (SQLite compiled to WebAssembly).
// This replaces the old string-pattern "simulation" so every payload behaves
// exactly as a real database would — operator precedence, -- comments, real
// syntax errors and real result sets included. Still 100% client-side: no
// server, no network at runtime. The .wasm file ships in /vendor.

let _SQL = null;        // the initialised sql.js module (cached)
let _loading = null;    // in-flight init promise (so we init once)

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("Failed to load " + src));
    document.head.appendChild(s);
  });
}

// Resolve the sql.js engine once, lazily.
export async function getSQL() {
  if (_SQL) return _SQL;
  if (_loading) return _loading;
  _loading = (async () => {
    if (!window.initSqlJs) {
      await loadScript("./vendor/sqljs/sql-wasm.js");
    }
    _SQL = await window.initSqlJs({
      locateFile: () => "./vendor/sqljs/sql-wasm.wasm",
    });
    return _SQL;
  })();
  return _loading;
}

// A fresh, seeded demo database for the Injection module. Each call returns an
// independent in-memory DB so one demo can't corrupt another.
export async function freshUsersDb() {
  const SQL = await getSQL();
  const db = new SQL.Database();
  db.run(`
    CREATE TABLE users (
      id       INTEGER PRIMARY KEY,
      username TEXT,
      password TEXT,
      role     TEXT,
      email    TEXT
    );
    INSERT INTO users (username, password, role, email) VALUES
      ('alice',   'password123', 'student', 'alice@example.edu'),
      ('bob',     'winter2024',  'teacher', 'bob@school.edu'),
      ('charlie', 's3cur3!',     'student', 'charlie@example.edu'),
      ('admin',   'Sup3rSecret', 'admin',   'admin@school.edu');
  `);
  return db;
}

// Run a query and normalise the result into { columns, rows, error }.
export function runSql(db, sql) {
  try {
    const res = db.exec(sql);
    if (!res.length) return { columns: [], rows: [], error: null, ran: true };
    return { columns: res[0].columns, rows: res[0].values, error: null, ran: true };
  } catch (e) {
    return { columns: [], rows: [], error: String(e.message || e), ran: false };
  }
}
