document.getElementById('signup-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const contactNumber = document.getElementById('contactNumber').value.trim();
  const password = document.getElementById('password').value;
  const errorMsg = document.getElementById('error-msg');

  try {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ firstName, lastName, contactNumber, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errorMsg.textContent = data.error || 'Signup failed';
      return;
    }

    window.location.href = 'login.html';
  } catch (err) {
    errorMsg.textContent = 'Something went wrong. Please try again.';
  }
});