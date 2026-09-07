const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./app'); // importing this triggers connectDB() internally

// Wait for the connection that app.js already initiated, instead of connecting again
beforeAll(async () => {
  if (mongoose.connection.readyState === 0) {
    await new Promise((resolve) => {
      mongoose.connection.once('connected', resolve);
    });
  }
});

afterAll(async () => {
  await mongoose.connection.db.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

describe('Auth API', () => {

  const testUser = {
    firstName: 'John',
    lastName: 'Doe',
    contactNumber: '9999999999',
    password: 'securePass123',
  };

  test('POST /api/auth/signup should create a new user', async () => {
    const res = await request(app).post('/api/auth/signup').send(testUser);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('userId');
  });

  test('POST /api/auth/signup with missing fields should return 400', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ firstName: 'John' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  test('POST /api/auth/signup with duplicate contact number should return 409', async () => {
    await request(app).post('/api/auth/signup').send(testUser);
    const res = await request(app).post('/api/auth/signup').send(testUser);

    expect(res.statusCode).toBe(409);
  });

  test('POST /api/auth/login with correct credentials should return a token', async () => {
    await request(app).post('/api/auth/signup').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ contactNumber: testUser.contactNumber, password: testUser.password });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.firstName).toBe('John');
  });

  test('POST /api/auth/login with wrong password should return 401', async () => {
    await request(app).post('/api/auth/signup').send(testUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ contactNumber: testUser.contactNumber, password: 'wrongPassword' });

    expect(res.statusCode).toBe(401);
  });

  test('POST /api/auth/login with non-existent user should return 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ contactNumber: '0000000000', password: 'anything' });

    expect(res.statusCode).toBe(401);
  });

});

describe('Task API (protected routes)', () => {

  const userA = { firstName: 'Alice', lastName: 'A', contactNumber: '1111111111', password: 'passA123' };
  const userB = { firstName: 'Bob', lastName: 'B', contactNumber: '2222222222', password: 'passB123' };

  let tokenA;
  let tokenB;

  beforeEach(async () => {
    await request(app).post('/api/auth/signup').send(userA);
    await request(app).post('/api/auth/signup').send(userB);

    const loginA = await request(app)
      .post('/api/auth/login')
      .send({ contactNumber: userA.contactNumber, password: userA.password });
    tokenA = loginA.body.token;

    const loginB = await request(app)
      .post('/api/auth/login')
      .send({ contactNumber: userB.contactNumber, password: userB.password });
    tokenB = loginB.body.token;
  });

  test('GET /api/tasks without a token should return 401', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.statusCode).toBe(401);
  });

  test('GET /api/tasks with an invalid token should return 403', async () => {
    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', 'Bearer invalid-token-here');

    expect(res.statusCode).toBe(403);
  });

  test('POST /api/tasks should create a task for the logged-in user', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Learn Kubernetes' });

    expect(res.statusCode).toBe(201);
    expect(res.body.title).toBe('Learn Kubernetes');
    expect(res.body.completed).toBe(false);
  });

  test('POST /api/tasks without a title should return 400', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test('GET /api/tasks should only return the logged-in user\'s own tasks', async () => {
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenA}`).send({ title: 'Alice task 1' });
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenA}`).send({ title: 'Alice task 2' });
    await request(app).post('/api/tasks').set('Authorization', `Bearer ${tokenB}`).send({ title: 'Bob task 1' });

    const resA = await request(app).get('/api/tasks').set('Authorization', `Bearer ${tokenA}`);
    const resB = await request(app).get('/api/tasks').set('Authorization', `Bearer ${tokenB}`);

    expect(resA.body.length).toBe(2);
    expect(resB.body.length).toBe(1);
    expect(resB.body[0].title).toBe('Bob task 1');
  });

  test('PATCH /api/tasks/:id/toggle should flip completed status', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Toggle me' });

    const taskId = createRes.body._id;

    const toggleRes = await request(app)
      .patch(`/api/tasks/${taskId}/toggle`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(toggleRes.statusCode).toBe(200);
    expect(toggleRes.body.completed).toBe(true);
  });

  test('User B should NOT be able to toggle User A\'s task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Alice private task' });

    const taskId = createRes.body._id;

    const toggleRes = await request(app)
      .patch(`/api/tasks/${taskId}/toggle`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(toggleRes.statusCode).toBe(404);
  });

  test('DELETE /api/tasks/:id should remove the task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Delete me' });

    const taskId = createRes.body._id;

    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(deleteRes.statusCode).toBe(204);

    const getRes = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(getRes.statusCode).toBe(404);
  });

  test('User B should NOT be able to delete User A\'s task', async () => {
    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ title: 'Protected task' });

    const taskId = createRes.body._id;

    const deleteRes = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(deleteRes.statusCode).toBe(404);
  });

});