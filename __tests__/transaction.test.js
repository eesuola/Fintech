import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';

const email = `trans_${Date.now()}@example.com`;
const receiverEmail = `trans_recv_${Date.now()}@example.com`;
let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await request(app).post("/api/auth/register").send({ firstName: "Trans", lastName: "User", email, password: "password123", phoneNumber: "+13129803489", country: "US" });
  const login = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  console.log("SENDER LOGIN RESPONSE:", login.body);
  token = login.body.token;
  const senderWalletRes = await request(app)
    .post("/api/wallet/create")
    .set("Authorization", `Bearer ${token}`)
    .send({ currency: "NGN" });
  console.log("SENDER WALLET CREATE RESPONSE:", senderWalletRes.body);
  expect(senderWalletRes.statusCode).toBe(201);
  const depositRes = await request(app)
    .post("/api/wallet/deposit")
    .set("Authorization", `Bearer ${token}`)
    .send({ currency: "NGN", amount: 10000 });
  console.log("SENDER DEPOSIT RESPONSE:", depositRes.body);
  expect(depositRes.statusCode).toBe(200);

  await request(app).post("/api/auth/register").send({ firstName: "Receiver", lastName: "User", email: receiverEmail, password: "password123", phoneNumber: "+13129803489", country: "US" });
  const receiverLogin = await request(app).post("/api/auth/login").send({ email: receiverEmail, password: "password123" });
  console.log("RECEIVER LOGIN RESPONSE:", receiverLogin.body);
  const receiverToken = receiverLogin.body.token;
  const receiverWalletRes = await request(app)
    .post("/api/wallet/create")
    .set("Authorization", `Bearer ${receiverToken}`)
    .send({ currency: "NGN" });
  console.log("RECEIVER WALLET CREATE RESPONSE:", receiverWalletRes.body);
  expect(receiverWalletRes.statusCode).toBe(201);

  const transferRes = await request(app)
    .post("/api/wallet/transfer")
    .set("Authorization", `Bearer ${token}`)
    .send({ receiverEmail, fromCurrency: "NGN", toCurrency: "NGN", amount: 2000 });
  console.log("TRANSFER SETUP RESPONSE:", transferRes.body);
  expect(transferRes.statusCode).toBe(200);
});

afterAll(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
  await mongoose.connection.close();
});

describe("Transaction History", () => {
  it("should return user transactions", async () => {
    const res = await request(app)
      .get("/api/wallet/transactions")
      .set("Authorization", `Bearer ${token}`);

    console.log("TRANSACTION RESPONSE:", res.body);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});