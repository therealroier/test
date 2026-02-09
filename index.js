import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const DB = "./db.json";

app.use(cors());
app.use(express.json());

const loadDB = () => JSON.parse(fs.readFileSync(DB, "utf8"));
const saveDB = (db) => fs.writeFileSync(DB, JSON.stringify(db, null, 2));
const today = () => new Date().toISOString().slice(0, 10);

app.get("/", (_, res) => res.send("DZ API ONLINE"));

app.get("/stats", (_, res) => {
  const db = loadDB();
  const t = today();
  const now = Date.now();

  const onlineUsers = Object.keys(db.online).filter(
    id => now - db.online[id] < 35000
  );

  res.json({
    "Executions": db.total,
    "REGISTERED USERS": Object.keys(db.users).length,
    "All-Time": db.newToday,
    "Active Clients": onlineUsers.length,
    "todayExecutions": db.daily[t] ? Object.keys(db.daily[t]).length : 0
  });
});

app.post("/exec", (req, res) => {
  const { userId, username } = req.body;
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  const db = loadDB();
  const t = today();

  if (!db.users[userId]) {
    db.users[userId] = { username, firstSeen: Date.now() };
    db.newToday++;
  }

  if (!db.daily[t]) db.daily[t] = {};
  if (!db.daily[t][userId]) {
    db.daily[t][userId] = true;
    db.total++;
  }

  db.online[userId] = Date.now();
  db.logs.push({ time: Date.now(), userId, username });

  if (db.logs.length > 1000) db.logs.shift();
  saveDB(db);

  res.json({ ok: true });
});

app.listen(PORT, () => console.log("DZ API corriendo en puerto", PORT));
