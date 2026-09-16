/**
 * 許景翔 • 個人主頁與即時時鐘儀表板 (Personal Hub)
 */

(function () {
  'use strict';

  // --- 經典時間與專注名言庫 (中文) ---
  const quotes = [
    { text: "時間是我們最想要、卻也最浪費的東西。", author: "威廉·佩恩 (William Penn)" },
    { text: "最強大的兩位戰士，就是耐心與時間。", author: "列夫·托爾斯泰 (Leo Tolstoy)" },
    { text: "失去的時間，永遠無法再尋回。", author: "班傑明·富蘭克林 (Benjamin Franklin)" },
    { text: "你的時間有限，不要浪費時間去過別人的生活。", author: "史蒂夫·賈伯斯 (Steve Jobs)" },
    { text: "專注於生命的美好。凝視繁星，想像自己與星辰一同奔馳。", author: "馬可·奧理略 (Marcus Aurelius)" },
    { text: "未來，取決於你今天做了什麼。", author: "聖雄甘地 (Mahatma Gandhi)" },
    { text: "並非我們能擁有的時間太短，而是我們浪費了太多。", author: "塞內卡 (Seneca)" }
  ];
  let quoteIndex = 0;

  // --- 狀態管理 ---
  let is24Hour = localStorage.getItem('hub_clock_format') === '24';
  let savedName = localStorage.getItem('hub_user_name');
  if (!savedName || savedName === 'Alex Morgan' || savedName === 'Your Name' || savedName === '許景翔 (Richard Hsu)') {
    savedName = '許景翔';
    localStorage.setItem('hub_user_name', savedName);
  }
  let userName = savedName;
  let activeTheme = localStorage.getItem('hub_theme') || 'dark';

  // --- DOM 元素快取 ---
  const hoursEl = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const ampmContainer = document.getElementById('ampmContainer');
  const ampmEl = document.getElementById('ampm');
  const fullDateDisplay = document.getElementById('fullDateDisplay');
  const timezoneDisplay = document.getElementById('timezoneDisplay');

  const greetingText = document.getElementById('greetingText');
  const greetingEmoji = document.getElementById('greetingEmoji');

  const userNameDisplay = document.getElementById('userNameDisplay');
  const userNameInput = document.getElementById('userNameInput');
  const editNameBtn = document.getElementById('editNameBtn');
  const avatarInitials = document.getElementById('avatarInitials');

  const timeFormatToggle = document.getElementById('timeFormatToggle');
  const formatLabel = document.getElementById('formatLabel');
  const copyTimeBtn = document.getElementById('copyTimeBtn');
  const copyFeedback = document.getElementById('copyFeedback');

  const yearProgressBar = document.getElementById('yearProgressBar');
  const yearProgressPercent = document.getElementById('yearProgressPercent');
  const dayOfYearEl = document.getElementById('dayOfYear');
  const weekOfYearEl = document.getElementById('weekOfYear');
  const dayOfWeekBadge = document.getElementById('dayOfWeekBadge');
  const footerYear = document.getElementById('footerYear');

  const quoteText = document.getElementById('quoteText');
  const quoteRefreshBtn = document.getElementById('quoteRefreshBtn');

  const themeBtns = document.querySelectorAll('.theme-btn');

  // --- 工具函式 ---
  function padZero(num) {
    return num.toString().padStart(2, '0');
  }

  function getInitials(name) {
    if (!name || !name.trim()) return '景翔';
    const trimmed = name.trim();
    
    // 若為中文姓名（例如：許景翔 -> 取「景翔」；許大寶 -> 取「大寶」）
    const chineseChars = trimmed.match(/[\u4e00-\u9fa5]/g);
    if (chineseChars && chineseChars.length >= 2) {
      return chineseChars.slice(-2).join('');
    } else if (chineseChars && chineseChars.length === 1) {
      return chineseChars[0];
    }

    // 若為英文名（取首字母縮寫）
    const parts = trimmed.split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // --- 動態時段問候語 ---
  function updateGreeting(hour) {
    let greeting = '你好';
    let emoji = '✨';

    if (hour >= 5 && hour < 12) {
      greeting = '早安，美好的一天';
      emoji = '🌅';
    } else if (hour >= 12 && hour < 17) {
      greeting = '午安，持續專注前進';
      emoji = '⚡';
    } else if (hour >= 17 && hour < 22) {
      greeting = '傍晚好，享受愜意時光';
      emoji = '🌆';
    } else {
      greeting = '夜深了，注意休息與沉澱';
      emoji = '🌌';
    }

    greetingText.textContent = greeting;
    greetingEmoji.textContent = emoji;
  }

  // --- 年度進度與日曆統計 ---
  function updateYearStats(now) {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const isLeap = new Date(now.getFullYear(), 1, 29).getMonth() === 1;
    const totalDays = isLeap ? 366 : 365;
    
    // 當年第幾天
    const diffDays = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    dayOfYearEl.textContent = `${diffDays} / ${totalDays} 天`;

    // 年度進度百分比
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const progress = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;
    const roundedProgress = progress.toFixed(1);
    yearProgressPercent.textContent = `${roundedProgress}%`;
    yearProgressBar.style.width = `${roundedProgress}%`;

    // 週數計算 (ISO 8601)
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    weekOfYearEl.textContent = `第 ${weekNo} 週`;

    // 星期名稱
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    dayOfWeekBadge.textContent = days[now.getDay()];

    if (footerYear) {
      footerYear.textContent = now.getFullYear();
    }
  }

  // --- 即時時鐘核心邏輯 ---
  function updateClock() {
    const now = new Date();
    const rawHours = now.getHours();
    const rawMinutes = now.getMinutes();
    const rawSeconds = now.getSeconds();

    // 更新時段問候
    updateGreeting(rawHours);

    // 格式化小時與 12/24 制切換
    let displayHours = rawHours;
    let period = '';

    if (!is24Hour) {
      period = rawHours >= 12 ? '下午' : '上午';
      displayHours = rawHours % 12;
      displayHours = displayHours ? displayHours : 12; // 0 點顯示為 12
      ampmContainer.style.display = 'flex';
      ampmEl.textContent = period;
    } else {
      ampmContainer.style.display = 'none';
    }

    hoursEl.textContent = padZero(displayHours);
    minutesEl.textContent = padZero(rawMinutes);
    secondsEl.textContent = padZero(rawSeconds);

    // 中文日期格式
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const date = now.getDate();
    const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayName = days[now.getDay()];
    fullDateDisplay.textContent = `${year}年${month}月${date}日 ${dayName}`;

    // 在地時區顯示
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offsetHours = -now.getTimezoneOffset() / 60;
      const offsetStr = `GMT${offsetHours >= 0 ? '+' + offsetHours : offsetHours}`;
      const tzName = timeZone.includes('Taipei') ? '台北標準時間' : timeZone;
      timezoneDisplay.textContent = `${offsetStr} (${tzName})`;
    } catch (e) {
      timezoneDisplay.textContent = '在地標準時間';
    }

    updateYearStats(now);
  }

  // --- 原地編輯姓名功能 ---
  function applyUserName(name) {
    const trimmed = name.trim() || '許景翔';
    userName = trimmed;
    localStorage.setItem('hub_user_name', userName);
    userNameDisplay.textContent = userName;
    avatarInitials.textContent = getInitials(userName);
  }

  function startEditingName() {
    userNameInput.value = userName;
    userNameDisplay.classList.add('hidden');
    userNameInput.classList.remove('hidden');
    userNameInput.focus();
    userNameInput.select();
  }

  function finishEditingName() {
    if (!userNameInput.classList.contains('hidden')) {
      applyUserName(userNameInput.value);
      userNameInput.classList.add('hidden');
      userNameDisplay.classList.remove('hidden');
    }
  }

  userNameDisplay.addEventListener('click', startEditingName);
  editNameBtn.addEventListener('click', () => {
    if (userNameInput.classList.contains('hidden')) {
      startEditingName();
    } else {
      finishEditingName();
    }
  });

  userNameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      finishEditingName();
    } else if (e.key === 'Escape') {
      userNameInput.classList.add('hidden');
      userNameDisplay.classList.remove('hidden');
    }
  });

  userNameInput.addEventListener('blur', finishEditingName);

  // --- 時鐘制式切換 (12H / 24H) ---
  function updateFormatButtonState() {
    formatLabel.textContent = is24Hour ? '24小時制' : '12小時制';
  }

  timeFormatToggle.addEventListener('click', () => {
    is24Hour = !is24Hour;
    localStorage.setItem('hub_clock_format', is24Hour ? '24' : '12');
    updateFormatButtonState();
    updateClock();
  });

  // --- 一鍵複製時間功能 ---
  copyTimeBtn.addEventListener('click', () => {
    const h = hoursEl.textContent;
    const m = minutesEl.textContent;
    const s = secondsEl.textContent;
    const ampmText = !is24Hour ? ` ${ampmEl.textContent}` : '';
    const textToCopy = `${h}:${m}:${s}${ampmText} - ${fullDateDisplay.textContent}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      copyFeedback.textContent = '已複製！ ✓';
      copyTimeBtn.style.borderColor = 'var(--accent-cyan)';
      setTimeout(() => {
        copyFeedback.textContent = '複製時間';
        copyTimeBtn.style.borderColor = '';
      }, 1800);
    }).catch(() => {
      copyFeedback.textContent = '已複製！';
      setTimeout(() => {
        copyFeedback.textContent = '複製時間';
      }, 1500);
    });
  });

  // --- 名言輪播 ---
  function displayQuote(index) {
    const q = quotes[index % quotes.length];
    quoteText.innerHTML = `「${q.text}」&mdash; <span style="font-weight:600; color:var(--text-primary)">${q.author}</span>`;
  }

  quoteRefreshBtn.addEventListener('click', () => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    displayQuote(quoteIndex);
  });

  // --- 主題切換 (Cosmic Dark / Aurora / Sunset) ---
  function applyTheme(themeName) {
    activeTheme = themeName;
    document.documentElement.setAttribute('data-theme', themeName);
    localStorage.setItem('hub_theme', themeName);

    themeBtns.forEach((btn) => {
      if (btn.getAttribute('data-theme') === themeName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  themeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const selected = btn.getAttribute('data-theme');
      applyTheme(selected);
    });
  });

  // --- 初始化執行 ---
  applyUserName(userName);
  applyTheme(activeTheme);
  updateFormatButtonState();
  updateClock();
  displayQuote(0);

  // 每秒平滑更新
  setInterval(updateClock, 1000);

})();
