document.addEventListener('DOMContentLoaded', () => {
  const classroomList = document.getElementById('classroom-list');
  

  function loadClassrooms(level) {
    fetch(`/api/classrooms?level=${level}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}` // optional if using auth
      }
    })
    .then(res => res.json())
    .then(data => {
      classroomList.innerHTML = '';
      data.forEach(c => {
        const div = document.createElement('div');
        div.classList.add('classroom');
        div.innerHTML = `
          <h3>${c.name}</h3>
          <p>Location: ${c.location}</p>
          <p>Level: ${c.level}</p>
          <p>Capacity: ${c.capacity}</p>
          <p>Equipment: ${c.equipment.join(', ')}</p>
          <p>Status: ${c.availability}</p>
        `;
        classroomList.appendChild(div);
      });
    });
  }

  

  // Dynamically populate sidebar levels
  fetch('/api/classrooms/levels', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
  .then(res => res.json())
  .then(levels => {
    const levelList = document.getElementById('level-list');
    levelList.innerHTML = '';

    levels.sort((a, b) => a - b).forEach(level => {
      const li = document.createElement('li');
      li.textContent = `Level ${level}`;
      li.dataset.level = level;
      if (level == 0) li.classList.add('active');

      li.addEventListener('click', () => {
        document.querySelector('#level-list .active')?.classList.remove('active');
        li.classList.add('active');
        loadClassrooms(level);
      });

      levelList.appendChild(li);
    });

    loadClassrooms(0); // load ground floor by default
  });
});
