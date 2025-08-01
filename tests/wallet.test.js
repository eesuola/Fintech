import request from 'supertest';
import app from '../src/app.js';

describe('Wallet API', () => {
  let token;

  beforeAll(async () => {
    // Optionally, register/login a user and get a JWT token for auth
    // const res = await request(app).post('/api/auth/login').send({ ... });
    // token = res.body.token;
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app).get('/api/wallet/balance');
    expect(res.statusCode).toBe(401);
  });

  it('should deposit funds', async () => {
    const res = await request(app)
      .post('/api/wallet/top-up')
      .set('Authorization', `Bearer ${token}`)
      .send({ currency: 'USD', amount: 100 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Deposited/);
  });
  it('should get wallet balance', async () => {
    const res = await request(app)
      .get('/api/wallet/balance')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('balance');
  });
  it('should withdraw funds', async () => {
    const res = await request(app)
      .post('/api/wallet/withdraw')
      .set('Authorization', `Bearer ${token}`)
      .send({ currency: 'USD', amount: 50 });
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/Withdrawn/);
  });
});
