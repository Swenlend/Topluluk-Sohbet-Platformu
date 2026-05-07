

// Global Error Handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  showNotification('Bir hata oluştu. Lütfen sayfayı yenileyin.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  showNotification('Bağlantı hatası oluştu.', 'error');
});

// Performance Monitoring
const performanceMonitor = {
  startTime: Date.now(),
  logAction: (action) => {
    console.log(`[${new Date().toISOString()}] ${action} - ${Date.now() - performanceMonitor.startTime}ms`);
  }
};

// Debounce Utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Input Sanitization
function sanitizeInput(input) {
  return input.replace(/[<>]/g, '').trim();
}

// Loading States Manager
const loadingManager = {
  activeLoadings: new Set(),
  show: (id) => {
    loadingManager.activeLoadings.add(id);
    const el = document.getElementById(id);
    if (el) el.style.display = 'block';
  },
  hide: (id) => {
    loadingManager.activeLoadings.delete(id);
    const el = document.getElementById(id);
    if (el) el.style.display = 'none';
  },
  isLoading: () => loadingManager.activeLoadings.size > 0
};

// Memory Management
function cleanupMemory() {
  // Clear old messages if too many
  Object.keys(state.messages).forEach(roomId => {
    if (state.messages[roomId].length > 1000) {
      state.messages[roomId] = state.messages[roomId].slice(-500);
    }
  });

  // Force garbage collection if available
  if (window.gc) window.gc();
}

// Offline Support
let isOnline = navigator.onLine;
window.addEventListener('online', () => {
  isOnline = true;
  showNotification('İnternet bağlantısı geri geldi!', 'success');
  // Retry failed requests
});

window.addEventListener('offline', () => {
  isOnline = false;
  showNotification('İnternet bağlantısı koptu!', 'warning');
});

// Accessibility Improvements
function announceToScreenReader(message) {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.style.position = 'absolute';
  announcement.style.left = '-10000px';
  announcement.style.width = '1px';
  announcement.style.height = '1px';
  announcement.style.overflow = 'hidden';
  announcement.textContent = message;
  document.body.appendChild(announcement);
  setTimeout(() => document.body.removeChild(announcement), 1000);
}

// Professional Analytics (Basic)
const analytics = {
  events: [],
  track: (event, data) => {
    analytics.events.push({ event, data, timestamp: Date.now() });
    console.log('Analytics:', event, data);
    // In production, send to analytics service
  }
};

// Rate Limiting
const rateLimiter = {
  attempts: {},
  check: (key, limit = 10, windowMs = 60000) => {
    const now = Date.now();
    if (!rateLimiter.attempts[key]) {
      rateLimiter.attempts[key] = [];
    }
    rateLimiter.attempts[key] = rateLimiter.attempts[key].filter(time => now - time < windowMs);
    if (rateLimiter.attempts[key].length >= limit) {
      return false;
    }
    rateLimiter.attempts[key].push(now);
    return true;
  }
};

// Genel Değişkenler
const state = {
  currentUser: null,
  currentRoom: null,
  messages: {},
  rooms: {},
  users: {},
  isOnline: true,
  socket: null,
  token: localStorage.getItem('token')
};

function navigateTo(page) {
  const homePage = document.getElementById('homePage');
  const loginDiv = document.getElementById('login');
  const chatScreen = document.getElementById('chatScreen');

  if (page === 'home') {
    homePage.classList.remove('hidden');
    loginDiv.classList.add('hidden');
    chatScreen.classList.add('hidden');
  } else if (page === 'login') {
    homePage.classList.add('hidden');
    loginDiv.classList.remove('hidden');
    chatScreen.classList.add('hidden');
    switchTab('login');
  } else if (page === 'register') {
    homePage.classList.add('hidden');
    loginDiv.classList.remove('hidden');
    chatScreen.classList.add('hidden');
    switchTab('register');
  } else if (page === 'chat') {
    homePage.classList.add('hidden');
    loginDiv.classList.add('hidden');
    chatScreen.classList.remove('hidden');
  }
}

function toggleVoicePanel() {
  const voicePanel = document.getElementById('voicePanel');
  if (voicePanel.classList.contains('hidden')) {
    voicePanel.classList.remove('hidden');
    showNotification('Sesli sohbet odaları açıldı.', 'success');
  } else {
    voicePanel.classList.add('hidden');
    stopAllVoiceChats();
    showNotification('Sesli sohbet kapatıldı.', 'info');
  }
}

// Message input controls
function toggleEmojiPicker() {
  const emojiBar = document.getElementById('emojiBar');
  if (emojiBar.classList.contains('hidden')) {
    emojiBar.classList.remove('hidden');
    initializeEmojis();
  } else {
    emojiBar.classList.add('hidden');
  }
}

function toggleStickerPicker() {
  const stickerBar = document.getElementById('stickerBar');
  if (!stickerBar) {
    // Create sticker bar if not exists
    const newStickerBar = document.createElement('div');
    newStickerBar.id = 'stickerBar';
    newStickerBar.className = 'emoji-bar';
    document.querySelector('.card-body').insertBefore(newStickerBar, document.querySelector('.msg-input-row'));
    initializeStickers();
  } else {
    stickerBar.classList.toggle('hidden');
  }
}

function toggleGifPicker() {
  const gifBar = document.getElementById('gifBar');
  if (!gifBar) {
    // Create GIF bar if not exists
    const newGifBar = document.createElement('div');
    newGifBar.id = 'gifBar';
    newGifBar.className = 'emoji-bar';
    newGifBar.innerHTML = '<input type="text" id="gifSearch" placeholder="GIF ara..." style="width:100%;margin-bottom:8px;"><div id="gifResults"></div>';
    document.querySelector('.card-body').insertBefore(newGifBar, document.querySelector('.msg-input-row'));
    document.getElementById('gifSearch').addEventListener('input', searchGifs);
  } else {
    gifBar.classList.toggle('hidden');
  }
}

function toggleFileUpload() {
  document.getElementById('fileInput').click();
}

// WebRTC Voice Chat Variables
let localStream = null;
let peerConnections = new Map();
let currentVoiceRoom = null;
let isMicOn = false;

// Voice Chat Functions
async function startVoice(roomType) {
  try {
    if (currentVoiceRoom) {
      showNotification('Zaten bir sesli odadasınız!', 'error');
      return;
    }

    // Get user media
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    });

    // Start with video disabled
    localStream.getVideoTracks().forEach(track => track.enabled = false);

    currentVoiceRoom = roomType;
    isMicOn = true;

    // Join voice room via socket
    if (state.socket) {
      state.socket.emit('join-voice-room', {
        roomType,
        userId: state.currentUser._id,
        username: state.currentUser.username
      });
    }

    updateVoiceUI(roomType);
    showNotification(`${roomType} odasına katıldınız!`, 'success');

  } catch (error) {
    console.error('Voice chat error:', error);
    showNotification('Mikrofon erişimi reddedildi!', 'error');
  }
}

function stopVoice() {
  if (currentVoiceRoom) {
    // Leave voice room
    if (state.socket) {
      state.socket.emit('leave-voice-room', {
        roomType: currentVoiceRoom,
        userId: state.currentUser._id
      });
    }

    stopAllVoiceChats();
    currentVoiceRoom = null;
    updateVoiceUI(null);
    showNotification('Sesli sohbetten ayrıldınız.', 'info');
  }
}

function stopAllVoiceChats() {
  // Stop local stream
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  // Close all peer connections
  peerConnections.forEach(pc => pc.close());
  peerConnections.clear();

  isMicOn = false;
}

function toggleMic() {
  if (localStream) {
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      isMicOn = audioTrack.enabled;
      updateVoiceUI(currentVoiceRoom);
      showNotification(isMicOn ? 'Mikrofon açıldı' : 'Mikrofon kapatıldı', 'info');
    }
  }
}

function updateVoiceUI(roomType) {
  const voicePanel = document.getElementById('voicePanel');
  const startBtn = document.querySelector('.voice-start-btn');
  const stopBtn = document.querySelector('.voice-stop-btn');
  const micBtn = document.querySelector('.voice-mic-btn');

  if (roomType) {
    voicePanel.innerHTML = `
      <div class="voice-room-info">
        <h3>${roomType.charAt(0).toUpperCase() + roomType.slice(1)} Odası</h3>
        <p>Bağlı kullanıcılar: <span id="voiceUserCount">1</span>/5</p>
        <div class="voice-controls">
          <button class="btn btn-secondary voice-mic-btn" onclick="toggleMic()">
            ${isMicOn ? '🔊' : '🔇'} Mikrofon
          </button>
          <button class="btn btn-secondary" onclick="toggleCamera()">
            📷 Kamera
          </button>
          <button class="btn btn-secondary" onclick="shareScreen()">
            🖥️ Ekran Paylaş
          </button>
          <button class="btn btn-danger voice-stop-btn" onclick="stopVoice()">
            ❌ Ayrıl
          </button>
        </div>
        <div class="voice-users" id="voiceUsers"></div>
      </div>
    `;
  } else {
    voicePanel.innerHTML = `
      <h3>Sesli Sohbet Odaları</h3>
      <div class="voice-rooms">
        <button class="btn btn-primary voice-start-btn" onclick="startVoice('genel')">🎙️ Genel Sohbet (5 kişi)</button>
        <button class="btn btn-primary voice-start-btn" onclick="startVoice('oyun')">🎮 Oyun Odası (5 kişi)</button>
        <button class="btn btn-primary voice-start-btn" onclick="startVoice('sohbet')">💬 Sohbet Odası (5 kişi)</button>
        <button class="btn btn-primary voice-start-btn" onclick="startVoice('tanisma')">👋 Tanışma Odası (5 kişi)</button>
      </div>
    `;
  }
}

// Voice camera and screen share functions
function toggleCamera() {
  if (!localStream) return;

  const videoTracks = localStream.getVideoTracks();
  videoTracks.forEach(track => {
    track.enabled = !track.enabled;
  });
  const isCameraOn = videoTracks[0]?.enabled || false;

  showNotification(isCameraOn ? 'Kamera açıldı' : 'Kamera kapatıldı', 'info');
}

function shareScreen() {
  if (!currentVoiceRoom) {
    showNotification('Önce bir sesli odaya katılın!', 'error');
    return;
  }

  navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false
  }).then(screenStream => {
    // Replace video track with screen share
    const videoTrack = screenStream.getVideoTracks()[0];
    peerConnections.forEach(pc => {
      const sender = pc.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(videoTrack);
      }
    });

    videoTrack.onended = () => {
      // Switch back to camera
      if (localStream) {
        const cameraTrack = localStream.getVideoTracks()[0];
        peerConnections.forEach(pc => {
          const sender = pc.getSenders().find(s => s.track?.kind === 'video');
          if (sender) {
            sender.replaceTrack(cameraTrack);
          }
        });
      }
      showNotification('Ekran paylaşımı durduruldu', 'info');
    };

    showNotification('Ekran paylaşımı başladı', 'success');
  }).catch(error => {
    console.error('Screen share error:', error);
    showNotification('Ekran paylaşımı reddedildi!', 'error');
  });
}

// Socket.io voice events
function initializeVoiceEvents() {
  if (!state.socket) return;

  state.socket.on('voice-user-joined', (data) => {
    if (data.roomType === currentVoiceRoom) {
      showNotification(`${data.username} odaya katıldı`, 'info');
      updateVoiceUserCount(data.userCount);
      createPeerConnection(data.userId, data.username);
    }
  });

  state.socket.on('voice-user-left', (data) => {
    if (data.roomType === currentVoiceRoom) {
      showNotification(`${data.username} odadan ayrıldı`, 'info');
      updateVoiceUserCount(data.userCount);
      if (peerConnections.has(data.userId)) {
        peerConnections.get(data.userId).close();
        peerConnections.delete(data.userId);
      }
    }
  });

  state.socket.on('voice-offer', async (data) => {
    if (data.roomType === currentVoiceRoom) {
      const pc = peerConnections.get(data.from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        state.socket.emit('voice-answer', {
          answer,
          to: data.from,
          roomType: currentVoiceRoom
        });
      }
    }
  });

  state.socket.on('voice-answer', async (data) => {
    if (data.roomType === currentVoiceRoom) {
      const pc = peerConnections.get(data.from);
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      }
    }
  });

  state.socket.on('ice-candidate', async (data) => {
    if (data.roomType === currentVoiceRoom) {
      const pc = peerConnections.get(data.from);
      if (pc) {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    }
  });
}

function createPeerConnection(userId, username) {
  const pc = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  });

  peerConnections.set(userId, pc);

  // Add local stream
  if (localStream) {
    localStream.getTracks().forEach(track => pc.addTrack(track, localStream));
  }

  // Handle remote stream
  pc.ontrack = (event) => {
    const remoteAudio = new Audio();
    remoteAudio.srcObject = event.streams[0];
    remoteAudio.play();
  };

  // Handle ICE candidates
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      state.socket.emit('ice-candidate', {
        candidate: event.candidate,
        to: userId,
        roomType: currentVoiceRoom
      });
    }
  };

  // Create offer if we're the initiator
  if (userId !== state.currentUser._id) {
    pc.createOffer().then(offer => {
      pc.setLocalDescription(offer);
      state.socket.emit('voice-offer', {
        offer,
        to: userId,
        roomType: currentVoiceRoom
      });
    });
  }
}

function updateVoiceUserCount(count) {
  const countEl = document.getElementById('voiceUserCount');
  if (countEl) {
    countEl.textContent = count;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (state.token) {
    // Token varsa, verify et
    verifyToken();
  } else {
    // Token yoksa login göster
    navigateTo('login');
  }
});

// DOM ELEMENTS
const loginDiv = document.getElementById('login');
const roleSelectDiv = document.getElementById('roleSelect');
const chatScreen = document.getElementById('chatScreen');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const usernameDisplay = document.getElementById('usernameDisplay');
const roleBadge = document.getElementById('roleBadge');
const userList = document.getElementById('userList');
const userInfo = document.getElementById('userInfo');
const categoryList = document.getElementById('categoryList');
const adminPanel = document.getElementById('adminPanel');
const adminUserList = document.getElementById('adminUserList');
const roomTitle = document.getElementById('roomTitle');
const announcement = document.getElementById('announcement');
const emojiBar = document.getElementById('emojiBar');

// Notification system


// Initialize Socket.io
function initializeSocket() {
  state.socket = io();

  state.socket.on('connect', () => {
    console.log('Connected to server');
    if (state.currentUser && state.currentRoom) {
      state.socket.emit('join-room', {
        roomId: state.currentRoom,
        username: state.currentUser.username,
        token: state.token
      });
    }
  });

  state.socket.on('disconnect', () => {
    console.log('Disconnected from server');
  });

  // Message events
  state.socket.on('new-message', (message) => {
    if (!state.messages[message.roomId]) {
      state.messages[message.roomId] = [];
    }
    state.messages[message.roomId].push(message);
    renderMessages();
  });

  state.socket.on('message-updated', (updatedMessage) => {
    const messages = state.messages[updatedMessage.roomId];
    if (messages) {
      const index = messages.findIndex(m => m._id === updatedMessage._id);
      if (index > -1) {
        messages[index] = updatedMessage;
        renderMessages();
      }
    }
  });

  state.socket.on('message-deleted', (data) => {
    const messages = state.messages[data.roomId];
    if (messages) {
      const index = messages.findIndex(m => m._id === data.messageId);
      if (index > -1) {
        messages.splice(index, 1);
        renderMessages();
      }
    }
  });

  // User events
  state.socket.on('user-joined', (data) => {
    showNotification(`${data.username} odaya katıldı`, 'info');
    updateUserList();
  });

  state.socket.on('user-left', (data) => {
    showNotification(`${data.username} odadan ayrıldı`, 'info');
    updateUserList();
  });

  state.socket.on('room-users-update', (data) => {
    if (data.roomId === state.currentRoom) {
      updateUserList();
    }
  });

  state.socket.on('error', (error) => {
    showNotification(error.message || 'Bir hata oluştu!', 'error');
  });
}

// Varsayılan Kategoriler
const categories = {
  genel: { name: 'Genel Sohbet', icon: '💬', color: '#06b6d4' },
  oyun: { name: 'Oyun Odasında', icon: '🎮', color: '#8b5cf6' },
  muzik: { name: 'Müzik', icon: '🎵', color: '#ec4899' },
  spor: { name: 'Spor', icon: '⚽', color: '#f59e0b' },
  teknoloji: { name: 'Teknoloji', icon: '💻', color: '#10b981' },
  sanat: { name: 'Sanat & Tasarım', icon: '🎨', color: '#f97316' }
};

// ============================================
// 1. GAL_LOGIN VE ROL SEÇİMİ İŞLEVLERİ
// ============================================

function validateUsername(username) {
  if (!username || username.trim().length < 2) {
    showNotification('Kullanıcı adı en az 2 karakter olmalı!', 'error');
    return false;
  }
  if (username.trim().length > 20) {
    showNotification('Kullanıcı adı 20 karakteri geçemez!', 'error');
    return false;
  }
  return true;
}

function validateAge(age) {
  const ageNum = parseInt(age);
  if (!age || isNaN(ageNum)) {
    showNotification('Lütfen geçerli bir yaş girin!', 'error');
    return false;
  }
  if (ageNum < 13) {
    showNotification('Yaşınız en az 13 olmalı!', 'error');
    return false;
  }
  if (ageNum > 120) {
    showNotification('Geçerli bir yaş girin!', 'error');
    return false;
  }
  return true;
}

function switchTab(tab) {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const loginBtn = document.querySelector('.tab-btn:nth-child(1)');
  const registerBtn = document.querySelector('.tab-btn:nth-child(2)');

  if (tab === 'login') {
    loginTab.classList.remove('hidden');
    registerTab.classList.add('hidden');
    loginBtn.classList.add('active');
    registerBtn.classList.remove('active');
  } else {
    registerTab.classList.remove('hidden');
    loginTab.classList.add('hidden');
    registerBtn.classList.add('active');
    loginBtn.classList.remove('active');
  }
}

function login() {
  const identifier = document.getElementById('loginIdentifier').value.trim();
  const password = document.getElementById('loginPassword').value;

  if (!identifier || !password) {
    showNotification('Lütfen tüm alanları doldurun!', 'error');
    return;
  }

  showNotification('Giriş yapılıyor...', 'info');

  fetch('/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      identifier,
      password
    })
  })
  .then(response => {
    console.log('Login response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Login response data:', data);
    if (data.token) {
      state.token = data.token;
      state.currentUser = data.user;
      localStorage.setItem('token', state.token);

      // Initialize Socket.io
      initializeSocket();
      initializeVoiceEvents();

      navigateTo('chat');
      updateUI();
      // Default room'a katıl
      joinRoom('genel');
      showNotification(`Hoşgeldiniz ${state.currentUser.username}!`, 'success');
    } else {
      showNotification(data.message || 'Giriş başarısız', 'error');
    }
  })
  .catch(error => {
    console.error('Login error:', error);
    showNotification('Bağlantı hatası', 'error');
  });
}

function guestLogin() {
  showNotification('Misafir olarak giriş yapılıyor...', 'info');

  fetch('/api/auth/guest-login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  })
  .then(response => {
    console.log('Guest login response status:', response.status);
    return response.json();
  })
  .then(data => {
    console.log('Guest login response data:', data);
    if (data.token) {
      state.token = data.token;
      state.currentUser = data.user;
      localStorage.setItem('token', state.token);
      localStorage.setItem('isGuest', 'true');

      // Initialize Socket.io
      initializeSocket();
      initializeVoiceEvents();

      navigateTo('chat');
      updateUI();
      // Default room'a katıl
      joinRoom('genel');
      showNotification(`Hoşgeldiniz ${state.currentUser.username}!`, 'success');
    } else {
      showNotification(data.message || 'Misafir girişi başarısız', 'error');
    }
  })
  .catch(error => {
    console.error('Guest login error:', error);
    showNotification('Bağlantı hatası', 'error');
  });
}

function verifyToken() {
  fetch('/api/auth/verify-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.valid) {
      state.currentUser = data.user;
      // Initialize Socket.io
      initializeSocket();
      initializeVoiceEvents();
      navigateTo('chat');
      updateUI();
      // Default room'a katıl
      joinRoom('genel');
      showNotification(`Hoşgeldiniz ${state.currentUser.username}!`, 'success');
    } else {
      // Token geçersiz, login göster
      localStorage.removeItem('token');
      state.token = null;
      navigateTo('login');
    }
  })
  .catch(error => {
    console.error('Token verification error:', error);
    localStorage.removeItem('token');
    state.token = null;
    navigateTo('login');
  });
}

function register() {
  try {
    if (!isOnline) {
      showNotification('İnternet bağlantısı yok!', 'error');
      return;
    }

    const username = sanitizeInput(document.getElementById('regUsername').value.trim());
    const email = sanitizeInput(document.getElementById('regEmail').value.trim());
    const password = document.getElementById('regPassword').value;
    const passwordConfirm = document.getElementById('regPasswordConfirm').value;
    const age = document.getElementById('regAge').value;
    const roleCheckboxes = document.querySelectorAll('.roles-container input[type="checkbox"]:checked');
    const roles = Array.from(roleCheckboxes).map(cb => sanitizeInput(cb.value));

    if (!username || !email || !password || !passwordConfirm || !age) {
      showNotification('Lütfen tüm alanları doldurun!', 'error');
      announceToScreenReader('Tüm alanlar zorunludur');
      return;
    }

    if (password !== passwordConfirm) {
      showNotification('Şifreler eşleşmiyor!', 'error');
      return;
    }

    if (roles.length === 0) {
      showNotification('En az bir rol seçin!', 'error');
      return;
    }

    if (roles.length > 5) {
      showNotification('En fazla 5 rol seçebilirsiniz!', 'error');
      return;
    }

    if (!validateUsername(username) || !validateAge(age)) {
      return;
    }

    if (password.length < 6) {
      showNotification('Şifre en az 6 karakter olmalı!', 'error');
      return;
    }

    loadingManager.show('registerLoading');
    const registerBtn = document.getElementById('registerButton');
    if (registerBtn) {
      registerBtn.disabled = true;
      registerBtn.textContent = '⏳ Kayıt yapılıyor...';
    }

    fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username,
        email,
        password,
        age: parseInt(age),
        roles
      })
    })
    .then(response => {
      console.log('Register response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Register response data:', data);
      loadingManager.hide('registerLoading');
      const registerBtn = document.getElementById('registerButton');
      if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Kayıt Ol';
      }

      if (data.token) {
        state.token = data.token;
        state.currentUser = data.user;
        localStorage.setItem('token', state.token);

        initializeSocket();
        initializeVoiceEvents();

        navigateTo('chat');
        updateUI();
        joinRoom('genel');
        showNotification(`Kayıt başarılı! Hoşgeldiniz ${state.currentUser.username}!`, 'success');
        announceToScreenReader('Kayıt başarılı, sohbete yönlendiriliyorsunuz');
        analytics.track('registration_success');
      } else {
        showNotification(data.message || 'Kayıt başarısız', 'error');
        analytics.track('registration_failed', { reason: data.message });
      }
    })
    .catch(error => {
      console.error('Register error:', error);
      loadingManager.hide('registerLoading');
      const registerBtn = document.getElementById('registerButton');
      if (registerBtn) {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Kayıt Ol';
      }
      showNotification('Kayıt sırasında hata oluştu. Lütfen tekrar deneyin.', 'error');
      analytics.track('registration_error', { error: error.message });
    });

  } catch (error) {
    console.error('Register function error:', error);
    showNotification('Beklenmeyen hata oluştu!', 'error');
    loadingManager.hide('registerLoading');
  }
}

function enterChat() {
  // Eski fonksiyon, artık kullanılmıyor
}

// ============================================
// 2. CHAT İŞLEVLERİ
// ============================================

function sendMessage() {
  try {
    if (!isOnline) {
      showNotification('İnternet bağlantısı yok!', 'error');
      return;
    }

    if (!rateLimiter.check('sendMessage', 5, 10000)) {
      showNotification('Çok fazla mesaj gönderiyorsunuz. Lütfen bekleyin.', 'warning');
      return;
    }

    const text = sanitizeInput(messageInput.value.trim());

    if (!text) {
      showNotification('Boş mesaj gönderilemiyor!', 'error');
      announceToScreenReader('Mesaj boş olamaz');
      return;
    }

    if (text.length > 2000) {
      showNotification('Mesaj 2000 karakteri geçemez!', 'error');
      return;
    }

    if (!state.socket) {
      showNotification('Bağlantı yok!', 'error');
      return;
    }

    loadingManager.show('messageLoading');
    const sendBtn = document.getElementById('sendButton');
    if (sendBtn) sendBtn.disabled = true;

    const messageData = {
      content: text,
      type: 'text'
    };

    analytics.track('message_sent', { length: text.length, room: state.currentRoom });

    state.socket.emit('send-message', {
      roomId: state.currentRoom,
      message: messageData,
      userId: state.currentUser._id,
      username: state.currentUser.username,
      avatar: state.currentUser.avatar
    });

    messageInput.value = '';
    performanceMonitor.logAction('Message sent');

    setTimeout(() => {
      loadingManager.hide('messageLoading');
      if (sendBtn) sendBtn.disabled = false;
    }, 500);

  } catch (error) {
    console.error('Send message error:', error);
    showNotification('Mesaj gönderilirken hata oluştu!', 'error');
    loadingManager.hide('messageLoading');
  }
}

function renderMessages() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const roomMessages = state.messages[state.currentRoom] || [];

  messagesDiv.innerHTML = '';

  const filteredMessages = roomMessages.filter(msg =>
    msg.content.toLowerCase().includes(searchTerm) ||
    msg.username.toLowerCase().includes(searchTerm)
  );

  if (filteredMessages.length === 0) {
    messagesDiv.innerHTML = '<div style="color:#94a3b8;text-align:center;padding:20px;">Bu odada henüz mesaj yok</div>';
    return;
  }

  filteredMessages.forEach(msg => {
    const msgEl = document.createElement('div');
    msgEl.className = 'message';
    msgEl.innerHTML = `
      <div class="avatar" style="background:${getRoleColor(msg.role || 'user')}">${msg.avatar || getAvatarEmoji(msg.username)}</div>
      <div class="msg-content">
        <div style="display:flex;align-items:center;gap:8px;">
          <span class="msg-user">${msg.username}</span>
          <span class="badge" style="background:${getRoleColor(msg.role || 'user')};color:white;font-size:10px;">${getRoleName(msg.role || 'user')}</span>
          <span class="msg-user" style="font-size:11px;color:#64748b;">${new Date(msg.timestamp).toLocaleTimeString('tr-TR')}</span>
        </div>
        <div class="msg-text">${escapeHtml(msg.content)}</div>
      </div>
    `;
    messagesDiv.appendChild(msgEl);
  });

  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// ============================================
// 3. ODA YÖNETİMİ
// ============================================

function createRoom() {
  const roomName = document.getElementById('roomName').value.trim();
  const roomPassword = document.getElementById('roomPassword').value || null;
  const roomMax = parseInt(document.getElementById('roomMax').value) || 50;

  if (!roomName) {
    showNotification('Oda adı gerekli!', 'error');
    return;
  }

  if (roomName.length > 30) {
    showNotification('Oda adı 30 karakteri geçemez!', 'error');
    return;
  }

  // Create room via API
  fetch('/api/rooms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.token}`
    },
    body: JSON.stringify({
      name: roomName,
      description: '',
      category: 'ozel',
      type: roomPassword ? 'password' : 'public',
      maxUsers: roomMax,
      password: roomPassword
    })
  })
  .then(response => response.json())
  .then(data => {
    if (data.room) {
      state.rooms[data.room.name] = data.room;
      updateCategoryList();

      document.getElementById('roomName').value = '';
      document.getElementById('roomPassword').value = '';
      document.getElementById('roomMax').value = '';

      showNotification(`"${roomName}" odası oluşturuldu! ✨`, 'success');
      joinRoom(data.room.name);
    } else {
      showNotification(data.message || 'Oda oluşturma başarısız', 'error');
    }
  })
  .catch(error => {
    console.error('Create room error:', error);
    showNotification('Oda oluşturma hatası', 'error');
  });
}

function joinRoom(roomId) {
  if (!state.socket) {
    showNotification('Bağlantı yok!', 'error');
    return;
  }

  // Join room via socket
  state.socket.emit('join-room', {
    roomId,
    userId: state.currentUser._id,
    username: state.currentUser.username
  });

  state.currentRoom = roomId;
  updateUI();

  // Load messages for the room
  loadRoomMessages(roomId);
}

function leaveRoom() {
  if (!state.currentRoom) return;

  // İlk odaya dön
  state.currentRoom = 'genel';
  updateUI();
  showNotification('Odadan ayrıldınız.', 'info');
}

// ============================================
// VOICE, VIDEO VE MEDYA PLACEHOLDER'LAR
// ============================================

function startVideo() {
  showNotification('📹 Video Chat özelliği yakında...', 'info');
}

function stopVideo() {
  showNotification('Video kapatıldı', 'info');
}

function searchGif() {
  showNotification('🎬 GIF arama özelliği yakında...', 'info');
}

function googleSignIn() {
  const username = Math.random().toString(36).substring(7);
  document.getElementById('username').value = `Google_${username}`;
  document.getElementById('age').value = Math.floor(Math.random() * 40) + 18;
  enterChat();
}

// ============================================
// 4. KULLANİCI VE UI YÖNETİMİ
// ============================================

function updateUI() {
  if (state.currentUser) {
    usernameDisplay.textContent = state.currentUser.username;
    roleBadge.textContent = getRoleName(state.currentUser.role);
    roleBadge.style.background = getRoleColor(state.currentUser.role);
  }

  updateUserList();
  updateCategoryList();
  updateAdminPanel();
  loadRooms(); // Odaları yükle
}

function loadRooms() {
  fetch('/api/rooms', {
    headers: {
      'Authorization': `Bearer ${state.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.rooms) {
      // Convert array to object
      state.rooms = {};
      data.rooms.forEach(room => {
        state.rooms[room.name] = room;
      });
      updateCategoryList();
    }
  })
  .catch(error => {
    console.error('Load rooms error:', error);
  });
}

function updateAdminPanel() {
  if (!state.currentUser || state.currentUser.role !== 'admin') {
    adminPanel.classList.add('hidden');
    return;
  }

  adminPanel.classList.remove('hidden');
  adminUserList.innerHTML = '';

  // Load users for admin
  fetch('/api/users', {
    headers: {
      'Authorization': `Bearer ${state.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.users) {
      data.users.forEach(user => {
        const userEl = document.createElement('div');
        userEl.className = 'user-admin-item';
        userEl.innerHTML = `
          <span>${user.username} (${getRoleName(user.role)})</span>
          <div>
            <button class="btn btn-danger btn-sm" onclick="adminKickUser('${user.username}')">At</button>
            <button class="btn btn-primary btn-sm" onclick="changeUserRole('${user._id}', 'moderator')">Mod Yap</button>
          </div>
        `;
        adminUserList.appendChild(userEl);
      });
    }
  })
  .catch(error => {
    console.error('Load users error:', error);
  });
}

function changeUserRole(userId, newRole) {
  fetch(`/api/users/${userId}/role`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${state.token}`
    },
    body: JSON.stringify({ role: newRole })
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification('Rol güncellendi!', 'success');
      updateAdminPanel();
    } else {
      showNotification(data.message || 'Rol güncelleme başarısız', 'error');
    }
  })
  .catch(error => {
    console.error('Change role error:', error);
    showNotification('Rol güncelleme hatası', 'error');
  });
}

function clearRoom() {
  if (!confirm('Tüm mesajları silmek istediğinize emin misiniz?')) {
    return;
  }

  state.messages[state.currentRoom] = [];
  saveToLocalStorage();
  renderMessages();
  showNotification('Tüm mesajlar silindi!', 'info');
}

// ============================================
// 5. PROFIL VE AYARLAR
// ============================================

function changeStatus(status) {
  state.currentUser.status = status;
  saveToLocalStorage();
  showNotification(`Durum "${status}" olarak ayarlandı!`, 'success');
}

function updateProfile() {
  const bio = document.getElementById('bioInput').value.trim();

  if (bio.length > 150) {
    showNotification('Biyografi 150 karakteri geçemez!', 'error');
    return;
  }

  state.currentUser.bio = bio;
  saveToLocalStorage();
  showNotification('Profil güncellendi! ✨', 'success');
}

function logout() {
  if (!confirm('Çıkış yapmak istediğinize emin misiniz?')) {
    return;
  }

  // Disconnect socket
  if (state.socket) {
    state.socket.disconnect();
    state.socket = null;
  }

  // Logout API call
  fetch('/api/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${state.token}`
    }
  })
  .then(() => {
    // Clear state
    state.currentUser = null;
    state.currentRoom = null;
    state.token = null;
    localStorage.removeItem('token');

    chatScreen.classList.add('hidden');
    roleSelectDiv.classList.add('hidden');
    loginDiv.classList.remove('hidden');

    document.getElementById('username').value = '';
    document.getElementById('age').value = '';
    document.getElementById('role').value = 'user';

    showNotification('Çıkış yaptınız. Hoşça kalın! 👋', 'info');
  })
  .catch(error => {
    console.error('Logout error:', error);
    showNotification('Çıkış yapılırken hata oluştu', 'error');
  });
}

// ============================================
// 6. TEMA VE AYARLAR
// ============================================

const themeToggle = document.getElementById('themeToggle');
const toggleUsers = document.getElementById('toggleUsers');
const usersPanel = document.getElementById('usersPanel');

themeToggle.addEventListener('click', () => {
  document.body.style.filter = document.body.style.filter === 'invert(1)' 
    ? '' 
    : 'invert(1)';
});

toggleUsers.addEventListener('click', () => {
  usersPanel.classList.toggle('hidden');
});

// ============================================
// 7. EMOJİ VE ÖZELLİKLER
// ============================================

const emojis = ['😀', '😂', '🤔', '❤️', '👍', '🎉', '🔥', '✨', '🎮', '🎵'];

function initializeEmojis() {
  emojiBar.innerHTML = '';
  emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji';
    btn.textContent = emoji;
    btn.onclick = () => {
      messageInput.value += emoji;
      messageInput.focus();
    };
    emojiBar.appendChild(btn);
  });
}

const stickers = ['👍', '👎', '❤️', '😂', '😢', '😮', '🎉', '🔥', '💯', '🤔', '😴', '🤗', '🤐', '🤯', '🥳', '😎'];

function initializeStickers() {
  const stickerBar = document.getElementById('stickerBar');
  stickerBar.innerHTML = '';
  stickers.forEach(sticker => {
    const btn = document.createElement('button');
    btn.className = 'emoji';
    btn.textContent = sticker;
    btn.onclick = () => {
      messageInput.value += sticker;
      messageInput.focus();
    };
    stickerBar.appendChild(btn);
  });
}

function searchGifs() {
  const query = document.getElementById('gifSearch').value.trim();
  const resultsDiv = document.getElementById('gifResults');
  
  if (!query) {
    resultsDiv.innerHTML = '';
    return;
  }

  // Simple GIF search using Giphy API (you'll need to add your API key)
  fetch(`https://api.giphy.com/v1/gifs/search?api_key=YOUR_GIPHY_API_KEY&q=${encodeURIComponent(query)}&limit=10`)
    .then(response => response.json())
    .then(data => {
      resultsDiv.innerHTML = '';
      data.data.forEach(gif => {
        const img = document.createElement('img');
        img.src = gif.images.fixed_height_small.url;
        img.style.width = '80px';
        img.style.margin = '4px';
        img.style.cursor = 'pointer';
        img.onclick = () => {
          messageInput.value += `[GIF:${gif.images.original.url}]`;
          messageInput.focus();
        };
        resultsDiv.appendChild(img);
      });
    })
    .catch(error => {
      console.error('GIF search error:', error);
      resultsDiv.innerHTML = '<p>GIF arama hatası</p>';
    });
}

function showLeaderboard() {
  const leaderboard = Object.entries(state.messages)
    .flatMap(([room, msgs]) => msgs)
    .reduce((acc, msg) => {
      if (!acc[msg.user]) acc[msg.user] = 0;
      acc[msg.user]++;
      return acc;
    }, {});

  const sorted = Object.entries(leaderboard)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  let html = '<div class="leaderboard-panel"><h2>🏆 Leaderboard</h2>';
  
  sorted.forEach(([user, count], idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
    html += `
      <div class="leaderboard-item">
        <span class="leaderboard-rank">${medal}</span>
        <span class="leaderboard-name">${user}</span>
        <span class="leaderboard-score">${count}</span>
      </div>
    `;
  });

  html += '<button class="btn btn-primary" onclick="this.parentElement.remove()">Kapat</button></div>';
  document.body.insertAdjacentHTML('beforeend', html);
}

// ============================================
// 8. UYARI VE YARDIMCI FONKSİYONLAR
// ============================================

function showNotification(message, type = 'info') {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 1000;
    animation: slideIn 0.3s;
  `;

  const colors = {
    success: '#10b981',
    error: '#ef4444',
    info: '#06b6d4'
  };

  notif.style.background = colors[type] || colors.info;
  notif.style.color = 'white';
  notif.textContent = message;

  document.body.appendChild(notif);

  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s forwards';
    setTimeout(() => notif.remove(), 300);
  }, 3000);
}

function getRoleColor(role) {
  const colors = {
    admin: '#ef4444',
    moderator: '#f59e0b',
    programci: '#3b82f6',
    sanatci: '#ec4899',
    yazar: '#8b5cf6',
    oyunsever: '#06b6d4',
    kahve: '#f97316',
    muzisyen: '#10b981',
    sporcu: '#06b6d4',
    gezgin: '#14b8a6',
    gurme: '#f59e0b',
    default: '#64748b'
  };
  return colors[role] || colors.default;
}

function getRoleName(role) {
  const names = {
    user: 'Kullanıcı',
    admin: 'Admin',
    moderator: 'Moderatör',
    kahve: 'Kahve Sever',
    oyun: 'Oyunsever',
    spor: 'Sporcu',
    muzik: 'Müzisyen',
    gezgin: 'Gezgin',
    yazar: 'Yazar',
    sanatci: 'Sanatçı',
    programci: 'Programcı',
    gurme: 'Gurme'
  };
  return names[role] || 'Üye';
}

function getAvatarEmoji(username) {
  const avatars = ['😀', '😎', '🤓', '😍', '🤩', '😜', '🥰', '😇'];
  return avatars[username.charCodeAt(0) % avatars.length];
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// ============================================
// 9. LOCALSTORAGE YÖNETİMİ
// ============================================

function saveToLocalStorage() {
  localStorage.setItem('chatAppState', JSON.stringify(state));
}

function loadFromLocalStorage() {
  // Check for token
  const token = localStorage.getItem('token');
  if (token) {
    state.token = token;

    // Verify token and get user data
    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.user) {
        state.currentUser = data.user;

        // Initialize socket and load data
        initializeSocket();
        loadRooms();

        // Default room
        if (!state.currentRoom) {
          state.currentRoom = 'genel';
          joinRoom('genel');
        }

        loginDiv.classList.add('hidden');
        roleSelectDiv.classList.add('hidden');
        chatScreen.classList.remove('hidden');

        updateUI();
        showNotification(`Tekrar hoşgeldiniz ${state.currentUser.username}!`, 'success');
      } else {
        // Token invalid, clear it
        localStorage.removeItem('token');
        state.token = null;
      }
    })
    .catch(error => {
      console.error('Token verification error:', error);
      localStorage.removeItem('token');
      state.token = null;
    });
  }

  // Load old localStorage data for compatibility
  const saved = localStorage.getItem('chatAppState');
  if (saved) {
    const data = JSON.parse(saved);
    state.messages = data.messages || {};
    state.rooms = data.rooms || {};
    state.currentUser = data.currentUser || null;
    state.currentRoom = data.currentRoom || null;
  }
}

// ============================================
// 10. İNİSİYALİZASYON
// ============================================

function initializeChat() {
  initializeEmojis();

  // Enter tuşu ile gönder
  messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Debounced search
  const debouncedRender = debounce(renderMessages, 200);
  document.getElementById('searchInput').addEventListener('input', debouncedRender);

  // If user is logged in, initialize socket
  if (state.token) {
    initializeSocket();
  }
}

// ============================================
// SOCKET.IO İŞLEVLERİ
// ============================================



function loadRoomMessages(roomId) {
  fetch(`/api/chat/messages/${roomId}`, {
    headers: {
      'Authorization': `Bearer ${state.token}`
    }
  })
  .then(response => response.json())
  .then(data => {
    if (data.messages) {
      state.messages[roomId] = data.messages;
      renderMessages();
    }
  })
}

// Sayfa yüklendiğinde çalıştır
window.addEventListener('load', () => {
  loadFromLocalStorage();
  
  // CSS animasyonları ekle
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Giriş formuna Enter tuşu desteği
  const usernameInput = document.getElementById('username');
  const ageInput = document.getElementById('age');
  const roleSelect = document.getElementById('role');
  
  if (usernameInput) {
    usernameInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        ageInput.focus();
      }
    });
  }

  if (ageInput) {
    ageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        enterChat();
      }
    });
  }

  if (roleSelect) {
    roleSelect.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmRole();
      }
    });
  }

  // Giriş öğesini geri yükle
  const saved = localStorage.getItem('chatAppState');
  if (saved) {
    const data = JSON.parse(saved);
    if (data.currentUser) {
      state.currentUser = data.currentUser;
      state.currentRoom = data.currentRoom || 'genel';
      loginDiv.classList.add('hidden');
      chatScreen.classList.remove('hidden');
      updateUI();
      initializeChat();
    }
  }
});



// Sayfa kapatılmadan önce kaydet
window.addEventListener('beforeunload', () => {
  if (state.currentUser) {
    saveToLocalStorage();
  }
  cleanupMemory();
});

// Uygulamayı başlat
initializeChat();
