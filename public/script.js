const form = document.getElementById('task-form');
const titleInput = document.getElementById('task-title');
const taskList = document.getElementById('task-list');

// Fetch and display all tasks
async function loadTasks() {
  const res = await fetch('/tasks');
  const tasks = await res.json();

  taskList.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span>${task.title}</span>
      <button class="delete-btn" data-id="${task.id}">Delete</button>
    `;
    taskList.appendChild(li);
  });
}

// Handle form submit - create a new task
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;

  await fetch('/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title })
  });

  titleInput.value = '';
  loadTasks();
});

// Handle delete button clicks (event delegation)
taskList.addEventListener('click', async (e) => {
  if (e.target.classList.contains('delete-btn')) {
    const id = e.target.getAttribute('data-id');
    await fetch(`/tasks/${id}`, { method: 'DELETE' });
    loadTasks();
  }
});

// Load tasks when the page opens
loadTasks();