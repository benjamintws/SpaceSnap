document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);

        if (data.user.role === 'student' || data.user.role === 'teacher') {
          window.location.href = '/user_index.html';
        } else if (data.user.role === 'admin') {
          window.location.href = '/admin_index.html'; // optional
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert('Login failed. Please try again.');
    }
  });
});
