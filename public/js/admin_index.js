document.addEventListener('DOMContentLoaded', () => {
  const tableBody = document.getElementById('booking-table-body');
  const popup = document.getElementById('action-popup');
  const confirmBtn = document.getElementById('confirm-decision');
  const closeBtn = document.getElementById('close-popup');
  const reasonSection = document.getElementById('rejection-reason');
  const reasonText = document.getElementById('reason-text');

  let currentBookingId = null;

  function loadPendingBookings() {
    fetch('/api/bookings/pending', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    })
    .then(res => res.json())
    .then(data => {
      tableBody.innerHTML = '';
      data.forEach((booking, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${index + 1}</td>
          <td>${booking.classroom.name}</td>
          <td>${booking.user.name}</td>
          <td>${booking.startTime}</td>
          <td>${booking.endTime}</td>
          <td><button class="action-btn" data-id="${booking._id}">Action</button></td>
        `;
        tableBody.appendChild(row);
      });

      // Bind action buttons
      document.querySelectorAll('.action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          currentBookingId = btn.dataset.id;
          popup.classList.remove('hidden');
        });
      });
    });
  }

  // Radio button logic
  document.querySelectorAll('input[name="decision"]').forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'reject') {
        reasonSection.classList.remove('hidden');
      } else {
        reasonSection.classList.add('hidden');
        reasonText.value = '';
      }
    });
  });

  // Confirm decision
    confirmBtn.addEventListener('click', () => {
      const decision = document.querySelector('input[name="decision"]:checked');
      if (!decision) {
        alert('Please select a decision.');
        return;
      }

      const payload = {
        action: decision.value,
        reason: decision.value === 'reject' ? reasonText.value.trim() : ''
      };

      fetch(`/api/bookings/admin/${currentBookingId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(() => {
        popup.classList.add('hidden');
        const selectedRadio = document.querySelector('input[name="decision"]:checked');
        if (selectedRadio) selectedRadio.checked = false;
        reasonText.value = '';
        reasonSection.classList.add('hidden');
        loadPendingBookings();
      })
      .catch(err => {
        alert('Failed to update booking.');
      });
    });


    // Close popup
    closeBtn.addEventListener('click', () => {
    popup.classList.add('hidden');
    const selectedRadio = document.querySelector('input[name="decision"]:checked');
    if (selectedRadio) selectedRadio.checked = false;
    reasonText.value = '';
    reasonSection.classList.add('hidden');
    });


  loadPendingBookings();
});
