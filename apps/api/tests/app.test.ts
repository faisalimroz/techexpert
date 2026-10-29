import { describe, expect, it } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createApp } from '../src/app';
import { simulateSnapshot } from '../src/services';

const app = createApp();
const token = (role: string) =>
  jwt.sign({ role, email: 'x@y.z' }, process.env.JWT_SECRET ?? 'dev-only-secret-change-me-0123456789abcdef', { subject: '64b000000000000000000001' });

describe('api', () => {
  it('health', async () => {
    const r = await request(app).get('/api/health');
    expect(r.status).toBe(200);
    expect(r.body.ok).toBe(true);
  });

  it('unknown route → 404 JSON', async () => {
    const r = await request(app).get('/api/nope');
    expect(r.status).toBe(404);
    expect(r.body.error.code).toBe('not_found');
  });

  it('inquiry validation rejects bad payloads before touching the DB', async () => {
    const r = await request(app).post('/api/inquiries').send({ type: 'consultation', name: 'A', email: 'bad' });
    expect(r.status).toBe(422);
    expect(r.body.error.details.fieldErrors.email).toBeDefined();
  });

  it('calculator requires kWh or bill', async () => {
    const r = await request(app).post('/api/solar-calculator').send({ tariffBdtPerKwh: 10, panelWatt: 550, location: 'dhaka', systemType: 'on-grid' });
    expect(r.status).toBe(422);
  });

  it('RBAC: anonymous cannot list admin products', async () => {
    const r = await request(app).get('/api/products/admin/all');
    expect(r.status).toBe(401);
  });

  it('RBAC: sales manager cannot manage users', async () => {
    const r = await request(app).get('/api/users').set('Cookie', `te_session=${token('sales_manager')}`);
    expect(r.status).toBe(403);
  });

  it('CSRF: cookie-auth POST without token is refused', async () => {
    const r = await request(app).post('/api/quotations').set('Cookie', `te_session=${token('admin')}`).send({});
    expect(r.status).toBe(403);
    expect(r.body.error.code).toBe('csrf');
  });

  it('NoSQL operators are stripped from bodies', async () => {
    const r = await request(app).post('/api/auth/login').send({ email: { $gt: '' }, password: 'x' });
    expect(r.status).toBe(422);
  });

  it('demo energy data is always labelled simulated', () => {
    const s = simulateSnapshot(new Date('2026-06-01T12:00:00'));
    expect(s.simulated).toBe(true);
    expect(s.solarKw).toBeGreaterThan(300);
  });
});
