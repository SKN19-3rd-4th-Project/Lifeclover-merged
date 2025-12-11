if (window.__LIFECLOVER_APP_INIT__) {
  // already initialized; prevent double binding
} else {
  window.__LIFECLOVER_APP_INIT__ = true;

document.addEventListener('DOMContentLoaded', () => {
  const state = {
    currentPage: 'home',
    isLoggedIn: false,
    userName: '회원',
    messagesChat: [],
    messagesInfo: [],
    currentMode: 'chat', // 'chat' or 'info'
    selectedServiceType: null, // For info mode context
    isLoading: false
  };

  // Will be loaded from backend
  let diaryEntries = {};

  const sections = document.querySelectorAll('.page-section');
  const pageTriggers = document.querySelectorAll('[data-target-page]');
  const navElement = document.querySelector('.nav');
  const navIndicator = document.querySelector('.nav-indicator');
  const authContainer = document.querySelector('[data-auth]');
  const loginModal = document.querySelector('[data-login-modal]');
  const loginForm = document.querySelector('[data-login-form]');
  const loginCloseBtn = document.querySelector('[data-login-close]');
  const loginCancelBtn = document.querySelector('[data-login-cancel]');
  const deleteModal = document.querySelector('[data-delete-modal]');
  const deleteText = document.querySelector('[data-delete-text]');
  const deleteCloseBtn = document.querySelector('[data-delete-close]');
  const deleteCancelBtn = document.querySelector('[data-delete-cancel]');
  const deleteConfirmBtn = document.querySelector('[data-delete-confirm]');
  const servicesGrid = document.querySelector('[data-services-grid]');
  const chatPanels = document.querySelectorAll('[data-chat-panel]');
  const chatInputs = document.querySelectorAll('[data-chat-input]');
  const sendButtons = document.querySelectorAll('[data-send-message]');
  const quickToggle = document.querySelector('[data-quick-toggle]');
  const quickPanel = document.querySelector('[data-quick-panel]');
  const quickItems = document.querySelectorAll('[data-quick-question]');
  const monthTitleEl = document.querySelector('[data-month-title]');
  const calendarGridEl = document.querySelector('[data-calendar-grid]');
  const diaryDetailEl = document.querySelector('[data-diary-detail]');
  const monthButtons = document.querySelectorAll('[data-change-month]');
  const signupForm = document.querySelector('[data-signup-form]');
  const checklistContainer = document.querySelector('[data-checklist]');
  const progressText = document.querySelector('[data-progress-text]');
  const progressBar = document.querySelector('[data-progress-bar]');

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  let currentMonth = new Date();
  let selectedDateKey = formatDateKey(new Date());
  let checklistLoaded = false;
  const checklistData = [];
  let checklistTotal = 0;

  function switchPage(page) {
    if (!page) return;
    state.currentPage = page;
    state.currentMode = page === 'services' ? 'info' : 'chat';

    sections.forEach((section) => {
      const isActive = section.dataset.page === page;
      section.classList.toggle('active', isActive);
      section.hidden = !isActive;
    });

    pageTriggers.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.targetPage === page);
    });

    if (page === 'services') {
      // 처음 진입하거나 대화 기록이 없으면 카드 다시 노출
      if (servicesGrid && state.messagesInfo.length === 0) {
        servicesGrid.classList.remove('is-hidden');
      }
    }

    moveNavIndicator();

    // Load diaries when switching to diary page
    if (page === 'diary') {
      loadDiaries();
      selectedDateKey = formatDateKey(currentMonth);
      renderDiaryDetail();
    }

    if (page === 'chat' && state.messagesChat.length === 0) {
      initializeChat();
    }
    if (page === 'services') {
      renderMessages();
    }
    if (page === 'signup') {
      loadChecklist();
      updateProgress();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  pageTriggers.forEach((btn) => {
    btn.addEventListener('click', () => switchPage(btn.dataset.targetPage));
  });

  function moveNavIndicator() {
    if (!navIndicator || !navElement) return;
    const activeBtn = navElement.querySelector(`.nav-item[data-target-page="${state.currentPage}"]`);
    if (!activeBtn || state.currentPage === 'home') {
      navIndicator.style.opacity = '0';
      navIndicator.style.transform = 'translate(-999px, -50%)';
      return;
    }

    const navRect = navElement.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    const centerX = btnRect.left - navRect.left + btnRect.width / 2;
    const indicatorWidth = btnRect.width + 16;
    const indicatorHeight = btnRect.height + 10;

    navIndicator.style.width = `${indicatorWidth}px`;
    navIndicator.style.height = `${indicatorHeight}px`;
    navIndicator.style.transform = `translate(${centerX - indicatorWidth / 2}px, -50%)`;
    navIndicator.style.opacity = '1';
  }

  // Service card click handlers
  const defaultCardQuestions = {
    funeral_facilities: '장례 시설 정보를 알려주세요.',
    support_policy: '장례 지원 정책이 궁금합니다.',
    inheritance: '유산 상속 절차를 알려주세요.',
    digital_info: '디지털 정보 처리 방법을 알려주세요.'
  };

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
      servicesGrid?.classList.add('is-hidden');

      const question = defaultCardQuestions[state.selectedServiceType] || `${title} 정보를 알려주세요.`;
      // Clear messages and send default question
      if (state.messagesInfo.length === 0) state.messagesInfo = [];
      renderMessages();
      switchPage('services');
      sendMessage('services', question);
    });
  });

  function renderAuth() {
    if (!authContainer) return;
    authContainer.innerHTML = '';

    if (state.isLoggedIn) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'button button-signup';
      deleteBtn.textContent = '회원 탈퇴';
      deleteBtn.addEventListener('click', () => openDeleteModal());

      const logoutBtn = document.createElement('button');
      logoutBtn.className = 'button button-logout';
      logoutBtn.textContent = '로그아웃';
      logoutBtn.addEventListener('click', () => {
        state.isLoggedIn = false;
        renderAuth();
      });
      authContainer.appendChild(deleteBtn);
      authContainer.appendChild(logoutBtn);
      return;
    }

    const loginBtn = document.createElement('button');
    loginBtn.type = 'button';
    loginBtn.className = 'button button-login';
    loginBtn.textContent = '로그인';
    loginBtn.addEventListener('click', () => {
      openLoginModal();
    });

    const signupBtn = document.createElement('button');
    signupBtn.type = 'button';
    signupBtn.className = 'button button-signup';
    signupBtn.textContent = '회원가입';
    signupBtn.addEventListener('click', () => {
      switchPage('signup');
    });

    authContainer.appendChild(loginBtn);
    authContainer.appendChild(signupBtn);
  }

  function openLoginModal() {
    if (!loginModal) return;
    loginModal.hidden = false;
    requestAnimationFrame(() => loginModal.classList.add('is-visible'));
    const firstInput = loginModal.querySelector('input[name="username"]');
    firstInput?.focus();
  }

  function closeLoginModal() {
    if (!loginModal) return;
    loginModal.classList.remove('is-visible');
    setTimeout(() => {
      loginModal.hidden = true;
    }, 150);
  }

  loginCloseBtn?.addEventListener('click', closeLoginModal);
  loginCancelBtn?.addEventListener('click', closeLoginModal);

  loginModal?.addEventListener('click', (e) => {
    if (e.target === loginModal) closeLoginModal();
  });

  loginForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const username = (formData.get('username') || '').toString().trim();
    const password = (formData.get('password') || '').toString().trim();
    if (!username || !password) return;

    // Demo 로그인 처리: 입력만 확인하고 로그인 상태 전환
    state.isLoggedIn = true;
    state.userName = username || '회원';
    renderAuth();
    closeLoginModal();
  });

  function openDeleteModal() {
    if (!deleteModal) return;
    if (deleteText) deleteText.textContent = `${state.userName}님 탈퇴하시겠습니까?🥺`;
    deleteModal.hidden = false;
    requestAnimationFrame(() => deleteModal.classList.add('is-visible'));
  }

  function closeDeleteModal() {
    if (!deleteModal) return;
    deleteModal.classList.remove('is-visible');
    setTimeout(() => { deleteModal.hidden = true; }, 150);
  }

  deleteCloseBtn?.addEventListener('click', closeDeleteModal);
  deleteCancelBtn?.addEventListener('click', closeDeleteModal);
  deleteModal?.addEventListener('click', (e) => {
    if (e.target === deleteModal) closeDeleteModal();
  });
  deleteConfirmBtn?.addEventListener('click', () => {
    // Demo: 탈퇴 후 로그아웃 처리
    state.isLoggedIn = false;
    renderAuth();
    closeDeleteModal();
  });

  function renderMessages() {
    chatPanels.forEach((panel) => {
      const key = panel.dataset.chatPanel;
      const msgEl = panel.querySelector(`[data-chat-messages="${key}"]`);
      if (!msgEl) return;

      const messages =
        key === 'services' ? state.messagesInfo :
        key === 'chat' ? state.messagesChat : [];

      msgEl.innerHTML = '';
      msgEl.classList.toggle('has-content', messages.length > 0);
      msgEl.style.display = messages.length ? 'flex' : 'none';
      panel.classList.toggle('is-chatting', messages.length > 0);

      messages.forEach((msg) => {
        const wrapper = document.createElement('div');
        wrapper.className = `message ${msg.role}`;

        const content = document.createElement('div');
        content.className = 'message-content';
        if (msg.loading) {
          content.classList.add('loading');
          content.innerHTML = `
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          `;
        } else {
          content.textContent = msg.content;
        }

        wrapper.appendChild(content);
        msgEl.appendChild(wrapper);
      });

      msgEl.scrollTop = msgEl.scrollHeight;
    });
  }

  function initializeChat() {
    // Add welcome message for empathy mode
    if (state.currentMode === 'chat' && state.messagesChat.length === 0) {
      state.messagesChat = [
        { role: 'bot', content: '안녕하세요! 오늘은 좀 어떠신가요? 편하게 말씀해주세요.' }
      ];
      renderMessages();
    }
  }

  const getActivePanelKey = () => (state.currentPage === 'services' ? 'services' : 'chat');

  function getPanelElements(panelKey) {
    const panel = document.querySelector(`[data-chat-panel="${panelKey}"]`);
    return {
      inputEl: panel?.querySelector(`[data-chat-input="${panelKey}"]`),
      messagesEl: panel?.querySelector(`[data-chat-messages="${panelKey}"]`),
    };
  }

  async function sendMessage(panelKey = getActivePanelKey(), presetText = null) {
    const { inputEl } = getPanelElements(panelKey);
    const text = (presetText !== null ? presetText : (inputEl?.value || '')).trim();
    if (!text || state.isLoading) return;

    console.log('[sendMessage]', panelKey, text);

    const getMessages = () => (panelKey === 'services' ? state.messagesInfo : state.messagesChat);
    const setMessages = (arr) => {
      if (panelKey === 'services') state.messagesInfo = arr;
      else state.messagesChat = arr;
    };

    let targetMessages = getMessages();

    // Add user message to UI
    targetMessages.push({ role: 'user', content: text });
    renderMessages();
    if (inputEl) inputEl.value = '';

    // Show loading state
    state.isLoading = true;
    const loadingMsg = { role: 'bot', content: '', loading: true };
    targetMessages.push(loadingMsg);
    renderMessages();

    try {
      if (panelKey === 'services' && servicesGrid) {
        servicesGrid.classList.add('is-hidden');
      }

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

      const cloned = response.clone();
      let rawText = '';
      let data = null;
      try {
        rawText = await cloned.text();
        data = rawText ? JSON.parse(rawText) : null;
      } catch (parseErr) {
        data = null;
      }

      if (!response.ok) {
        throw new Error((data && data.error) || `HTTP ${response.status}`);
      }

      // Remove loading message
      targetMessages = targetMessages.filter(msg => msg !== loadingMsg);
      setMessages(targetMessages);

      targetMessages.push({ role: 'bot', content: (data && data.response) || '응답이 없습니다.' });
      // Reset service type after first message in info mode
      if (panelKey === 'services') state.selectedServiceType = null;
    } catch (error) {
      // Remove loading message
      targetMessages = targetMessages.filter(msg => msg !== loadingMsg);
      setMessages(targetMessages);
      targetMessages.push({ 
        role: 'bot', 
        content: `서버와 연결할 수 없습니다. (${error.message || error}) 잠시 후 다시 시도해주세요.` 
      });
      console.error('Chat error:', error);
    } finally {
      state.isLoading = false;
      renderMessages();
    }
  }

  chatInputs.forEach((input) => {
    const key = input.dataset.chatInput;
    input.addEventListener('keyup', (event) => {
      if (event.isComposing) return;
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage(key);
      }
    });
  });

  sendButtons.forEach((btn) => {
    const key = btn.dataset.sendMessage;
    btn.addEventListener('click', () => sendMessage(key));
  });

  quickToggle?.addEventListener('click', () => {
    if (!quickPanel) return;
    quickPanel.classList.toggle('is-open');
  });

  const quickExamples = {
    funeral_facilities: '장례식장/화장시설 위치와 비용을 알려주세요.',
    support_policy: '지자체 장례 지원 정책이 궁금해요.',
    inheritance: '유산 상속 절차를 간단히 설명해 주세요.',
    digital_info: '사망 후 디지털 계정 처리 방법이 궁금해요.'
  };

  quickItems.forEach((item) => {
    item.addEventListener('click', () => {
      const key = item.dataset.quickQuestion;
      state.selectedServiceType = key;
      const text = quickExamples[key] || '';
      const { inputEl } = getPanelElements('services');
      if (inputEl) {
        inputEl.value = text;
        inputEl.focus();
      }
      sendMessage('services');
      quickPanel?.classList.remove('is-open');
    });
  });

  // Diary functionality
  async function loadDiaries() {
    diaryEntries = {};
    try {
      const response = await fetch('/api/diaries/');
      const data = await response.json();

      if (data.error) {
        console.error('Failed to load diaries:', data.error);
      } else if (Array.isArray(data.diaries)) {
        data.diaries.forEach(diary => {
          diaryEntries[diary.date] = {
            emoji: diary.emoji,
            tag: diary.tags,
            content: null // Will be loaded on demand
          };
        });
      }
    } catch (error) {
      console.error('Error loading diaries:', error);
    } finally {
      renderCalendar(); // 캘린더는 항상 표시
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
      const hasEntry = !!diaryEntries[selectedDateKey];
      const diaryContent = hasEntry ? await loadDiaryDetail(selectedDateKey) : null;
      
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

  // Signup checklist & progress
  async function loadChecklist() {
    if (checklistLoaded || !checklistContainer) return;
    try {
      const response = await fetch('/static/data/user_profile_checklist.csv');
      const text = await response.text();
      const lines = text.trim().split('\n');
      if (lines.length <= 1) throw new Error('No checklist data');
      lines.shift(); // header
      const splitCsv = (line) => line.split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/).map((s) => s.replace(/^"|"$/g, ''));
      lines.forEach((line) => {
        const cols = splitCsv(line);
        if (cols.length < 6) return;
        const [question_id, section, category, question_kr, input_type, options_kr] = cols;
        checklistData.push({ question_id, section, category, question_kr, input_type, options_kr });
      });
      checklistTotal = checklistData.length + 2; // id + pw + checklist items
      renderChecklist();
      checklistLoaded = true;
      updateProgress();
    } catch (err) {
      console.error('Checklist load failed', err);
      checklistContainer.innerHTML = '<p class="checklist-error">체크리스트를 불러오지 못했습니다.</p>';
    }
  }

  function renderChecklist() {
    if (!checklistContainer) return;
    checklistContainer.innerHTML = '';
    checklistData.forEach((item) => {
      const field = document.createElement('div');
      field.className = 'checklist-item';
      const label = document.createElement('label');
      const badge = document.createElement('span');
      badge.className = 'checklist-badge';
      badge.textContent = item.category || '';
      const qText = document.createElement('div');
      qText.className = 'checklist-question';
      qText.textContent = item.question_kr || item.question_id;
      label.appendChild(badge);
      label.appendChild(qText);
      field.appendChild(label);

      if (item.input_type === 'single_choice' && item.options_kr) {
        const opts = item.options_kr.split(';');
        const hidden = document.createElement('input');
        hidden.type = 'hidden';
        hidden.name = item.question_id;
        field.appendChild(hidden);

        const list = document.createElement('div');
        list.className = 'checklist-options';
        opts.forEach((opt) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'option-button';
          btn.textContent = opt.trim();
          btn.addEventListener('click', () => {
            hidden.value = opt.trim();
            list.querySelectorAll('.option-button').forEach((b) => b.classList.remove('selected'));
            btn.classList.add('selected');
            updateProgress();
          });
          list.appendChild(btn);
        });
        field.appendChild(list);
      } else {
        const input = document.createElement('input');
        input.type = 'text';
        input.name = item.question_id;
        input.placeholder = '답변을 입력하세요';
        input.addEventListener('input', updateProgress);
        field.appendChild(input);
      }

      checklistContainer.appendChild(field);
    });
  }

  signupForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(signupForm);
    const username = (formData.get('signup_username') || '').toString().trim();
    const password = (formData.get('signup_password') || '').toString().trim();
    if (!username || !password) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    state.isLoggedIn = true;
    state.userName = username;
    renderAuth();
    switchPage('home');
  });

  function updateProgress() {
    if (!progressBar || !progressText) return;
    const inputs = [
      ...(signupForm?.querySelectorAll('input[name="signup_username"], input[name="signup_password"]') || []),
      ...(checklistContainer?.querySelectorAll('input') || [])
    ];
    let answered = 0;
    inputs.forEach((el) => {
      if (el.type === 'hidden') {
        if (el.value && el.value.trim()) answered += 1;
      } else if (el.type === 'text' || el.type === 'password') {
        if (el.value && el.value.trim()) answered += 1;
      }
    });
    const percent = checklistTotal ? Math.min(100, Math.round((answered / checklistTotal) * 100)) : 0;
    progressBar.style.width = `${percent}%`;
    progressText.textContent = `${percent}% 완료`;
  }

  window.addEventListener('resize', () => moveNavIndicator());

  renderAuth();
  switchPage(state.currentPage);
  state.selectedServiceType = null;
});

}