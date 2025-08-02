import request from 'supertest';
import app from '../src/app.js';
import mongoose from 'mongoose';

//jest.setTimeout(30000);
const email = `convert_${Date.now()}@example.com`;
let token;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await request(app).post("/api/auth/register").send({ name: "Convert User", email, password: "password123" });
  const login = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  token = login.body.token;

  await request(app).post("/api/wallet/deposit").set("Authorization", `Bearer ${token}`).send({ currency: "NGN", amount: 15000 });
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

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Conversion successful");
  });

  it("should fail conversion if insufficient funds", async () => {
    const res = await request(app)
      .post("/api/wallet/convert")
      .set("Authorization", `Bearer ${token}`)
      .send({ fromCurrency: "NGN", toCurrency: "USD", amount: 100000 });

    expect(res.statusCode).toBe(400);
  });
});