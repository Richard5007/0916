/**
 * Personal Hub • Interactive Live Clock & Profile Application
 */

(function () {
  'use strict';

  // --- Quotes Library ---
  const quotes = [
    { text: "Time is what we want most, but what we use worst.", author: "William Penn" },
    { text: "The two most powerful warriors are patience and time.", author: "Leo Tolstoy" },
    { text: "Lost time is never found again.", author: "Benjamin Franklin" },
    { text: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
    { text: "Dwell on the beauty of life. Watch the stars, and see yourself running with them.", author: "Marcus Aurelius" },
    { text: "The future depends on what you do today.", author: "Mahatma Gandhi" },
    { text: "It is not that we have a short time to live, but that we waste a lot of it.", author: "Seneca" }
  ];
  let quoteIndex = 0;

  // --- State ---
  let is24Hour = localStorage.getItem('hub_clock_format') === '24';
  let userName = localStorage.getItem('hub_user_name') || 'Alex Morgan';
  let activeTheme = localStorage.getItem('hub_theme') || 'dark';

  // --- DOM Elements ---
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

  // --- Helpers ---
  function padZero(num) {
    return num.toString().padStart(2, '0');
  }

  function getInitials(name) {
    if (!name || !name.trim()) return 'ME';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // --- Greeting Handler ---
  function updateGreeting(hour) {
    let greeting = 'Good Day';
    let emoji = '✨';

    if (hour >= 5 && hour < 12) {
      greeting = 'Good Morning';
      emoji = '🌅';
    } else if (hour >= 12 && hour < 17) {
      greeting = 'Good Afternoon';
      emoji = '⚡';
    } else if (hour >= 17 && hour < 21) {
      greeting = 'Good Evening';
      emoji = '🌆';
    } else {
      greeting = 'Good Night';
      emoji = '🌌';
    }

    greetingText.textContent = greeting;
    greetingEmoji.textContent = emoji;
  }

  // --- Year & Day Stats ---
  function updateYearStats(now) {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const isLeap = new Date(now.getFullYear(), 1, 29).getMonth() === 1;
    const totalDays = isLeap ? 366 : 365;
    
    // Day of year
    const diffDays = Math.floor((now - startOfYear) / (1000 * 60 * 60 * 24)) + 1;
    dayOfYearEl.textContent = `${diffDays} / ${totalDays}`;

    // Year Progress %
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1);
    const progress = ((now - startOfYear) / (endOfYear - startOfYear)) * 100;
    const roundedProgress = progress.toFixed(1);
    yearProgressPercent.textContent = `${roundedProgress}%`;
    yearProgressBar.style.width = `${roundedProgress}%`;

    // Week Number (ISO calculation)
    const d = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    weekOfYearEl.textContent = `Week ${weekNo}`;

    // Day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dayOfWeekBadge.textContent = days[now.getDay()];

    if (footerYear) {
      footerYear.textContent = now.getFullYear();
    }
  }

  // --- Clock Updater ---
  function updateClock() {
    const now = new Date();
    const rawHours = now.getHours();
    const rawMinutes = now.getMinutes();
    const rawSeconds = now.getSeconds();

    // Greeting
    updateGreeting(rawHours);

    // Format Hours
    let displayHours = rawHours;
    let period = '';

    if (!is24Hour) {
      period = rawHours >= 12 ? 'PM' : 'AM';
      displayHours = rawHours % 12;
      displayHours = displayHours ? displayHours : 12; // 0 becomes 12
      ampmContainer.style.display = 'flex';
      ampmEl.textContent = period;
    } else {
      ampmContainer.style.display = 'none';
    }

    hoursEl.textContent = padZero(displayHours);
    minutesEl.textContent = padZero(rawMinutes);
    secondsEl.textContent = padZero(rawSeconds);

    // Date display
    const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    fullDateDisplay.textContent = now.toLocaleDateString(undefined, dateOptions);

    // Timezone display
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const offsetHours = -now.getTimezoneOffset() / 60;
      const offsetStr = `GMT${offsetHours >= 0 ? '+' + offsetHours : offsetHours}`;
      timezoneDisplay.textContent = `${offsetStr} (${timeZone})`;
    } catch (e) {
      timezoneDisplay.textContent = 'Local Time';
    }

    updateYearStats(now);
  }

  // --- Name Editing ---
  function applyUserName(name) {
    const trimmed = name.trim() || 'Alex Morgan';
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

  // --- Clock Format Toggle ---
  function updateFormatButtonState() {
    formatLabel.textContent = is24Hour ? '24H' : '12H';
  }

  timeFormatToggle.addEventListener('click', () => {
    is24Hour = !is24Hour;
    localStorage.setItem('hub_clock_format', is24Hour ? '24' : '12');
    updateFormatButtonState();
    updateClock();
  });

  // --- Copy Time Feature ---
  copyTimeBtn.addEventListener('click', () => {
    const h = hoursEl.textContent;
    const m = minutesEl.textContent;
    const s = secondsEl.textContent;
    const ampmText = !is24Hour ? ` ${ampmEl.textContent}` : '';
    const textToCopy = `${h}:${m}:${s}${ampmText} - ${fullDateDisplay.textContent}`;

    navigator.clipboard.writeText(textToCopy).then(() => {
      copyFeedback.textContent = 'Copied! ✓';
      copyTimeBtn.style.borderColor = 'var(--accent-cyan)';
      setTimeout(() => {
        copyFeedback.textContent = 'Copy';
        copyTimeBtn.style.borderColor = '';
      }, 1800);
    }).catch(() => {
      copyFeedback.textContent = 'Copied!';
      setTimeout(() => {
        copyFeedback.textContent = 'Copy';
      }, 1500);
    });
  });

  // --- Quote Rotation ---
  function displayQuote(index) {
    const q = quotes[index % quotes.length];
    quoteText.innerHTML = `"${q.text}" &mdash; <span style="font-weight:600; color:var(--text-primary)">${q.author}</span>`;
  }

  quoteRefreshBtn.addEventListener('click', () => {
    quoteIndex = (quoteIndex + 1) % quotes.length;
    displayQuote(quoteIndex);
  });

  // --- Theme Switching ---
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

  // --- Initialization ---
  applyUserName(userName);
  applyTheme(activeTheme);
  updateFormatButtonState();
  updateClock();
  displayQuote(0);

  // Tick every second precisely
  setInterval(updateClock, 1000);

})();
