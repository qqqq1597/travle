const addDayBtn = document.getElementById('addDayBtn');
const saveBtn = document.getElementById('saveBtn');
const overviewBtn = document.getElementById('overviewBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const daysContainer = document.getElementById('daysContainer');

let dayCount = 0;
let isDarkMode = false;

// 切換主題
themeToggleBtn.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  themeToggleBtn.textContent = isDarkMode ? '🌞 切換白天模式' : '🌙 切換夜間模式';
});

// 新增一天
addDayBtn.addEventListener('click', () => {
  dayCount++;
  createDay(dayCount, []);
});

// 建立一天的區塊
function createDay(dayNumber, activities) {
  const dayDiv = document.createElement('div');
  dayDiv.className = 'day';
  if (isDarkMode) dayDiv.classList.add('dark-mode');
  dayDiv.innerHTML = `
    <h2>第 ${dayNumber} 天</h2>
    <button class="delete-day-btn">刪除這天</button>
    <button class="add-activity-btn">➕ 新增景點/行程</button>
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

// 更新天數標題
function updateDayNumbers() {
  const days = document.querySelectorAll('.day');
  dayCount = 0;
  days.forEach((day, index) => {
    day.querySelector('h2').textContent = `第 ${index + 1} 天`;
    dayCount++;
  });
}

// 新增行程景點
function addActivityBlock(container, activityText, locationText, startTimeText = '', endTimeText = '') {
  const block = document.createElement('div');
  block.className = 'activity-block';
  if (isDarkMode) block.classList.add('dark-mode');
  block.innerHTML = `
    <div style="display: flex; gap: 10px;">
      <div>
        <label>開始時間</label><br>
        <input type="time" class="start-time" value="${startTimeText}">
      </div>
      <div>
        <label>結束時間</label><br>
        <input type="time" class="end-time" value="${endTimeText}">
      </div>
    </div>
    <textarea class="activity" rows="2" placeholder="輸入行程內容...">${activityText}</textarea>
    <input type="text" class="location" placeholder="輸入地點名稱" value="${locationText}">
    <iframe class="map" loading="lazy"></iframe>
    <button class="delete-activity-btn">刪除這個景點</button>
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

// 儲存行程
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
  alert('行程已儲存！');
});

// 總覽行程
overviewBtn.addEventListener('click', () => {
  const allDays = document.querySelectorAll('.day');
  if (allDays.length === 0) {
    alert('目前還沒有行程喔！');
    return;
  }

  let summary = '';
  allDays.forEach((day, index) => {
    const activitiesDiv = day.querySelector('.activities');
    sortActivitiesByTime(activitiesDiv);

    summary += `第 ${index + 1} 天\n`;
    const blocks = activitiesDiv.querySelectorAll('.activity-block');
    blocks.forEach((block, idx) => {
      const startTime = block.querySelector('.start-time').value || '??:??';
      const endTime = block.querySelector('.end-time').value || '??:??';
      const activity = block.querySelector('.activity').value || '(未填寫行程)';
      const location = block.querySelector('.location').value || '(未填寫地點)';

      let durationText = '';
      if (startTime !== '??:??' && endTime !== '??:??') {
        const [startHour, startMin] = startTime.split(':').map(Number);
        const [endHour, endMin] = endTime.split(':').map(Number);
        let diff = (endHour - startHour) * 60 + (endMin - startMin);
        if (diff < 0) diff += 24 * 60;
        const hours = Math.floor(diff / 60);
        const minutes = diff % 60;
        durationText = `(${hours}小時${minutes}分鐘)`;
      }

      summary += `${idx + 1}. ${activity} (${location}) - 開始時間：${startTime} 結束時間：${endTime} ${durationText}\n`;
    });
    summary += '\n';
  });

  alert(summary);
});

// 排序行程按時間順序
function sortActivitiesByTime(container) {
  const blocks = [...container.querySelectorAll('.activity-block')];
  blocks.sort((a, b) => {
    const startA = a.querySelector('.start-time').value;
    const startB = b.querySelector('.start-time').value;
    return startA.localeCompare(startB);
  });

  blocks.forEach(block => container.appendChild(block));
}
const daysContainer = document.getElementById('daysContainer');
const addDayBtn = document.getElementById('addDayBtn');

// 即時同步行程天數
db.collection("tripDays").orderBy("createdAt").onSnapshot(snapshot => {
  daysContainer.innerHTML = ''; // 清空畫面，重新渲染
  snapshot.forEach(doc => {
    const dayData = doc.data();
    const div = document.createElement('div');
    div.className = 'day';
    div.textContent = `第 ${dayData.dayNumber} 天：${dayData.title || "未命名"}`;
    daysContainer.appendChild(div);
  });
});

// 新增一天的行程
addDayBtn.addEventListener('click', () => {
  db.collection("tripDays").add({
    dayNumber: Date.now(), // 或用其他方式計數
    title: `新行程`,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
});
