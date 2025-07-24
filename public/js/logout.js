document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');

  logoutBtn.addEventListener('click', (e) => {
    e.preventDefault(); // prevent anchor default behavior

    // Clear stored login data
    localStorage.removeItem('token');
    localStorage.removeItem('role');

    // Redirect to login page
    window.location.href = '/login.html';
  });
});
