const request = require('supertest');
const app = require('./app');

describe('Task Manager API', () => {

  // Test GET /tasks - should start empty
  test('GET /tasks should return an empty array initially', async () => {
    const res = await request(app).get('/tasks');
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual([]);
  });

  // Test POST /tasks - create a task
  test('POST /tasks should create a new task', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({ title: 'Learn Jest' });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.title).toBe('Learn Jest');
    expect(res.body.completed).toBe(false);
  });

  // Test POST /tasks - missing title should fail
  test('POST /tasks without a title should return 400', async () => {
    const res = await request(app)
      .post('/tasks')
      .send({});

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  // Test GET /tasks/:id - fetch the task we just created
  test('GET /tasks/:id should return the correct task', async () => {
    const createRes = await request(app)
      .post('/tasks')
      .send({ title: 'Another task' });

    const taskId = createRes.body.id;

    const res = await request(app).get(`/tasks/${taskId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.title).toBe('Another task');
  });

  // Test GET /tasks/:id - non-existent task
  test('GET /tasks/:id with invalid id should return 404', async () => {
    const res = await request(app).get('/tasks/9999');
    expect(res.statusCode).toBe(404);
  });

  // Test DELETE /tasks/:id
  test('DELETE /tasks/:id should remove the task', async () => {
    const createRes = await request(app)
      .post('/tasks')
      .send({ title: 'Task to delete' });

    const taskId = createRes.body.id;

    const deleteRes = await request(app).delete(`/tasks/${taskId}`);
    expect(deleteRes.statusCode).toBe(204);

    const getRes = await request(app).get(`/tasks/${taskId}`);
    expect(getRes.statusCode).toBe(404);
  });

});