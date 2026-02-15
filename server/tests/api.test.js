import request from 'supertest';
import app from '../src/app.js';

describe('Health Check', () => {
    test('GET /api/health should return 200', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Server is running');
    });
});

describe('Auth API', () => {
    test('POST /api/auth/signup should reject missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/signup')
            .send({ email: 'test@test.com' });
        // Should fail validation or return 500 since no DB
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('POST /api/auth/login should reject missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});
        expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test('GET /api/auth/me should reject unauthenticated request', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.status).toBe(401);
    });
});

describe('Board API', () => {
    test('GET /api/boards should reject unauthenticated request', async () => {
        const res = await request(app).get('/api/boards');
        expect(res.status).toBe(401);
    });

    test('POST /api/boards should reject unauthenticated request', async () => {
        const res = await request(app)
            .post('/api/boards')
            .send({ name: 'Test Board' });
        expect(res.status).toBe(401);
    });

    test('GET /api/boards/:id should reject unauthenticated request', async () => {
        const res = await request(app).get('/api/boards/507f191e810c19729de860ea');
        expect(res.status).toBe(401);
    });
});

describe('Task API', () => {
    test('GET /api/lists/:listId/tasks should reject unauthenticated request', async () => {
        const res = await request(app).get('/api/lists/507f191e810c19729de860ea/tasks');
        expect(res.status).toBe(401);
    });

    test('POST /api/lists/:listId/tasks should reject unauthenticated request', async () => {
        const res = await request(app)
            .post('/api/lists/507f191e810c19729de860ea/tasks')
            .send({ title: 'Test Task' });
        expect(res.status).toBe(401);
    });
});

describe('Search API', () => {
    test('GET /api/search should reject unauthenticated request', async () => {
        const res = await request(app).get('/api/search?q=test');
        expect(res.status).toBe(401);
    });
});

describe('404 Handler', () => {
    test('should return 404 for unknown routes', async () => {
        const res = await request(app).get('/api/nonexistent');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});
