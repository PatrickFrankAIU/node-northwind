// server.js
import fs from "fs";
import path from "path";
import express from "express";
import cors from "cors";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// ---- CONFIG ----
const DATA_DIR = path.join(__dirname, "json-tables");

// Map filename -> primary key column (for /:table/:id)
const PK = {
  Categories: "CategoryID",
  Customers: "CustomerID",
  Employees: "EmployeeID",
  EmployeeTerritories: null, // composite
  Order_Details: null,       // composite
  Orders: "OrderID",
  Products: "ProductID",
  Region: "RegionID",
  Shippers: "ShipperID",
  Suppliers: "SupplierID",
  Territories: "TerritoryID"
};

// Friendly aliases so URLs can use hyphens or spaces
const NAME_ALIASES = {
  "order-details": "Order_Details",
  "order_details": "Order_Details",
  "employee-territories": "EmployeeTerritories",
  "employee_territories": "EmployeeTerritories"
};

// Preload data
function load(tableBase) {
  const fp = path.join(DATA_DIR, `${tableBase}.json`);
  const raw = fs.readFileSync(fp, "utf-8");
  return JSON.parse(raw);
}

// Keep everything in memory (Northwind is small)
const db = {};
Object.keys(PK).forEach((t) => {
  const f = path.join(DATA_DIR, `${t}.json`);
  if (fs.existsSync(f)) db[t] = load(t);
});

// Simple lookup maps for joins
const idx = {
  productsById: new Map(),
  customersById: new Map(),
  ordersById: new Map()
};
(db.Products || []).forEach(p => idx.productsById.set(String(p.ProductID), p));
(db.Customers || []).forEach(c => idx.customersById.set(String(c.CustomerID), c));
(db.Orders || []).forEach(o => idx.ordersById.set(String(o.OrderID), o));

// Utility: resolve a path segment to a loaded table name
function resolveTable(seg) {
  const name = seg in NAME_ALIASES ? NAME_ALIASES[seg] : seg;
  // Try exact
  if (db[name]) return name;
  // Try TitleCase guess (e.g., "products" -> "Products")
  const guess = name.replace(/(^|_|\-)([a-z])/g, (_, b, ch) => (b ? "_" : "") + ch.toUpperCase());
  return db[guess] ? guess : null;
}

// List available tables
app.get("/api/tables", (_req, res) => {
  res.json(Object.keys(db));
});

// Generic: list rows with optional ?q= and ?limit=&offset=
app.get("/api/:table", (req, res) => {
  const table = resolveTable(req.params.table);
  if (!table) return res.status(404).json({ error: "Unknown table" });

  let rows = db[table];

  // simple text search across string fields
  const q = (req.query.q || "").toString().toLowerCase();
  if (q) {
    rows = rows.filter((r) =>
      Object.values(r).some(
        v => typeof v === "string" && v.toLowerCase().includes(q)
      )
    );
  }

  // pagination
  const offset = Number(req.query.offset || 0);
  const limit = Math.min(Number(req.query.limit || 1000), 5000);
  res.json(rows.slice(offset, offset + limit));
});

// Generic: get by primary key (only for tables with a single PK)
app.get("/api/:table/:id", (req, res) => {
  const table = resolveTable(req.params.table);
  if (!table) return res.status(404).json({ error: "Unknown table" });

  const pk = PK[table];
  if (!pk) return res.status(400).json({ error: "This table has a composite key; use a composite endpoint." });

  const id = req.params.id;
  const rows = db[table];
  // compare stringified to handle numeric/string ids
  const row = rows.find(r => String(r[pk]) === String(id));
  if (!row) return res.status(404).json({ error: "Not found" });
  res.json(row);
});

/* ---------------- Composite (master-detail) endpoints ---------------- */

// Order details for a given order, enriched with product info
app.get("/api/orders/:id/details", (req, res) => {
  const orderId = String(req.params.id);
  const details = (db.Order_Details || []).filter(d => String(d.OrderID) === orderId);

  const enriched = details.map(d => {
    const p = idx.productsById.get(String(d.ProductID));
    return {
      ...d,
      ProductName: p?.ProductName ?? null,
      UnitPriceProduct: p?.UnitPrice ?? null,
      CategoryID: p?.CategoryID ?? null,
      SupplierID: p?.SupplierID ?? null
    };
  });

  res.json(enriched);
});

// Orders for a given customer (master list for your UI)
app.get("/api/customers/:id/orders", (req, res) => {
  const cid = String(req.params.id);
  const rows = (db.Orders || []).filter(o => String(o.CustomerID) === cid);
  res.json(rows);
});

// Orders that include a given product
app.get("/api/products/:id/orders", (req, res) => {
  const pid = String(req.params.id);
  const matchingOrderIds = new Set(
    (db.Order_Details || [])
      .filter(od => String(od.ProductID) === pid)
      .map(od => String(od.OrderID))
  );
  const rows = (db.Orders || []).filter(o => matchingOrderIds.has(String(o.OrderID)));
  res.json(rows);
});

// Very simple sales by product report
app.get("/api/reports/sales-by-product", (_req, res) => {
  const totals = new Map();
  (db.Order_Details || []).forEach(od => {
    const key = String(od.ProductID);
    const line = (Number(od.UnitPrice) || 0) * (Number(od.Quantity) || 0) * (1 - (Number(od.Discount) || 0));
    totals.set(key, (totals.get(key) || 0) + line);
  });
  const result = Array.from(totals.entries()).map(([ProductID, TotalSales]) => ({
    ProductID: Number(ProductID),
    ProductName: idx.productsById.get(ProductID)?.ProductName ?? null,
    TotalSales: Number(TotalSales.toFixed(2))
  })).sort((a,b) => b.TotalSales - a.TotalSales);
  res.json(result);
});

// Health check
app.get("/", (_req, res) => res.send("Northwind JSON API is running."));

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Northwind JSON API listening on http://localhost:${PORT}`);
});
