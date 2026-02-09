import express from "express";
import fs from "fs";
import cors from "cors";
import { nanoid } from "nanoid";

const app = express();
const PORT = process.env.PORT || 3000;
const DB = "./db.json";
const API_KEY = process.env.API_KEY || "";

app.use(cors());
app.use(express.json());

const initDB = () => {
  if (!fs.existsSync(DB)) {
    fs.writeFileSync(DB, JSON.stringify({
      total: 0,
      newToday: 0,
      users: {},
      daily: {},
      online: {},
      logs: [],
      ownerToken: null
    }, null, 2));
  }
};

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
  const auth = req.headers.authorization || "";
  if (API_KEY && auth !== `Bearer ${API_KEY}`)
    return res.status(403).json({ error: "Forbidden" });

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
  db.logs.push({
    time: Date.now(),
    userId,
    username
  });

  if (db.logs.length > 1000) db.logs.shift();
  saveDB(db);

  res.json({ ok: true });
});

app.get("/logs", (req, res) => {
  const token = req.headers["x-owner-token"];
  const db = loadDB();
  if (!db.ownerToken || token !== db.ownerToken)
    return res.status(403).json({ error: "Forbidden" });

  res.json(db.logs.reverse());
});

app.post("/owner/set", (req, res) => {
  const db = loadDB();
  if (!db.ownerToken) {
    db.ownerToken = nanoid(24);
    saveDB(db);
    return res.json({ ownerToken: db.ownerToken });
  }
  res.status(403).json({ error: "Already claimed" });
});

initDB();
app.listen(PORT, () =>
  console.log("DZ API corriendo en puerto", PORT)
);
