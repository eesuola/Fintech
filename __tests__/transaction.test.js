import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';

//jest.setTimeout(30000);
const email = `trans_${Date.now()}@example.com`;
const receiverEmail = `trans_recv_${Date.now()}@example.com`;
let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await request(app).post("/api/auth/register").send({ name: "Trans User", email, password: "password123" });
  const login = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  token = login.body.token;

  await request(app).post("/api/wallet/deposit").set("Authorization", `Bearer ${token}`).send({ currency: "NGN", amount: 10000 });
  await request(app).post("/api/auth/register").send({ name: "Receiver", email: receiverEmail, password: "password123" });
  await request(app).post("/api/transfer").set("Authorization", `Bearer ${token}`).send({ receiverEmail, fromCurrency: "NGN", toCurrency: "NGN", amount: 2000 });
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
      .get("/api/transactions")
      .set("Authorization", `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});