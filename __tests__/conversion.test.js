import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';

const email = `convert_${Date.now()}@example.com`;
let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await request(app).post("/api/auth/register").send({ firstName: "Convert", lastName: "User", email, password: "password123", phoneNumber: "+12152688872", country: "US" });
  const login = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  console.log("LOGIN RESPONSE:", login.body);
  token = login.body.token;
  const ngnWalletRes = await request(app)
    .post("/api/wallet/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ currency: "NGN" });
  console.log("NGN WALLET CREATE RESPONSE:", ngnWalletRes.body);
  expect(ngnWalletRes.statusCode).toBe(201);
  const depositRes = await request(app)
    .post("/api/wallet/deposit")
    .set("Authorization", `Bearer ${token}`)
    .send({ currency: "NGN", amount: 15000 });
  console.log("DEPOSIT RESPONSE:", depositRes.body);
  expect(depositRes.statusCode).toBe(200);
  const usdWalletRes = await request(app)
    .post("/api/wallet/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ currency: "USD" });
  console.log("USD WALLET CREATE RESPONSE:", usdWalletRes.body);
  expect(usdWalletRes.statusCode).toBe(201);
});

afterAll(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
  await mongoose.connection.close();
});

describe("Currency Conversion", () => {
  it("should convert NGN to USD successfully", async () => {
    const res = await request(app)
      .post("/api/wallet/convert")
      .set("Authorization", `Bearer ${token}`)
      .send({ fromCurrency: "NGN", toCurrency: "USD", amount: 5000 });

    console.log("CONVERSION RESPONSE:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Conversion successful");
  });

  it("should fail conversion if insufficient funds", async () => {
    const res = await request(app)
      .post("/api/wallet/convert")
      .set("Authorization", `Bearer ${token}`)
      .send({ fromCurrency: "NGN", toCurrency: "USD", amount: 100000 });

    console.log("INSUFFICIENT FUNDS CONVERSION RESPONSE:", res.body);
    expect(res.statusCode).toBe(400);
  });
});