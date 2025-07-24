document.addEventListener('DOMContentLoaded', () => {
  const levelList = document.getElementById('level-list');
  const tableBody = document.getElementById('classroom-table-body');
  const popup = document.getElementById('booking-popup');
  const bookingForm = document.getElementById('booking-form');
  const startTimeInput = document.getElementById('start-time');
  const endTimeInput = document.getElementById('end-time');
  const classroomIdInput = document.getElementById('booking-classroom-id');
  const closeBtn = document.getElementById('close-popup');

  function loadClassrooms(level) {
    fetch(`/api/classrooms?level=${level}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.json())
    .then(data => {
      tableBody.innerHTML = '';
      data.forEach(c => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${c.name}</td>
          <td>${c.location}</td>
          <td>${c.capacity}</td>
          <td>${c.equipment.join(', ')}</td>
          <td>${c.availability}</td>
          <td>
            <button class="book-btn" ${c.availability !== 'available' ? 'disabled' : ''} data-id="${c._id}" data-name="${c.name}">
              Book
            </button>
          </td>
        `;
        tableBody.appendChild(row);

        const bookBtn = row.querySelector('.book-btn');
        if (bookBtn) {
          bookBtn.addEventListener('click', () => {
            classroomIdInput.value = bookBtn.dataset.id;
            popup.classList.remove('hidden');
          });
        }
      });
    });
  }

  // Populate level sidebar
  fetch('/api/classrooms/levels', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
  .then(res => res.json())
  .then(levels => {
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

    loadClassrooms(0); // default level
  });

  // Handle popup close
  closeBtn.addEventListener('click', () => {
    popup.classList.add('hidden');
    bookingForm.reset();
  });

  // Handle booking form submission
  bookingForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const classroomId = classroomIdInput.value;
    const startTime = startTimeInput.value;
    const endTime = endTimeInput.value;

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ classroom: classroomId, startTime, endTime })
      });

      const result = await res.json();
      if (res.ok) {
        alert(result.message || 'Booking successful!');
        popup.classList.add('hidden');
        bookingForm.reset();
        const activeLevel = document.querySelector('#level-list .active')?.dataset.level || 0;
        loadClassrooms(activeLevel);
      } else {
        alert(result.message || 'Booking failed.');
      }
    } catch (err) {
      alert('Booking failed. Please try again.');
    }
  });
});
