document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('notifications-container');

  fetch('/api/notifications', {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(res => res.json())
    .then(data => {
      container.innerHTML = '';
      if (!data.length) {
        container.innerHTML = '<p>No notifications.</p>';
        return;
      }

      data.forEach(notification => {
        const box = document.createElement('div');
        box.className = 'notification-box';

        // Format message: break line before "Reason:"
        const [mainMsg, reasonPart] = notification.message.split('Reason:');
        const formattedMessage = document.createElement('p');
        formattedMessage.innerHTML = reasonPart
          ? `${mainMsg.trim()}.<br><strong>Reason:</strong> ${reasonPart.trim()}`
          : notification.message;

        const timestamp = document.createElement('p');
        timestamp.className = 'notification-timestamp';
        timestamp.textContent = new Date(notification.createdAt).toLocaleString('en-MY');

        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-btn';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
          fetch(`/api/notifications/${notification._id}`, {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('token')}`
            }
          })
          .then(res => res.json())
          .then(() => {
            box.remove();
          });
        });

        box.appendChild(formattedMessage);
        box.appendChild(timestamp);
        box.appendChild(removeBtn);
        container.appendChild(box);
      });
    })
    .catch(() => {
      container.innerHTML = '<p>Error loading notifications.</p>';
    });
});
