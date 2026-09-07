const token = localStorage.getItem('token');
const firstName = localStorage.getItem('firstName');

// Redirect to login if no token exists
if (!token) {
  window.location.href = 'login.html';
}

// Personalized time-based greeting
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return `Good Morning, ${firstName}!`;
  if (hour < 17) return `Good Afternoon, ${firstName}!`;
  return `Good Evening, ${firstName}!`;
}
document.getElementById('greeting').textContent = getGreeting();

// Logout
document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('token');
  localStorage.removeItem('firstName');
  window.location.href = 'login.html';
});

const taskForm = document.getElementById('task-form');
const taskTitleInput = document.getElementById('task-title');
const taskList = document.getElementById('task-list');

function authHeaders() {
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
}

function updateProgress(tasks) {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  document.getElementById('progress-text').textContent = `${completed} of ${total} tasks completed`;
  document.getElementById('progress-percent').textContent = `${percent}%`;
  document.getElementById('progress-bar-fill').style.width = `${percent}%`;
}

async function loadTasks() {
  const res = await fetch('/api/tasks', { headers: authHeaders() });
  if (res.status === 401 || res.status === 403) {
    window.location.href = 'login.html';
    return;
  }
  const tasks = await res.json();

  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');
    li.innerHTML = `
      <span>${task.title}</span>
      <span class="task-actions">
        <button class="complete-btn" data-id="${task._id}">${task.completed ? 'Undo' : 'Done'}</button>
        <button class="delete-btn" data-id="${task._id}">Delete</button>
      </span>
    `;
    taskList.appendChild(li);
  });

  updateProgress(tasks);
}

taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = taskTitleInput.value.trim();
  if (!title) return;

  await fetch('/api/tasks', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ title }),
  });

  taskTitleInput.value = '';
  loadTasks();
});

taskList.addEventListener('click', async (e) => {
  const id = e.target.getAttribute('data-id');
  if (!id) return;

  if (e.target.classList.contains('delete-btn')) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: authHeaders() });
    loadTasks();
  }

  if (e.target.classList.contains('complete-btn')) {
    await fetch(`/api/tasks/${id}/toggle`, { method: 'PATCH', headers: authHeaders() });
    loadTasks();
  }
});

loadTasks();