import request from "supertest";
import mongoose from "mongoose";
import app from '../src/app.js';

const senderEmail = `sender_${Date.now()}@example.com`;
const receiverEmail = `receiver_${Date.now()}@example.com`;
let senderToken;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await request(app).post("/api/auth/register").send({ firstName: "Sender", lastName: "User", email: senderEmail, password: "password123", phoneNumber: "+13129803489", country: "US" });
  const senderLogin = await request(app).post("/api/auth/login").send({ email: senderEmail, password: "password123" });
  console.log("SENDER LOGIN RESPONSE:", senderLogin.body);
  senderToken = senderLogin.body.token;
  const senderWalletRes = await request(app)
    .post("/api/wallet/create")
    .set("Authorization", `Bearer ${senderToken}`)
    .send({ currency: "NGN" });
  console.log("SENDER WALLET CREATE RESPONSE:", senderWalletRes.body);
  expect(senderWalletRes.statusCode).toBe(201);
  const depositRes = await request(app)
    .post("/api/wallet/deposit")
    .set("Authorization", `Bearer ${senderToken}`)
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
      .post("/api/wallet/transfer")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({ receiverEmail, fromCurrency: "NGN", toCurrency: "NGN", amount: 3000 });

    console.log("TRANSFER RESPONSE:", res.body);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("message", "Transfer successful");
  });

  it("should not transfer if insufficient funds", async () => {
    const res = await request(app)
      .post("/api/wallet/transfer")
      .set("Authorization", `Bearer ${senderToken}`)
      .send({ receiverEmail, fromCurrency: "NGN", toCurrency: "NGN", amount: 100000 });

    console.log("INSUFFICIENT FUNDS TRANSFER RESPONSE:", res.body);
    expect(res.statusCode).toBe(400);
  });
});