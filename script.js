const addDayBtn = document.getElementById('addDayBtn');
const daysContainer = document.getElementById('daysContainer');
const themeToggleBtn = document.getElementById('themeToggleBtn');

let isDarkMode = false;

// 夜間模式切換
themeToggleBtn.addEventListener('click', () => {
  isDarkMode = !isDarkMode;
  document.body.classList.toggle('dark-mode', isDarkMode);
  themeToggleBtn.textContent = isDarkMode ? '🌞 切換白天模式' : '🌙 切換夜間模式';
});

// 建立活動區塊
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
    sortActivitiesByTime(container); // 刪除後也重新排序
  });

  container.appendChild(block);

  // ✅ 加入自動排序（新增後）
  sortActivitiesByTime(container);

  // ✅ 監聽時間輸入，自動排序
  block.querySelector('.start-time').addEventListener('input', () => {
    sortActivitiesByTime(container);
  });
}


// 儲存一天的活動到 Firebase
function saveDayToFirestore(docId, activities) {
  const dayRef = db.collection("tripDays").doc(docId);
  const activitiesRef = dayRef.collection("activities");

  activitiesRef.get().then(snapshot => {
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    return batch.commit();
  }).then(() => {
    activities.forEach(act => {
      activitiesRef.add(act);
    });
    alert("已儲存至雲端！");
  });
}

// 建立一天 UI
function createDayUI(docId, title, activities) {
  const dayDiv = document.createElement('div');
  dayDiv.className = 'day';
  if (isDarkMode) dayDiv.classList.add('dark-mode');

  dayDiv.innerHTML = `
    <h2>${title}</h2>
    <button class="delete-day-btn">刪除這天</button>
    <button class="add-activity-btn">➕ 新增景點/行程</button>
    <div class="activities"></div>
    <button class="save-this-day-btn">💾 儲存這天</button>
  `;

  const activitiesDiv = dayDiv.querySelector('.activities');
  const addActivityBtn = dayDiv.querySelector('.add-activity-btn');
  const saveThisDayBtn = dayDiv.querySelector('.save-this-day-btn');
  const deleteDayBtn = dayDiv.querySelector('.delete-day-btn');

  // 加活動
  addActivityBtn.addEventListener('click', () => {
    addActivityBlock(activitiesDiv, '', '', '', '');
  });

  // 刪除這天
  deleteDayBtn.addEventListener('click', () => {
    if (confirm("確定要刪除這天嗎？")) {
      db.collection("tripDays").doc(docId).delete();
    }
  });

  // 儲存這天
  saveThisDayBtn.addEventListener('click', () => {
    const blocks = activitiesDiv.querySelectorAll('.activity-block');
    const acts = [...blocks].map(block => ({
      activity: block.querySelector('.activity').value,
      location: block.querySelector('.location').value,
      startTime: block.querySelector('.start-time').value,
      endTime: block.querySelector('.end-time').value
    }));
    sortActivitiesByTime(activitiesDiv);
    saveDayToFirestore(docId, acts);
  });

  // 載入活動
  activities.forEach(act => {
    addActivityBlock(activitiesDiv, act.activity, act.location, act.startTime, act.endTime);
  });

  daysContainer.appendChild(dayDiv);
}

// 新增天數 ➜ Firestore
addDayBtn.addEventListener('click', () => {
  const userTitle = prompt("請輸入這天的行程標題（例如：5/24 香港 Day1）：");

  if (!userTitle) {
    alert("標題不能空白！");
    return;
  }

  db.collection("tripDays").add({
    dayNumber: Date.now(),
    title: userTitle,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  }).then(docRef => {
    createDayUI(docRef.id, userTitle, []);
  });
});


// 載入所有天數 ➜ 即時更新
db.collection("tripDays").orderBy("createdAt").onSnapshot(snapshot => {
  daysContainer.innerHTML = '';
  snapshot.forEach(doc => {
    const dayId = doc.id;
    const dayData = doc.data();
    const activitiesRef = db.collection("tripDays").doc(dayId).collection("activities");

    activitiesRef.get().then(activitySnapshot => {
      const activities = [];
      activitySnapshot.forEach(actDoc => activities.push(actDoc.data()));
      createDayUI(dayId, dayData.title, activities);
    });
  });
});
const overviewBtn = document.getElementById('overviewBtn');

overviewBtn.addEventListener('click', async () => {
  const tripDaysSnapshot = await db.collection("tripDays").orderBy("createdAt").get();

  if (tripDaysSnapshot.empty) {
    alert("目前還沒有任何行程！");
    return;
  }

  let summary = "";

  for (const dayDoc of tripDaysSnapshot.docs) {
    const dayData = dayDoc.data();
    const activitiesSnapshot = await db.collection("tripDays")
      .doc(dayDoc.id)
      .collection("activities")
      .get();

    const activities = activitiesSnapshot.docs.map(doc => doc.data());

    // 依開始時間排序
    activities.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    summary += `${dayData.title || "未命名"}\n`;

    activities.forEach((item, idx) => {
      const start = item.startTime || '??:??';
      const end = item.endTime || '??:??';
      const activity = item.activity || '(未填寫行程)';
      const location = item.location || '(未填寫地點)';

      let durationText = '';
      if (start !== '??:??' && end !== '??:??') {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let diff = (eh - sh) * 60 + (em - sm);
        if (diff < 0) diff += 1440; // 跨夜處理
        const hr = Math.floor(diff / 60);
        const min = diff % 60;
        durationText = `（${hr}小時${min}分鐘）`;
      }

      summary += `${idx + 1}. ${activity} (${location}) - ${start} ~ ${end} ${durationText}\n`;
    });

    summary += '\n';
  }

  alert(summary);
});
