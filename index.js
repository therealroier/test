import express from "express";
import fs from "fs";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;
const DB = "./db.json";
const FINAL_SCRIPT = "https://pastefy.app/a5g4vwd3/raw";

app.use(cors());
app.use(express.json());

const loadDB = () => {
  try {
    if (!fs.existsSync(DB)) {
      const initial = { total: 0, newToday: 0, users: {}, daily: {}, online: {}, logs: [], ownerToken: null };
      fs.writeFileSync(DB, JSON.stringify(initial, null, 2));
      return initial;
    }
    return JSON.parse(fs.readFileSync(DB, "utf8"));
  } catch (e) {
    return { total: 0, users: {} };
  }
};

const saveDB = (db) => fs.writeFileSync(DB, JSON.stringify(db, null, 2));

app.get("/", (_, res) => res.send("DZ API ONLINE"));

app.get("/stats", (_, res) => {
  const db = loadDB();
  res.json({
    "Executions": db.total || 0
  });
});

app.post("/exec", (req, res) => {
  const { action, nickname, password, license } = req.body;
  if (!action || !nickname || !password) return res.status(400).json({ error: "Missing data" });

  const db = loadDB();
  const userKey = nickname.trim().toLowerCase();

  if (action === "register") {
    if (db.users[userKey]) return res.status(400).json({ status: "error" });
    db.users[userKey] = { username: nickname, password: password, license: license };
    db.total = (db.total || 0) + 1;
    saveDB(db);
    return res.status(200).json({ status: "success" });
  }

  if (action === "login") {
    const user = db.users[userKey];
    if (!user || user.password !== password) return res.status(401).json({ status: "error" });
    db.total = (db.total || 0) + 1;
    saveDB(db);
    return res.status(200).json({ status: "success", script: FINAL_SCRIPT });
  }

  res.status(404).json({ error: "NotFound" });
});

app.listen(PORT, () => console.log("Servidor corriendo"));
