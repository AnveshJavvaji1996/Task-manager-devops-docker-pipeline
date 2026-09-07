document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const contactNumber = document.getElementById('contactNumber').value.trim();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('error-msg');

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contactNumber, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.error || 'Login failed';
      return;
    }

    localStorage.setItem('token', data.token);
    localStorage.setItem('firstName', data.firstName);
    window.location.href = 'dashboard.html';
  } catch (err) {
    errorMsg.textContent = 'Something went wrong. Please try again.';
  }
});