import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';

//jest.setTimeout(30000);
const email = `wallet_${Date.now()}@example.com`;
let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await request(app).post("/api/auth/register").send({ name: "Wallet User", email, password: "password123" });
  const login = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  token = login.body.token;
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

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message");
  });

  it("should return wallet balance", async () => {
    const res = await request(app)
      .get("/api/wallet")
      .set("Authorization", `Bearer ${token}`)

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("wallets");
  });
});