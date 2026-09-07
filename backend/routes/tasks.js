const express = require('express');
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes in this file require a valid JWT
router.use(authMiddleware);

// GET all tasks belonging to the logged-in user
router.get('/', async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching tasks' });
  }
});

// GET a single task by ID (only if it belongs to this user)
router.get('/:id', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching task' });
  }
});

// POST create a new task for the logged-in user
router.post('/', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const newTask = await Task.create({ title, userId: req.userId });
    res.status(201).json(newTask);
  } catch (err) {
    res.status(500).json({ error: 'Server error creating task' });
  }
});

// PATCH toggle a task's completed status (only if it belongs to this user)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    task.completed = !task.completed;
    await task.save();
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating task' });
  }
});

// DELETE a task (only if it belongs to this user)
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting task' });
  }
});

module.exports = router;