import request from "supertest";
import mongoose from "mongoose";
import app from '../src/app.js';

//jest.setTimeout(30000); // Increase test timeout

// Unique email for each test run
const testEmail = `testuser_${Date.now()}@example.com`;

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterAll(async () => {
  // Clean up all collections
  const collections = await mongoose.connection.db.collections();
  for (let collection of collections) {
    await collection.deleteMany({});
  }
  await mongoose.connection.close();
});

describe("Authentication Endpoints", () => {
  let token;

  it("should register a new user and return a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        firstName: "Amerix",
        lastName: "Eric",
        email: testEmail,
        phoneNumber: "+22076543980",
        country: "GM",
        password: "password123"
      });

    console.log("REGISTER RESPONSE:", res.body); // debug

    expect([200, 201]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("should login the user successfully", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "password123"
      });

    console.log("LOGIN RESPONSE:", res.body); // debug

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    token = res.body.token;
  });

  it("should fail with wrong password", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({
        email: testEmail,
        password: "wrongpassword"
      });

    expect([400, 401]).toContain(res.statusCode);
    expect(res.body).toHaveProperty("message");
  });
});