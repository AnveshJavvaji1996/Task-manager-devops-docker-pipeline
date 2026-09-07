const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./app'); // this alone triggers connectDB() internally

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