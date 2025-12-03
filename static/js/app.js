if (window.__LIFECLOVER_APP_INIT__) {
  // already initialized; prevent double binding
} else {
  window.__LIFECLOVER_APP_INIT__ = true;

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    currentPage: 'home',
    isLoggedIn: false,
    messages: [
      { role: 'bot', content: '안녕하세요! 저는 Lifeclover입니다. 무엇을 도와드릴까요?' },
    ],
  };

  const diaryEntries = {
    '2025-11-01': { tag: '#생일', icon: '🎂', content: ['가족들과 작은 생일 파티를 즐겼어요.', '많은 축하를 받아서 감사한 하루였습니다.'] },
    '2025-11-03': { tag: '#기억', icon: '🎀', content: ['좋은 기억들을 함께 떠올리며 웃을 수 있었어요.'] },
    '2025-11-05': { tag: '#산책', icon: '🌻', content: ['가을 햇살을 느끼며 짧은 산책을 했습니다.', '조용한 시간이 마음을 따뜻하게 했어요.'] },
    '2025-11-12': { tag: '#독서', icon: '📖', content: ['오랜만에 좋아하는 책을 읽으며 차분한 시간을 보냈어요.'] },
    '2025-11-28': { tag: '#자분함', icon: '🎁', content: ['비가 오는 날이라 마음이 차분해졌네요.', "좋아하시는 영화 '인터스텔라' 이야기를 나누며 소소한 즐거움을 찾으셨습니다."] },
  };

  const sections = document.querySelectorAll('.page-section');
  const pageTriggers = document.querySelectorAll('[data-target-page]');
  const authContainer = document.querySelector('[data-auth]');
  const chatMessagesEl = document.querySelector('[data-chat-messages]');
  const chatInputEl = document.querySelector('[data-chat-input]');
  const sendButton = document.querySelector('[data-send-message]');
  const monthTitleEl = document.querySelector('[data-month-title]');
  const calendarGridEl = document.querySelector('[data-calendar-grid]');
  const diaryDetailEl = document.querySelector('[data-diary-detail]');
  const monthButtons = document.querySelectorAll('[data-change-month]');

  const diaryKeys = Object.keys(diaryEntries).sort();
  const keyToMonth = (key) => {
    const [y, m] = key.split('-').map(Number);
    return new Date(y, m - 1, 1);
  };
  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  let currentMonth = diaryKeys.length ? keyToMonth(diaryKeys[diaryKeys.length - 1]) : new Date();
  let selectedDateKey = diaryKeys.length ? diaryKeys[diaryKeys.length - 1] : formatDateKey(new Date());

  function switchPage(page) {
    if (!page) return;
    state.currentPage = page;

    sections.forEach((section) => {
      const isActive = section.dataset.page === page;
      section.classList.toggle('active', isActive);
      section.hidden = !isActive;
    });

    pageTriggers.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.targetPage === page);
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pageTriggers.forEach((btn) => {
    btn.addEventListener('click', () => switchPage(btn.dataset.targetPage));
  });

  function renderAuth() {
    if (!authContainer) return;
    authContainer.innerHTML = '';

    if (state.isLoggedIn) {
      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'button button-logout';
      logoutBtn.textContent = '로그아웃';
      logoutBtn.addEventListener('click', () => {
        state.isLoggedIn = false;
        renderAuth();
      });
      authContainer.appendChild(logoutBtn);
      return;
    }

    const loginBtn = document.createElement('button');
    loginBtn.className = 'button button-login';
    loginBtn.textContent = '로그인';
    loginBtn.addEventListener('click', () => {
      state.isLoggedIn = true;
      renderAuth();
    });

    const signupBtn = document.createElement('button');
    signupBtn.className = 'button button-signup';
    signupBtn.textContent = '회원가입';
    signupBtn.addEventListener('click', () => {
      alert('회원가입 페이지와 연동해주세요.');
    });

    authContainer.appendChild(loginBtn);
    authContainer.appendChild(signupBtn);
  }

  function renderMessages() {
    if (!chatMessagesEl) return;
    chatMessagesEl.innerHTML = '';

    state.messages.forEach((msg) => {
      const wrapper = document.createElement('div');
      wrapper.className = `message ${msg.role}`;

      const content = document.createElement('div');
      content.className = 'message-content';
      content.textContent = msg.content;

      wrapper.appendChild(content);
      chatMessagesEl.appendChild(wrapper);
    });

    chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
  }

  function sendMessage() {
    const text = (chatInputEl?.value || '').trim();
    if (!text) return;

    state.messages.push({ role: 'user', content: text });
    renderMessages();
    if (chatInputEl) chatInputEl.value = '';

    setTimeout(() => {
      state.messages.push({ role: 'bot', content: '정성스러운 답변을 준비 중입니다... 🍀' });
      renderMessages();
    }, 500);
  }

  sendButton?.addEventListener('click', sendMessage);
  chatInputEl?.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });

  const formatMonthTitle = (date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

  const isSameMonth = (dateKey, dateObj) => {
    if (!dateKey) return false;
    const [y, m] = dateKey.split('-').map(Number);
    return y === dateObj.getFullYear() && m === dateObj.getMonth() + 1;
  };

  function renderDiaryDetail() {
    if (!diaryDetailEl) return;
    diaryDetailEl.innerHTML = '';

    const detailHeader = document.createElement('div');
    detailHeader.className = 'diary-detail-header';

    const headerInfo = document.createElement('div');
    const dateEl = document.createElement('div');
    dateEl.className = 'diary-date';
    dateEl.textContent = selectedDateKey || '날짜를 선택하세요';
    const tagEl = document.createElement('div');
    tagEl.className = 'diary-tag';
    tagEl.textContent = selectedDateKey && diaryEntries[selectedDateKey]?.tag ? diaryEntries[selectedDateKey].tag : '#미선택';

    headerInfo.appendChild(dateEl);
    headerInfo.appendChild(tagEl);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', () => {
      selectedDateKey = null;
      renderDiaryDetail();
      renderCalendar();
    });

    detailHeader.appendChild(headerInfo);
    detailHeader.appendChild(closeBtn);
    diaryDetailEl.appendChild(detailHeader);

    const contentEl = document.createElement('div');
    contentEl.className = 'diary-content';

    if (!selectedDateKey) {
      const info = document.createElement('p');
      info.textContent = '달력에서 날짜를 눌러 기록을 확인하세요.';
      contentEl.appendChild(info);
    } else {
      const entry = diaryEntries[selectedDateKey];
      if (entry?.content?.length) {
        entry.content.forEach((text) => {
          const p = document.createElement('p');
          p.textContent = text;
          contentEl.appendChild(p);
        });
      } else {
        const empty = document.createElement('p');
        empty.textContent = '기록이 없습니다. 새로운 기억을 남겨주세요.';
        contentEl.appendChild(empty);
      }
    }

    diaryDetailEl.appendChild(contentEl);
  }

  function renderCalendar() {
    if (!calendarGridEl) return;
    calendarGridEl.innerHTML = '';

    ['일', '월', '화', '수', '목', '금', '토'].forEach((day) => {
      const header = document.createElement('div');
      header.className = 'calendar-day-header';
      header.textContent = day;
      calendarGridEl.appendChild(header);
    });

    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

    for (let i = 0; i < firstDay; i += 1) {
      const empty = document.createElement('div');
      empty.className = 'calendar-day';
      calendarGridEl.appendChild(empty);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const entry = diaryEntries[dateKey];
      const dayEl = document.createElement('div');
      dayEl.className = 'calendar-day';

      if (entry) dayEl.classList.add('has-entry');
      if (selectedDateKey === dateKey) dayEl.classList.add('selected');

      const numberEl = document.createElement('span');
      numberEl.className = 'calendar-day-number';
      numberEl.textContent = String(day);
      dayEl.appendChild(numberEl);

      if (entry?.icon) {
        const iconEl = document.createElement('span');
        iconEl.className = 'calendar-day-icon';
        iconEl.textContent = entry.icon;
        dayEl.appendChild(iconEl);
      }

      dayEl.addEventListener('click', () => {
        selectedDateKey = dateKey;
        renderCalendar();
        renderDiaryDetail();
      });

      calendarGridEl.appendChild(dayEl);
    }

    renderDiaryDetail();
  }

  function changeMonth(offset) {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1);
    if (!selectedDateKey || !isSameMonth(selectedDateKey, currentMonth)) {
      const monthEntries = Object.keys(diaryEntries).filter((key) => isSameMonth(key, currentMonth)).sort();
      selectedDateKey = monthEntries[0] || formatDateKey(currentMonth);
    }
    if (monthTitleEl) monthTitleEl.textContent = formatMonthTitle(currentMonth);
    renderCalendar();
  }

  monthButtons.forEach((btn) => {
    btn.addEventListener('click', () => changeMonth(Number(btn.dataset.changeMonth || 0)));
  });

  if (monthTitleEl) monthTitleEl.textContent = formatMonthTitle(currentMonth);

  renderAuth();
  renderMessages();
  renderCalendar();
  switchPage(state.currentPage);
});

}
