require("dotenv").config();

const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcryptjs");

const app = express();
const root = __dirname;
const dataDir = path.join(root, "data");
const uploadDir = path.join(root, "uploads");
const dbPath = path.join(dataDir, "monve-db.json");
const port = Number(process.env.PORT || 3000);

fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(uploadDir, { recursive: true });

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function defaultData() {
  const categories = ["Signature Denim Bags", "Clutch Bags", "Crossbody Bags", "Top Handles Bag"]
    .map((name, index) => ({ id: index + 1, name, slug: slugify(name), sort_order: index + 1, visible: 1 }));

  return {
    nextCategoryId: 5,
    nextBagId: 7,
    settings: {
      announcement: "New arrivals added monthly - browse the latest collection",
      heroEyebrow: "Spring edit",
      heroTitle: "Carry the day beautifully.",
      heroText: "Soft structure, refined hardware, and practical shapes designed for workdays, weekends, and every small escape between.",
      heroImage: "/assets/hero-bags.png",
      storyEyebrow: "The atelier note",
      storyTitle: "Polished bags without the precious attitude.",
      storyText: "MONVE NEPAL is built around reliable shapes, satisfying closures, comfortable straps, and materials that look better as they collect stories.",
      storyImage: "/assets/catalog-bags.png"
    },
    categories,
    bags: [
      ["MONVE Denim Signature", 1, "Deep indigo", "New Arrival", "Signature denim texture with a polished MONVE silhouette."],
      ["Satin Evening Clutch", 2, "Pearl gray", "Featured", "A refined clutch for evenings, events, and occasion styling."],
      ["City Clasp Crossbody", 3, "Black gloss", "Compact", "A hands-free shape with a clean clasp detail."],
      ["Petite Top Handle", 4, "Cranberry", "New Arrival", "A structured top-handle profile with a compact finish."],
      ["Soft Frame Clutch", 2, "Warm tan", "Classic", "Soft framed styling for everyday elegance."],
      ["Arc Top Handle", 4, "Ivory grain", "Limited", "An ivory top-handle bag with a graceful arc profile."]
    ].map((bag, index) => ({
      id: index + 1,
      name: bag[0],
      category_id: bag[1],
      color: bag[2],
      tag: bag[3],
      description: bag[4],
      imageUrl: "/assets/catalog-bags.png",
      sort_order: index + 1,
      visible: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))
  };
}

function readDb() {
  if (!fs.existsSync(dbPath)) {
    const initial = defaultData();
    writeDb(initial);
    return initial;
  }
  return JSON.parse(fs.readFileSync(dbPath, "utf8"));
}

function writeDb(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

function attachCategory(data, bag) {
  const category = data.categories.find((item) => item.id === Number(bag.category_id));
  return {
    id: bag.id,
    name: bag.name,
    color: bag.color,
    tag: bag.tag,
    description: bag.description,
    imageUrl: bag.imageUrl,
    sort_order: bag.sort_order,
    visible: bag.visible,
    category: category ? category.name : "",
    categorySlug: category ? category.slug : ""
  };
}

function publicPayload(includeHidden = false) {
  const data = readDb();
  const categories = data.categories
    .filter((category) => includeHidden || category.visible)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.name.localeCompare(b.name));
  const bags = data.bags
    .filter((bag) => includeHidden || bag.visible)
    .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || b.id - a.id)
    .map((bag) => attachCategory(data, bag));
  return { settings: data.settings, categories, bags };
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${crypto.randomBytes(5).toString("hex")}${path.extname(file.originalname).toLowerCase()}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype)) {
      cb(new Error("Only image uploads are allowed."));
      return;
    }
    cb(null, true);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(session({
  name: "monve.sid",
  secret: process.env.SESSION_SECRET || "monve-dev-session-secret",
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: "lax", maxAge: 1000 * 60 * 60 * 8 }
}));

app.use("/assets", express.static(path.join(root, "assets")));
app.use("/uploads", express.static(uploadDir));
app.use("/admin", express.static(path.join(root, "admin")));
app.use(express.static(root, { extensions: ["html"], index: "index.html" }));

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) return next();
  res.status(401).json({ error: "Authentication required" });
}

app.get("/api/catalog", (req, res) => res.json(publicPayload(false)));

app.post("/api/admin/login", async (req, res) => {
  const username = String(req.body.username || "");
  const password = String(req.body.password || "");
  const expectedUser = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "admin12345";
  const expectedHash = process.env.ADMIN_PASSWORD_HASH || "";
  const passwordOk = expectedHash ? await bcrypt.compare(password, expectedHash) : password === expectedPassword;
  if (username !== expectedUser || !passwordOk) return res.status(401).json({ error: "Invalid username or password" });
  req.session.admin = { username };
  res.json({ ok: true });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => req.session.destroy(() => res.json({ ok: true })));
app.get("/api/admin/me", (req, res) => res.json({ authenticated: Boolean(req.session && req.session.admin) }));
app.get("/api/admin/data", requireAdmin, (req, res) => res.json(publicPayload(true)));

app.put("/api/admin/settings", requireAdmin, upload.fields([
  { name: "heroImageFile", maxCount: 1 },
  { name: "storyImageFile", maxCount: 1 }
]), (req, res) => {
  const data = readDb();
  ["announcement", "heroEyebrow", "heroTitle", "heroText", "storyEyebrow", "storyTitle", "storyText"].forEach((key) => {
    data.settings[key] = String(req.body[key] || "");
  });
  if (req.files?.heroImageFile?.[0]) data.settings.heroImage = `/uploads/${req.files.heroImageFile[0].filename}`;
  if (req.files?.storyImageFile?.[0]) data.settings.storyImage = `/uploads/${req.files.storyImageFile[0].filename}`;
  writeDb(data);
  res.json(publicPayload(true));
});

app.post("/api/admin/categories", requireAdmin, (req, res) => {
  const data = readDb();
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Category name is required" });
  data.categories.push({
    id: data.nextCategoryId++,
    name,
    slug: slugify(name),
    sort_order: Number(req.body.sortOrder || 0),
    visible: req.body.visible === false ? 0 : 1
  });
  writeDb(data);
  res.json(publicPayload(true));
});

app.put("/api/admin/categories/:id", requireAdmin, (req, res) => {
  const data = readDb();
  const category = data.categories.find((item) => item.id === Number(req.params.id));
  if (!category) return res.status(404).json({ error: "Category not found" });
  category.name = String(req.body.name || "").trim();
  category.slug = slugify(category.name);
  category.sort_order = Number(req.body.sortOrder || 0);
  category.visible = req.body.visible ? 1 : 0;
  writeDb(data);
  res.json(publicPayload(true));
});

app.delete("/api/admin/categories/:id", requireAdmin, (req, res) => {
  const data = readDb();
  const id = Number(req.params.id);
  data.categories = data.categories.filter((item) => item.id !== id);
  data.bags.forEach((bag) => { if (bag.category_id === id) bag.category_id = null; });
  writeDb(data);
  res.json(publicPayload(true));
});

app.post("/api/admin/bags", requireAdmin, upload.single("image"), (req, res) => {
  const data = readDb();
  const name = String(req.body.name || "").trim();
  if (!name) return res.status(400).json({ error: "Bag name is required" });
  data.bags.push({
    id: data.nextBagId++,
    name,
    category_id: req.body.categoryId ? Number(req.body.categoryId) : null,
    color: req.body.color || "",
    tag: req.body.tag || "",
    description: req.body.description || "",
    imageUrl: req.file ? `/uploads/${req.file.filename}` : "/assets/catalog-bags.png",
    sort_order: Number(req.body.sortOrder || 0),
    visible: req.body.visible === "0" ? 0 : 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  });
  writeDb(data);
  res.json(publicPayload(true));
});

app.put("/api/admin/bags/:id", requireAdmin, upload.single("image"), (req, res) => {
  const data = readDb();
  const bag = data.bags.find((item) => item.id === Number(req.params.id));
  if (!bag) return res.status(404).json({ error: "Bag not found" });
  bag.name = req.body.name || "";
  bag.category_id = req.body.categoryId ? Number(req.body.categoryId) : null;
  bag.color = req.body.color || "";
  bag.tag = req.body.tag || "";
  bag.description = req.body.description || "";
  if (req.file) bag.imageUrl = `/uploads/${req.file.filename}`;
  bag.sort_order = Number(req.body.sortOrder || 0);
  bag.visible = req.body.visible === "0" ? 0 : 1;
  bag.updated_at = new Date().toISOString();
  writeDb(data);
  res.json(publicPayload(true));
});

app.delete("/api/admin/bags/:id", requireAdmin, (req, res) => {
  const data = readDb();
  data.bags = data.bags.filter((item) => item.id !== Number(req.params.id));
  writeDb(data);
  res.json(publicPayload(true));
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({ error: err.message || "Request failed" });
});

app.listen(port, () => console.log(`MONVE NEPAL CMS running on http://localhost:${port}`));
