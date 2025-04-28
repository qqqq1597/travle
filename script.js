const addDayBtn = document.getElementById('addDayBtn');
const saveBtn = document.getElementById('saveBtn');
const loadBtn = document.getElementById('loadBtn');
const overviewBtn = document.getElementById('overviewBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const daysContainer = document.getElementById('daysContainer');

let dayCount = 0;
let isDarkMode = false;

// �����D�D
themeToggleBtn.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  themeToggleBtn.textContent = isDarkMode ? '?? �����դѼҦ�' : '?? �����]���Ҧ�';
});

// �s�W�@��
addDayBtn.addEventListener('click', () => {
  dayCount++;
  createDay(dayCount, []);
});

// �إߤ@�Ѫ��϶�
function createDay(dayNumber, activities) {
  const dayDiv = document.createElement('div');
  dayDiv.className = 'day';
  if (isDarkMode) dayDiv.classList.add('dark-mode');
  dayDiv.innerHTML = `
    <h2>�� ${dayNumber} ��</h2>
    <button class="delete-day-btn">�R���o��</button>
    <button class="add-activity-btn">? �s�W���I/��{</button>
    <div class="activities"></div>
  `;

  const activitiesDiv = dayDiv.querySelector('.activities');
  const addActivityBtn = dayDiv.querySelector('.add-activity-btn');
  const deleteDayBtn = dayDiv.querySelector('.delete-day-btn');

  addActivityBtn.addEventListener('click', () => {
    addActivityBlock(activitiesDiv, '', '', '', '');
  });

  deleteDayBtn.addEventListener('click', () => {
    dayDiv.remove();
    updateDayNumbers();
  });

  activities.forEach(item => {
    addActivityBlock(activitiesDiv, item.activity, item.location, item.startTime, item.endTime);
  });

  daysContainer.appendChild(dayDiv);
}

// ��s�ѼƼ��D
function updateDayNumbers() {
  const days = document.querySelectorAll('.day');
  dayCount = 0;
  days.forEach((day, index) => {
    day.querySelector('h2').textContent = `�� ${index + 1} ��`;
    dayCount++;
  });
}

// �s�W��{���I
function addActivityBlock(container, activityText, locationText, startTimeText = '', endTimeText = '') {
  const block = document.createElement('div');
  block.className = 'activity-block';
  if (isDarkMode) block.classList.add('dark-mode');
  block.innerHTML = `
    <div style="display: flex; gap: 10px;">
      <div>
        <label>�}�l�ɶ�</label><br>
        <input type="time" class="start-time" value="${startTimeText}">
      </div>
      <div>
        <label>�����ɶ�</label><br>
        <input type="time" class="end-time" value="${endTimeText}">
      </div>
    </div>
    <textarea class="activity" rows="2" placeholder="��J��{���e...">${activityText}</textarea>
    <input type="text" class="location" placeholder="��J�a�I�W��" value="${locationText}">
    <iframe class="map" loading="lazy"></iframe>
    <button class="delete-activity-btn">�R���o�Ӵ��I</button>
  `;

  const locationInput = block.querySelector('.location');
  const mapFrame = block.querySelector('.map');
  const deleteBtn = block.querySelector('.delete-activity-btn');

  locationInput.addEventListener('input', () => {
    const query = encodeURIComponent(locationInput.value);
    mapFrame.src = query ? `https://www.google.com/maps?q=${query}&output=embed` : '';
  });

  if (locationText.trim() !== '') {
    mapFrame.src = `https://www.google.com/maps?q=${encodeURIComponent(locationText)}&output=embed`;
  }

  deleteBtn.addEventListener('click', () => {
    block.remove();
  });

  container.appendChild(block);
}

// �x�s��{
saveBtn.addEventListener('click', () => {
  const allDays = document.querySelectorAll('.day');
  const data = [];

  allDays.forEach(day => {
    const activitiesDiv = day.querySelector('.activities');
    sortActivitiesByTime(activitiesDiv);

    const activities = [];
    day.querySelectorAll('.activity-block').forEach(block => {
      const activity = block.querySelector('.activity').value;
      const location = block.querySelector('.location').value;
      const startTime = block.querySelector('.start-time').value;
      const endTime = block.querySelector('.end-time').value;
      activities.push({ activity, location, startTime, endTime });
    });
    data.push({ dayNumber: day.querySelector('h2').textContent, activities });
  });

  localStorage.setItem('tripPlan', JSON.stringify(data));
  alert('��{�w�x�s�I');
});

// ���J��{
loadBtn.addEventListener('click', () => {
  const savedData = localStorage.getItem('tripPlan');
  if (savedData) {
    const data = JSON.parse(savedData);
    daysContainer.innerHTML = '';
    dayCount = 0;
    data.forEach(item => {
      dayCount++;
      createDay(dayCount, item.activities);
    });
    alert('��{�w���J�I');
  } else {
    alert('�ثe�S���x�s����{��I');
  }
});

// �`����{
overviewBtn.addEventListener('click', () => {
  const allDays = document.querySelectorAll('.day');
  if (allDays.length === 0) {
    alert('�ثe�٨S����{��I');
    return;
  }

  let summary = '';
  allDays.forEach((day, index) => {
    const activitiesDiv = day.querySelector('.activities');
    sortActivitiesByTime(activitiesDiv);

    summary += `�� ${index + 1} ��\n`;
    const blocks = activitiesDiv.querySelectorAll('.activity-block');
    blocks.forEach((block, idx) => {
      const startTime = block.querySelector('.start-time').value || '??:??';
      const endTime = block.querySelector('.end-time').value || '??:??';
      const activity = block.querySelector('.activity').value || '(����g��{)';
      const location = block.querySelector('.location').value || '(����g�a�I)';

      let durationText = '';
      if (startTime !== '??:??' && endTime !== '??:??') {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        let diff = (endHour - startHour) * 60 + (endMin - startMin);
        if (diff < 0) diff += 24 * 60;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        durationText = `(${hours}�p��${minutes}����)`;
      }

      summary += `${idx + 1}. ${activity} (${location}) - �}�l�ɶ��G${startTime} �����ɶ��G${endTime} ${durationText}\n`;
    });
    summary += '\n';
  });

  alert(summary);
});

// �ƧǦ�{���ɶ�����
function sortActivitiesByTime(container) {
  const blocks = [...container.querySelectorAll('.activity-block')];
  blocks.sort((a, b) => {
    const startA = a.querySelector('.start-time').value;
    const startB = b.querySelector('.start-time').value;
    return startA.localeCompare(startB);
  });

  blocks.forEach(block => container.appendChild(block));
}
