# Fintech API 🚀

A **Fintech prototype application** built with **Node.js & Express** featuring **Flutterwave integration** for secure financial transactions.
Includes **authentication, wallet management, and bank operations** with **interactive API docs via Swagger**.

---

## 📌 Features

* 🔐 User authentication (JWT-based login & signup)
* 👛 Wallet creation & management
* 🏦 Bank operations (via Flutterwave API)
* 💸 Transactions (deposits, transfers, withdrawals)
* 📖 API documentation with Swagger (`/api-docs`)

---

## 🛠️ Tech Stack

* **Backend:** Node.js (ESM), Express.js
* **Database:** (MongoDB / PostgreSQL depending on setup)
* **Payments:** Flutterwave API
* **Docs:** Swagger (swagger-jsdoc + swagger-ui-express)
* **Testing:** Jest

---

## 📂 Project Structure

```
fintech/
│── .api/                 # API schema/reference
│── src/
│   ├── app.js            # Express app
│   ├── server.js         # Entry point
│   ├── config/           # DB & env config
│   ├── controllers/      # Business logic
│   ├── middleware/       # Auth, error handlers
│   ├── model/            # Database models
│   ├── routes/           # Express routes (auth, bank, wallet)
│   └── utils/            # Helper functions
│── swagger.js            # Swagger setup
│── __tests__/            # Jest tests
│── package.json
│── .env
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repo

```bash
git clone https://github.com/eesuola/Fintech.git
cd Fintech
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Environment Variables

Create a `.env` file in root:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret

# Flutterwave keys
FLW_PUBLIC_KEY=your_flutterwave_public_key
FLW_SECRET_KEY=your_flutterwave_secret_key
FLW_ENCRYPTION_KEY=your_flutterwave_encryption_key
```

### 4️⃣ Start Server

```bash
npm start
```

For development:

```bash
npm run dev
```

---

## 📖 API Documentation (Swagger)

Swagger docs are available when the server is running.

👉 Visit:
`http://localhost:5000/api-docs`

---

## 🔑 Example Endpoints

### Auth

* `POST /api/auth/register` → Register new user
* `POST /api/auth/login` → Login & get JWT
* `DELETE /api/auth/deleteAll` → Login & get JWT
* `GET /api/auth/deleteAll` → Login & get JWT

### Wallet

* `POST /api/wallet/create` → Create wallet
* `GET /api/wallet/:id` → Get wallet details

### Bank

* `POST /api/bank/deposit` → Deposit Funds
* `POST /api/bank/webhook` → l

---

## 🧪 Running Tests

```bash
npm test
```

---

## 🤝 Contributing

1. Fork the repo
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m "Added feature"`
4. Push branch: `git push origin feature-name`
5. Create Pull Request

---

## 📜 License

MIT License © 2025 [Eesuola](https://github.com/eesuola)
