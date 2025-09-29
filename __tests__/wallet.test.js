import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';

const email = `wallet_${Date.now()}@example.com`;
let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await request(app).post("/api/auth/register").send({ firstName: "Wallet", lastName: "User", email, password: "password123", phoneNumber: "+13129803489", country: "US" });
  const login = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  console.log("LOGIN RESPONSE:", login.body);
  token = login.body.token;
  const walletRes = await request(app)
    .post("/api/wallet/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ currency: "NGN" });
  console.log("WALLET CREATE RESPONSE:", walletRes.body);
  expect(walletRes.statusCode).toBe(201); // Verify wallet creation
});

afterAll(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
  await mongoose.connection.close();
});

describe("Wallet Endpoints", () => {
  it("should deposit funds", async () => {
    const res = await request(app)
      .post("/api/wallet/deposit")
      .set("Authorization", `Bearer ${token}`)
      .send({ currency: "NGN", amount: 5000 });

    console.log("DEPOSIT RESPONSE:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("should return wallet balance", async () => {
    const res = await request(app)
      .get("/api/wallet/balance")
      .set("Authorization", `Bearer ${token}`);

    console.log("BALANCE RESPONSE:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("wallets");
  });
}); 