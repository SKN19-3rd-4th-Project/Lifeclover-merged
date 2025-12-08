if (window.__LIFECLOVER_APP_INIT__) {
  // already initialized; prevent double binding
} else {
  window.__LIFECLOVER_APP_INIT__ = true;

  document.addEventListener('DOMContentLoaded', () => {
    const state = {
      currentPage: 'home',
      isLoggedIn: false,
      messages: [],
      currentMode: 'chat', // 'chat' or 'info'
      selectedServiceType: null, // For info mode context
      isLoading: false
    };

    // Will be loaded from backend
    let diaryEntries = {};

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

    const formatDateKey = (date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    let currentMonth = new Date();
    let selectedDateKey = formatDateKey(new Date());

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

      // Load diaries when switching to diary page
      if (page === 'diary') {
        loadDiaries();
      }

      // Initialize chat when switching to chat page
      if (page === 'chat' && state.messages.length === 0) {
        initializeChat();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    pageTriggers.forEach((btn) => {
      btn.addEventListener('click', () => switchPage(btn.dataset.targetPage));
    });

    // Service card click handlers
    document.querySelectorAll('.service-card').forEach((card) => {
      card.addEventListener('click', () => {
        const title = card.querySelector('.service-title')?.textContent || '';

        // Map service titles to internal types
        const serviceTypeMap = {
          '장례 시설 안내': 'funeral_facilities',
          '지원 정책': 'support_policy',
          '유산 상속 안내': 'inheritance',
          '디지털 개인 정보': 'digital_info'
        };

        state.selectedServiceType = serviceTypeMap[title] || null;
        state.currentMode = 'info';

        // Clear messages and add greeting
        state.messages = [
          { role: 'bot', content: `${title}에 대해 궁금하신 점을 말씀해주세요. 정확한 정보를 안내해드리겠습니다.` }
        ];

        // Switch to chat page
        switchPage('chat');
        renderMessages();
      });
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

    function initializeChat() {
      // Add welcome message for empathy mode
      if (state.currentMode === 'chat') {
        state.messages = [
          { role: 'bot', content: '안녕하세요! 오늘은 좀 어떠신가요? 편하게 말씀해주세요.' }
        ];
        renderMessages();
      }
    }

    async function sendMessage() {
      const text = (chatInputEl?.value || '').trim();
      if (!text || state.isLoading) return;

      // Add user message to UI
      state.messages.push({ role: 'user', content: text });
      renderMessages();
      if (chatInputEl) chatInputEl.value = '';

      // Show loading state
      state.isLoading = true;
      const loadingMsg = { role: 'bot', content: '답변을 준비하고 있습니다... 🍀' };
      state.messages.push(loadingMsg);
      renderMessages();

      try {
        const response = await fetch('/api/chat/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
            mode: state.currentMode,
            service_type: state.selectedServiceType
          })
        });

        const data = await response.json();

        // Remove loading message
        state.messages = state.messages.filter(msg => msg !== loadingMsg);

        if (data.error) {
          state.messages.push({ role: 'bot', content: `오류: ${data.error}` });
        } else {
          state.messages.push({ role: 'bot', content: data.response });
          // Reset service type after first message in info mode
          state.selectedServiceType = null;
        }
      } catch (error) {
        // Remove loading message
        state.messages = state.messages.filter(msg => msg !== loadingMsg);
        state.messages.push({
          role: 'bot',
          content: '서버와 연결할 수 없습니다. 잠시 후 다시 시도해주세요.'
        });
        console.error('Chat error:', error);
      } finally {
        state.isLoading = false;
        renderMessages();
      }
    }

    sendButton?.addEventListener('click', sendMessage);

    chatInputEl?.addEventListener('keyup', (event) => {
      if (event.isComposing) return;

      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    });
  }

    // Diary functionality
    async function loadDiaries() {
      try {
        const response = await fetch('/api/diaries/');
        const data = await response.json();

        if (data.error) {
          console.error('Failed to load diaries:', data.error);
          return;
        }

        // Convert array to object keyed by date
        diaryEntries = {};
        data.diaries.forEach(diary => {
          diaryEntries[diary.date] = {
            emoji: diary.emoji,
            tag: diary.tags,
            content: null // Will be loaded on demand
          };
        });

        // Update calendar display
        renderCalendar();
      } catch (error) {
        console.error('Error loading diaries:', error);
      }
    }

    async function loadDiaryDetail(dateKey) {
      try {
        const response = await fetch(`/api/diary/${dateKey}/`);
        const data = await response.json();

        if (data.error) {
          console.error('Failed to load diary detail:', data.error);
          return null;
        }

        return data.content;
      } catch (error) {
        console.error('Error loading diary detail:', error);
        return null;
      }
    }

    const formatMonthTitle = (date) => `${date.getFullYear()}년 ${date.getMonth() + 1}월`;

    const isSameMonth = (dateKey, dateObj) => {
      if (!dateKey) return false;
      const [y, m] = dateKey.split('-').map(Number);
      return y === dateObj.getFullYear() && m === dateObj.getMonth() + 1;
    };

    async function renderDiaryDetail() {
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
        // Load diary content from backend
        const diaryContent = await loadDiaryDetail(selectedDateKey);

        if (diaryContent) {
          const lines = diaryContent.split('\n');
          lines.forEach((line) => {
            if (line.trim()) {
              const p = document.createElement('p');
              p.textContent = line;
              contentEl.appendChild(p);
            }
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

        if (entry?.emoji) {
          const iconEl = document.createElement('span');
          iconEl.className = 'calendar-day-icon';
          iconEl.textContent = entry.emoji;
          dayEl.appendChild(iconEl);
        }

        dayEl.addEventListener('click', () => {
          selectedDateKey = dateKey;
          renderCalendar();
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
    switchPage(state.currentPage);
  });

}
