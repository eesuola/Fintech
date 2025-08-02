import request from "supertest";
import mongoose from "mongoose";
import app from '../src/app.js';

//jest.setTimeout(30000);
const senderEmail = `sender_${Date.now()}@example.com`;
const receiverEmail = `receiver_${Date.now()}@example.com`;
let senderToken;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  await request(app).post("/api/auth/register").send({ name: "Sender", email: senderEmail, password: "password123" });
  const senderLogin = await request(app).post("/api/auth/login").send({ email: senderEmail, password: "password123" });
  senderToken = senderLogin.body.token;

  await request(app).post("/api/wallet/deposit").set("Authorization", `Bearer ${senderToken}`).send({ currency: "NGN", amount: 10000 });

  await request(app).post("/api/auth/register").send({ name: "Receiver", email: receiverEmail, password: "password123" });
});

afterAll(async () => {
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
  await mongoose.connection.close();
});

describe("Transfer Endpoint", () => {
  it("should transfer funds between users", async () => {
    const res = await request(app)
      .post("/api/transfer")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({ receiverEmail, fromCurrency: "NGN", toCurrency: "NGN", amount: 3000 });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Transfer successful");
  });

  it("should not transfer if insufficient funds", async () => {
    const res = await request(app)
      .post("/api/transfer")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({ receiverEmail, fromCurrency: "NGN", toCurrency: "NGN", amount: 100000 });

    expect([400, 404]).toContain(res.statusCode);
  });
});