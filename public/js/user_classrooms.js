document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('toggle-filter');
  const filterOptions = document.getElementById('filter-options');
  const applyBtn = document.getElementById('apply-filter');
  const resultContainer = document.getElementById('filtered-results');

  toggleBtn.addEventListener('click', () => {
    filterOptions.classList.toggle('hidden');
  });

  applyBtn.addEventListener('click', async () => {
    // Hide filter bar after clicking
    filterOptions.classList.add('hidden');

    // Collect filters
    const selectedLevels = [...document.querySelectorAll('input[name="level"]:checked')].map(el => el.value);
    const selectedBuildings = [...document.querySelectorAll('input[name="building"]:checked')].map(el => el.value);
    const selectedEquipment = [...document.querySelectorAll('input[name="equipment"]:checked')].map(el => el.value);
    const capacity = document.getElementById('capacity').value;

    // Build query string
    const params = new URLSearchParams();
    if (selectedLevels.length) selectedLevels.forEach(lvl => params.append('level', lvl));
    if (selectedBuildings.length) selectedBuildings.forEach(b => params.append('location', b));
    if (selectedEquipment.length) selectedEquipment.forEach(e => params.append('equipment', e));
    if (capacity) params.append('capacity', capacity);

    // Fetch data
    const res = await fetch(`/api/classrooms/filter?${params.toString()}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`
      }
    });
    const data = await res.json();

    // Clear previous results
    resultContainer.innerHTML = '';

    if (!data.length) {
      resultContainer.innerHTML = '<p style="color: #233369; font-weight: bold;">No classrooms found matching the filters.</p>';
      return;
    }

    // Build table
    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Class Name</th>
          <th>Location</th>
          <th>Capacity</th>
          <th>Equipment</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        ${data.map(c => `
          <tr>
            <td>${c.name}</td>
            <td>${c.location}</td>
            <td>${c.capacity}</td>
            <td>${c.equipment.join(', ')}</td>
            <td>${c.availability || 'unknown'}</td>
          </tr>
        `).join('')}
      </tbody>
    `;
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.querySelectorAll('td, th').forEach(cell => {
      cell.style.border = '1px solid #233369';
      cell.style.padding = '10px';
      cell.style.textAlign = 'left';
    });

    resultContainer.appendChild(table);
  });
});
