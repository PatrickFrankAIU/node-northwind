![image](https://github.com/PatrickFrankAIU/GradeManagerProject/assets/134087916/b5d814bf-e38f-456f-8f9c-cb5a98fb52fa)

# Northwind JSON API

This project exposes the classic **Northwind** sample database as a **RESTful JSON API** using **Node.js** and **Express**.
It’s designed for learning and demos — you can explore how to build APIs, fetch related data, and drive simple web apps (e.g. master–detail UIs).

Created and maintained for students in our program. 
Contact: Patrick Frank, pfrank@aiuniv.edu. 


---

## Features

* 📦 **Northwind tables in JSON** (Customers, Orders, Order Details, Products, Categories, Employees, Suppliers, Shippers, Territories, etc.)
* 🌐 **REST API endpoints** for each table (list rows, get by ID)
* 🔗 **Composite endpoints** for master–detail relationships:

  * `/api/orders/:id/details` → Order with its line items
  * `/api/customers/:id/orders` → Orders for one customer
  * `/api/products/:id/orders` → Orders containing a product
* 📊 **Simple report**: `/api/reports/sales-by-product` → sales totals by product
* 🛠 Built with **Express**, **CORS** enabled, no database required (data is served from static JSON files).

---

## Project Structure

```
node-northwind/
  json-tables/        # Northwind tables as JSON arrays
  server.js           # Express API server
  Northwind.sql       # Original Northwind SQL script
  package.json
  README.md
```

---

## Installation

Clone the repo and install dependencies:

```bash
git clone https://github.com/YOUR_USERNAME/node-northwind.git
cd node-northwind
npm install
```

---

## Running locally

Start the server:

```bash
npm run dev
```

By default it runs on [http://localhost:3000](http://localhost:3000).

---

## Example Endpoints

* **List available tables:**
  `GET /api/tables`

* **All customers:**
  `GET /api/customers`

* **One customer:**
  `GET /api/customers/ALFKI`

* **Orders for a customer:**
  `GET /api/customers/ALFKI/orders`

* **All orders:**
  `GET /api/orders`

* **One order:**
  `GET /api/orders/10248`

* **Order details for an order:**
  `GET /api/orders/10248/details`

* **Sales by product report:**
  `GET /api/reports/sales-by-product`

---

## Deploying to Render

1. Push this project to your own GitHub repo.
2. On [Render](https://render.com/), create a new **Web Service**.
3. Connect your repo.
4. Use the following settings:

   * **Build Command:** `npm install`
   * **Start Command:** `npm run dev` (or `node server.js`)
5. Once deployed, your API will be live at `https://your-app.onrender.com`.

---

## Notes

* Northwind is small enough to keep entirely in memory — no database needed.
* JSON files were exported directly from the original SQL script.
* Good for teaching/learning REST APIs, experimenting with `fetch()` in the browser, or wiring up front-end projects to realistic sample data.
