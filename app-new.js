/**
 * Profesyonel Sohbet Platformu - Ana Uygulama
 * Discord benzeri, gerçekçi sohbet uygulaması
 * 
 * Özellikler:
 * - Gerçek zamanlı mesajlaşma (Socket.io)
 * - Mock authentication (demo için)
 * - Discord benzeri UI/UX
 * - Sesli ve görüntülü sohbet
 * - Emoji, sticker ve GIF desteği
 * - Dosya paylaşımı
 * - Liderlik tablosu
 * - Tema desteği (koyu/açık)
 * - Admin paneli
 */

// =====================================================
// GLOBAL STATE & CONFIGURATION
// =====================================================

const APP_CONFIG = {
  apiBase: '/api',
  socketUrl: window.location.origin,
  reconnectDelay: 3000,
  maxReconnectAttempts: 5,
  messagePageSize: 50,
  typingIndicatorTimeout: 3000,
  defaultRooms: [
    { id: 'genel', name: '💬 Genel Sohbet', icon: '💬', description: 'Herkes için genel sohbet odası' },
    { id: 'oyun', name: '🎮 Oyun Odası', icon: '🎮', description: 'Oyun severler için sohbet' },
    { id: 'muzik', name: '🎵 Müzik', icon: '🎵', description: 'Müzik tutkunları' },
    { id: 'spor', name: '⚽ Spor', icon: '⚽', description: 'Spor sohbetleri' },
    { id: 'teknoloji', name: '💻 Teknoloji', icon: '💻', description: 'Teknoloji ve yazılım' },
    { id: 'sanat', name: '🎨 Sanat & Tasarım', icon: '🎨', description: 'Sanat ve tasarım tartışmaları' }
  ]
};

const STATE = {
  user: null,
  currentRoom: null,
  rooms: new Map(),
  messages: new Map(),
  users: new Map(),
  isConnected: false,
  socket: null,
  typing: new Set(),
  theme: 'dark',
  isGuest: false,
  
  // Voice/Video
  voiceCall: null,
  videoCall: null,
  localStream: null,
  peerConnections: new Map(),
  
  // UI State
  sidebarOpen: true
};

// Mock users database for demo - Turkish names
// Initialize from localStorage or use defaults
function initializeMockUsers() {
  const stored = localStorage.getItem('mock_users');
  if (stored) {
    return JSON.parse(stored);
  }
  return [
    { id: '1', username: 'admin', email: 'admin@sohbet.com', password: '123456', role: 'admin', avatar: 'https://i.pravatar.cc/150?img=65', gender: 'male' },
    { id: '2', username: 'moderator', email: 'mod@sohbet.com', password: '123456', role: 'moderator', avatar: 'https://i.pravatar.cc/150?img=46', gender: 'female' },
    { id: '3', username: 'user1', email: 'user1@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=32', gender: 'male' },
    // Turkish users - Male
    { id: '4', username: 'ahmet_yilmaz', email: 'ahmet@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=14', gender: 'male', favorites: ['Valorant', 'CS:GO'] },
    { id: '5', username: 'mehmet_demir', email: 'mehmet@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=31', gender: 'male', favorites: ['FIFA', 'LoL'] },
    { id: '6', username: 'can_ozturk', email: 'can@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=26', gender: 'male', favorites: ['Dota 2', 'Apex'] },
    { id: '7', username: 'emre_kaya', email: 'emre@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=38', gender: 'male', favorites: ['Minecraft', 'Rust'] },
    { id: '8', username: 'burak_arslan', email: 'burak@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=49', gender: 'male', favorites: ['PUBG', 'Fortnite'] },
    // Turkish users - Female
    { id: '9', username: 'ayse_celik', email: 'ayse@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=20', gender: 'female', favorites: ['The Sims', 'Animal Crossing'] },
    { id: '10', username: 'fatma_ozdemir', email: 'fatma@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=17', gender: 'female', favorites: ['Stardew Valley', 'Genshin'] },
    { id: '11', username: 'zeynep_aydin', email: 'zeynep@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=44', gender: 'female', favorites: ['League of Legends', 'Valorant'] },
    { id: '12', username: 'elif_sahin', email: 'elif@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=22', gender: 'female', favorites: ['Minecraft', 'Roblox'] },
    { id: '13', username: 'meryem_koc', email: 'meryem@sohbet.com', password: '123456', role: 'user', avatar: 'https://i.pravatar.cc/150?img=55', gender: 'female', favorites: ['Genshin Impact', 'Honkai'] }
  ];
}

let MOCK_USERS = initializeMockUsers();

// Save users to localStorage
function saveMockUsers() {
  localStorage.setItem('mock_users', JSON.stringify(MOCK_USERS));
}

function isAvatarUrl(avatar) {
  return typeof avatar === 'string' && /^https?:\/\//.test(avatar);
}

function avatarElementHtml(avatar, label = '?') {
  if (isAvatarUrl(avatar)) {
    return `<img src="${StringUtils.escape(avatar)}" alt="${StringUtils.escape(label)}" class="avatar-img">`;
  }
  return `<span>${StringUtils.escape(String(avatar || label))}</span>`;
}

// Demo chat messages for each room
const DEMO_MESSAGES = {
  genel: [
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Herkese günaydın! ☀️', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Günaydın Ahmet abi, nasılsın?', timestamp: new Date(Date.now() - 3500000).toISOString() },
    { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'Bugün hava çok güzel, sohbet etmek için harika bir gün 😊', timestamp: new Date(Date.now() - 3400000).toISOString() },
    { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'Katılıyorum! Kahvemi aldım, hazırım 👋', timestamp: new Date(Date.now() - 3300000).toISOString() },
    { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'Arkadaşlar bugün ne konuşuyoruz? 😄', timestamp: new Date(Date.now() - 3200000).toISOString() },
    { userId: '11', username: 'zeynep_aydin', avatar: 'https://i.pravatar.cc/150?img=44', content: 'Ben yeni film önerileri arıyorum, izlediğiniz güzel filmler var mı?', timestamp: new Date(Date.now() - 3100000).toISOString() },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Dün gece çok güzel bir anime izledim, öneririm!', timestamp: new Date(Date.now() - 3000000).toISOString() },
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Hangi anime? Ben de izlemek istiyorum 🥺', timestamp: new Date(Date.now() - 2900000).toISOString() }
  ],
  oyun: [
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Bu akşam Valorant turnuvası var, katılacak var mı? 🎮', timestamp: new Date(Date.now() - 1800000).toISOString() },
    { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'Ben varım! Hangi saatte başlıyor?', timestamp: new Date(Date.now() - 1700000).toISOString() },
    { userId: '11', username: 'zeynep_aydin', avatar: 'https://i.pravatar.cc/150?img=44', content: 'Ben de katılabilir miyim? Radiant rütbesindeyim 💜', timestamp: new Date(Date.now() - 1600000).toISOString() },
    { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'Vay canına! Zeynep Radiant mı? Çok iyiymişsin! 🔥', timestamp: new Date(Date.now() - 1500000).toISOString() },
    { userId: '8', username: 'burak_arslan', avatar: 'https://i.pravatar.cc/150?img=49', content: 'Ben de CS:GO oynuyorum, turnuva sonrası maça varız 😎', timestamp: new Date(Date.now() - 1400000).toISOString() },
    { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'Ben Genshin Impact oynuyorum, bugün yeni karakter geldi! ✨', timestamp: new Date(Date.now() - 1300000).toISOString() }
  ],
  muzik: [
    { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Bugün Spotify\'da çok güzel bir çalma listesi keşfettim! 🎵', timestamp: new Date(Date.now() - 2400000).toISOString() },
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Hangi tür müzik dinliyorsun Ayşe?', timestamp: new Date(Date.now() - 2300000).toISOString() },
    { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Genelde pop ve indie müzik seviyorum. Siz ne dinliyorsunuz?', timestamp: new Date(Date.now() - 2200000).toISOString() },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Ben rock ve metal dinliyorum. Linkin Park favorim 🎸', timestamp: new Date(Date.now() - 2100000).toISOString() },
    { userId: '13', username: 'meryem_koc', avatar: 'https://i.pravatar.cc/150?img=55', content: 'K-pop seviyorum! BTS ve Blackpink en iyileri 💜', timestamp: new Date(Date.now() - 2000000).toISOString() },
    { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'Türk sanat müziği dinlemeyi çok seviyorum, huzur verici 🎶', timestamp: new Date(Date.now() - 1900000).toISOString() }
  ],
  spor: [
    { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'Dün akşamki maç çok heyecanlıydı! ⚽', timestamp: new Date(Date.now() - 3000000).toISOString() },
    { userId: '8', username: 'burak_arslan', avatar: 'https://i.pravatar.cc/150?img=49', content: 'Hangi maç? Ben izlemedim, skor ne oldu?', timestamp: new Date(Date.now() - 2900000).toISOString() },
    { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'Galatasaray 3-1 kazandı! Harika bir oyundu 🔴🟡', timestamp: new Date(Date.now() - 2800000).toISOString() },
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Fenerbahçe maçı ne zaman? Ben de izlemek istiyorum 💙', timestamp: new Date(Date.now() - 2700000).toISOString() },
    { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'Basketbol severler burada mı? NBA playoff\'ları başladı! 🏀', timestamp: new Date(Date.now() - 2600000).toISOString() },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Formula 1 bu hafta sonu, hangi takımı tutuyorsunuz? 🏎️', timestamp: new Date(Date.now() - 2500000).toISOString() }
  ],
  teknoloji: [
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Yeni çıkan yapay zeka araçlarını denediniz mi? Çok etkileyici! 🤖', timestamp: new Date(Date.now() - 4000000).toISOString() },
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Hangi araçları? Ben de merak ettim.', timestamp: new Date(Date.now() - 3900000).toISOString() },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'ChatGPT, Midjourney, Stable Diffusion... Liste uzun! Her biri harika işler yapıyor.', timestamp: new Date(Date.now() - 3800000).toISOString() },
    { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'Yazılım öğrenmek istiyorum, nereden başlamalıyım?', timestamp: new Date(Date.now() - 3700000).toISOString() },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Python ile başlamanı öneririm. Çok kolay ve güçlü bir dil! 🐍', timestamp: new Date(Date.now() - 3600000).toISOString() },
    { userId: '8', username: 'burak_arslan', avatar: 'https://i.pravatar.cc/150?img=49', content: 'Yeni telefon alacağım, iPhone mu Samsung mu? 📱', timestamp: new Date(Date.now() - 3500000).toISOString() }
  ],
  sanat: [
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Bugün yeni bir dijital çizim yaptım, çok heyecanlıyım! 🎨', timestamp: new Date(Date.now() - 5000000).toISOString() },
    { userId: '13', username: 'meryem_koc', avatar: 'https://i.pravatar.cc/150?img=55', content: 'Paylaşır mısın? Çok merak ettim! ✨', timestamp: new Date(Date.now() - 4900000).toISOString() },
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Tabii! Procreate ile çizdim, anime karakteri 🌸', timestamp: new Date(Date.now() - 4800000).toISOString() },
    { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Ben de fotoğraf çekmeyi seviyorum. Doğa fotoğrafları favorim 📸', timestamp: new Date(Date.now() - 4700000).toISOString() },
    { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'Müze gezmeyi çok seviyorum. İstanbul\'da en sevdiğiniz müze hangisi?', timestamp: new Date(Date.now() - 4600000).toISOString() },
    { userId: '11', username: 'zeynep_aydin', avatar: 'https://i.pravatar.cc/150?img=44', content: 'Modern sanat müzesi harika! Özellikle çağdaş Türk sanatçıları sergisi 🖼️', timestamp: new Date(Date.now() - 4500000).toISOString() }
  ]
};

// Bot responses for auto-reply
const BOT_RESPONSES = [
  'Çok ilginç! 😊',
  'Katılıyorum!',
  'Harika bir fikir! 👏',
  'Ben de öyle düşünüyorum',
  'Gerçekten mi? Detaylı anlatır mısın?',
  'Bu konuda daha fazla konuşalım!',
  'Çok güzel! 🎉',
  'Teşekkürler paylaşım için!',
  'Süper! 💯',
  'Kesinlikle haklısın!'
];

let audioRecorder = null;
let audioChunks = [];
let isRecordingAudio = false;

// Toxic message detection patterns (Turkish)
const TOXIC_PATTERNS = [
  /aptal/i, /salak/i, /gerizekalı/i, /mal/i, /ahmak/i,
  /öl/i, /öldür/i, /geber/i,
  /sik/i, /amk/i, /oç/i, /sg/i, /ygs/i,
  /kaltak/i, /orospu/i, /pezevenk/i,
  /lan/i, /defol/i, /git buradan/i,
  /seni/i, /siktir/i, /piç/i
];

// Translation dictionary (Turkish <-> English basic)
const TRANSLATION_DICT = {
  'merhaba': 'hello', 'selam': 'hi', 'nasılsın': 'how are you',
  'iyiyim': 'I am fine', 'teşekkürler': 'thanks', 'sağol': 'thanks',
  'görüşürüz': 'see you', 'bay': 'bye', 'evet': 'yes', 'hayır': 'no',
  'ne': 'what', 'nerede': 'where', 'nasıl': 'how', 'kim': 'who',
  'ne zaman': 'when', 'niçin': 'why', 'çünkü': 'because',
  'ben': 'I', 'sen': 'you', 'o': 'he/she', 'biz': 'we', 'siz': 'you',
  'onlar': 'they', 've': 'and', 'veya': 'or', 'ama': 'but',
  'çok': 'very', 'güzel': 'beautiful', 'kötü': 'bad', 'büyük': 'big',
  'küçük': 'small', 'yeni': 'new', 'eski': 'old', 'iyi': 'good',
  'seviyorum': 'I love', 'nefret ediyorum': 'I hate',
  'anlamadım': "I don't understand", 'anlıyorum': 'I understand',
  'biliyorum': 'I know', 'bilmiyorum': "I don't know",
  'lütfen': 'please', 'affedersiniz': 'excuse me',
  'yardım': 'help', 'acil': 'urgent', 'önemli': 'important',
  'oyun': 'game', 'müzik': 'music', 'film': 'movie',
  'arkadaş': 'friend', 'sevgili': 'lover/girlfriend/boyfriend',
  'aile': 'family', 'iş': 'work', 'okul': 'school',
  'günaydın': 'good morning', 'iyi akşamlar': 'good evening',
  'iyi geceler': 'good night', 'hoşgeldin': 'welcome'
};

// User trust scores
const TRUST_SCORES = new Map();

// Role-specific bot messages for realistic conversations
const ROLE_BOT_MESSAGES = {
  genel: [
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Herkese günaydın! Bugün hava çok güzel ☀️', delay: 5000 },
    { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Günaydın Ahmet! Evet gerçekten harika bir gün 😊', delay: 12000 },
    { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'Bugün ne planlarınız var?', delay: 18000 },
    { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'Ben kahvemi alıp biraz kitap okumayı düşünüyorum 📚', delay: 25000 },
    { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'Harika fikir! Ben de size katılabilir miyim?', delay: 32000 },
    { userId: '11', username: 'zeynep_aydin', avatar: 'https://i.pravatar.cc/150?img=44', content: 'Ne okuyorsunuz Fatma? Öneri alabilir miyim? 📖', delay: 40000 },
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Herkese merhaba! Yeni katıldım, neler oluyor? 👋', delay: 48000 },
    { userId: '13', username: 'meryem_koc', avatar: 'https://i.pravatar.cc/150?img=55', content: 'Hoşgeldin Elif! Biz günlük sohbet ediyoruz 💜', delay: 55000 },
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Bu sohbet uygulaması gerçekten çok güzel olmuş 👏', delay: 65000 },
    { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Katılıyorum! Tema sistemi de çok hoş 🌓', delay: 75000 },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Geliştiricilere teşekkürler! Çok kaliteli iş çıkarmışsınız 💯', delay: 85000 }
  ],
  oyun: [
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Bu akşam Valorant turnuvası var! Katılacak var mı? 🎮', delay: 5000 },
    { userId: '11', username: 'zeynep_aydin', avatar: 'https://i.pravatar.cc/150?img=44', content: 'Ben varım! Radiant rütbesindeyim, takım lazım mı? 💜', delay: 15000 },
    { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'Vay canına! Zeynep Radiant mı? Çok iyiymişsin! 🔥', delay: 22000 },
    { userId: '8', username: 'burak_arslan', avatar: 'https://i.pravatar.cc/150?img=49', content: 'Ben de CS:GO oynuyorum, turnuva sonrası maça varız 😎', delay: 30000 },
    { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'FIFA turnuvası da var bu hafta sonu! ⚽', delay: 38000 },
    { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'Ben Genshin Impact oynuyorum, yeni karakter geldi! ✨', delay: 45000 },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Minecraft survival sunucumuz var, isteyen katılabilir! 🏠', delay: 52000 },
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Ben Roblox\'ta oyun yapıyorum, isteyen yardım edebilirim 🎮', delay: 60000 },
    { userId: '13', username: 'meryem_koc', avatar: 'https://i.pravatar.cc/150?img=55', content: 'Honkai Star Rail yeni başladı, çok eğlenceli! 🚀', delay: 68000 },
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Bu oyun odası çok aktif olmuş, harika! 🎉', delay: 76000 }
  ],
  muzik: [
    { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Bugün Spotify\'da çok güzel bir çalma listesi keşfettim! 🎵', delay: 5000 },
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Hangi tür müzik dinliyorsun Ayşe? 🎶', delay: 15000 },
    { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Genelde pop ve indie müzik seviyorum. Siz ne dinliyorsunuz?', delay: 25000 },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Ben rock ve metal dinliyorum. Linkin Park favorim 🎸', delay: 35000 },
    { userId: '13', username: 'meryem_koc', avatar: 'https://i.pravatar.cc/150?img=55', content: 'K-pop seviyorum! BTS ve Blackpink en iyileri 💜🎤', delay: 45000 },
    { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'Türk sanat müziği dinlemeyi çok seviyorum 🎶', delay: 55000 },
    { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'Jazz severler burada mı? Miles Davis harika! 🎺', delay: 65000 },
    { userId: '11', username: 'zeynep_aydin', avatar: 'https://i.pravatar.cc/150?img=44', content: 'Rap müzik dinliyorum, Türkçe rap çok gelişmiş artık 🎤', delay: 75000 },
    { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'Arabesk müzik vazgeçilmezim, duygusal şarkılar 🥺', delay: 85000 },
    { userId: '8', username: 'burak_arslan', avatar: 'https://i.pravatar.cc/150?img=49', content: 'Elektronik müzik ve EDM sevenler nerede? 🎧', delay: 95000 }
  ],
  spor: [
    { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'Dün akşamki maç çok heyecanlıydı! ⚽', delay: 5000 },
    { userId: '8', username: 'burak_arslan', avatar: 'https://i.pravatar.cc/150?img=49', content: 'Hangi maç? Skor ne oldu?', delay: 12000 },
    { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'Galatasaray 3-1 kazandı! Harika oyundu 🔴🟡', delay: 20000 },
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Fenerbahçe maçı ne zaman? 💙', delay: 28000 },
    { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'NBA playoff\'ları başladı! 🏀 Hangi takımı tutuyorsunuz?', delay: 36000 },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Formula 1 bu hafta sonu! 🏎️ Max Verstappen yine favorim', delay: 44000 },
    { userId: '11', username: 'zeynep_aydin', avatar: 'https://i.pravatar.cc/150?img=44', content: 'Voleybol izliyorum, kadın voleybolu çok kaliteli 🏐', delay: 52000 },
    { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Tenis severim, Wimbledon heyecan verici 🎾', delay: 60000 },
    { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'Yüzme ve atletizm izliyorum, olimpiyatlar yaklaşıyor 🏊‍♀️', delay: 68000 },
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Buz pateni çok zarif, güzellikleri ayrı 🥌', delay: 76000 }
  ],
  teknoloji: [
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Yeni çıkan yapay zeka araçlarını denediniz mi? 🤖', delay: 5000 },
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Hangi araçları? Ben de merak ettim.', delay: 15000 },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'ChatGPT, Midjourney, Stable Diffusion... Her biri harika!', delay: 25000 },
    { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'Yazılım öğrenmek istiyorum, nereden başlamalıyım? 💻', delay: 35000 },
    { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Python ile başlamanı öneririm. Çok kolay ve güçlü! 🐍', delay: 45000 },
    { userId: '8', username: 'burak_arslan', avatar: 'https://i.pravatar.cc/150?img=49', content: 'Yeni telefon alacağım, iPhone mu Samsung mu? 📱', delay: 55000 },
    { userId: '11', username: 'zeynep_aydin', avatar: 'https://i.pravatar.cc/150?img=44', content: 'Web geliştirme öğreniyorum, React çok eğlenceli ⚛️', delay: 65000 },
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Mobil uygulama geliştirmek istiyorum, Flutter nasıl? 📱', delay: 75000 },
    { userId: '13', username: 'meryem_koc', avatar: 'https://i.pravatar.cc/150?img=55', content: 'Blockchain teknolojisi gelecekte çok önemli olacak 🔗', delay: 85000 },
    { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'VR ve AR teknolojileri çok heyecan verici! 🕶️', delay: 95000 }
  ],
  sanat: [
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Bugün yeni bir dijital çizim yaptım! 🎨', delay: 5000 },
    { userId: '13', username: 'meryem_koc', avatar: 'https://i.pravatar.cc/150?img=55', content: 'Paylaşır mısın? Çok merak ettim! ✨', delay: 15000 },
    { userId: '12', username: 'elif_sahin', avatar: 'https://i.pravatar.cc/150?img=22', content: 'Procreate ile çizdim, anime karakteri 🌸', delay: 25000 },
    { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Ben fotoğraf çekmeyi seviyorum. Doğa fotoğrafları favorim 📸', delay: 35000 },
    { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'Müze gezmeyi çok seviyorum 🏛️', delay: 45000 },
    { userId: '11', username: 'zeynep_aydin', avatar: 'https://i.pravatar.cc/150?img=44', content: 'Modern sanat müzesi harika! 🖼️', delay: 55000 },
    { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'Graffiti sanatı çok yaratıcı, şehir duvarları sanat eseri 🎨', delay: 65000 },
    { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'Heykeltraşlık yapmak istiyorum, zor mudur? 👨‍🎨', delay: 75000 },
    { userId: '8', username: 'burak_arslan', avatar: 'https://i.pravatar.cc/150?img=49', content: '3D modelleme öğreniyorum, Blender çok güçlü 🖥️', delay: 85000 },
    { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Bu sanat odası çok ilham verici! 🎭', delay: 95000 }
  ]
};

// Level/XP system configuration
const LEVEL_CONFIG = {
  baseXP: 100,
  multiplier: 1.5,
  messageXP: 10,
  dailyBonus: 50,
  levelRoles: {
    5: '🥉 Bronz Üye',
    10: '🥈 Gümüş Üye',
    20: '🥉 Altın Üye',
    30: '💎 Elmas Üye',
    50: '👑 Efsane Üye'
  }
};

// GIF library (predefined for demo)
const GIF_LIBRARY = [
  { url: 'https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif', tags: ['funny', 'cat'] },
  { url: 'https://media.giphy.com/media/o0vwzuFwCGAFO/giphy.gif', tags: ['hello', 'hi'] },
  { url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif', tags: ['happy', 'dance'] },
  { url: 'https://media.giphy.com/media/l0HlBO7eyXzSZkJri/giphy.gif', tags: ['love', 'heart'] },
  { url: 'https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif', tags: ['wow', 'amazed'] },
  { url: 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif', tags: ['cool', 'thumbsup'] },
  { url: 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif', tags: ['laugh', 'lol'] },
  { url: 'https://media.giphy.com/media/l41lFj8afNAt979yU/giphy.gif', tags: ['bye', 'wave'] },
  { url: 'https://media.giphy.com/media/3o7TKQ8kAP0f9X5PoY/giphy.gif', tags: ['yes', 'agree'] },
  { url: 'https://media.giphy.com/media/3o6ZtaO9BZHcOjmErm/giphy.gif', tags: ['no', 'disagree'] },
  { url: 'https://media.giphy.com/media/3oriNYQX2lC6dfW2Ji/giphy.gif', tags: ['clap', 'applause'] },
  { url: 'https://media.giphy.com/media/l0HlHFRbmaZtBRhXG/giphy.gif', tags: ['thinking', 'hmm'] },
  { url: 'https://media.giphy.com/media/3o7TKr3nzbh5WgCFxe/giphy.gif', tags: ['gaming', 'game'] },
  { url: 'https://media.giphy.com/media/3oriO5t2QB4IPKgxHi/giphy.gif', tags: ['music', 'dance'] },
  { url: 'https://media.giphy.com/media/l0HlvtIPzPdt2usKs/giphy.gif', tags: ['celebrate', 'party'] }
];

// =====================================================
// MOCK AUTHENTICATION (Demo için)
// =====================================================

const MockAuth = {
  // Kullanıcıları localStorage'dan yükle veya oluştur
  getUsers() {
    const stored = localStorage.getItem('mock_users');
    return stored ? JSON.parse(stored) : MOCK_USERS;
  },
  
  // Kullanıcı kaydet
  saveUsers(users) {
    localStorage.setItem('mock_users', JSON.stringify(users));
  },
  
  // Kayıt ol
  register(data) {
    const users = this.getUsers();
    
    // Email kontrolü
    if (users.find(u => u.email === data.email)) {
      return { error: 'Bu email zaten kullanılıyor' };
    }
    
    // Kullanıcı adı kontrolü
    if (users.find(u => u.username === data.username)) {
      return { error: 'Bu kullanıcı adı zaten alınmış' };
    }
    
    // Yeni kullanıcı oluştur
    const newUser = {
      id: Date.now().toString(),
      username: data.username,
      email: data.email,
      password: data.password,
      role: 'user',
      roles: data.roles || ['user'],
      avatar: ['😀', '😎', '🤓', '😍', '🤩', '😜', '🥰', '😇'][Math.floor(Math.random() * 8)],
      status: 'Online',
      bio: '',
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    this.saveUsers(users);
    
    return { 
      user: { ...newUser, password: undefined }, 
      token: 'mock_token_' + newUser.id 
    };
  },
  
  // Giriş yap
  login(data) {
    const users = this.getUsers();
    
    const user = users.find(u => 
      (u.email === data.identifier || u.username === data.identifier) && 
      u.password === data.password
    );
    
    if (!user) {
      return { error: 'Email/kullanıcı adı veya şifre hatalı' };
    }
    
    return { 
      user: { ...user, password: undefined }, 
      token: 'mock_token_' + user.id 
    };
  },
  
  // Misafir girişi
  guestLogin() {
    const guestId = 'guest_' + Date.now();
    const guestUser = {
      id: guestId,
      username: 'Misafir_' + Math.random().toString(36).substring(7).toUpperCase(),
      email: guestId + '@guest.com',
      role: 'user',
      roles: ['user'],
      avatar: '👤',
      status: 'Online',
      isGuest: true
    };
    
    return { 
      user: guestUser, 
      token: 'mock_token_' + guestId 
    };
  },
  
  // Token doğrula
  verifyToken(token) {
    if (!token || !token.startsWith('mock_token_')) {
      return { valid: false };
    }
    
    const userId = token.replace('mock_token_', '');
    const users = this.getUsers();
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      return { valid: false };
    }
    
    return { valid: true, user: { ...user, password: undefined } };
  }
};

// =====================================================
// INITIALIZATION
// =====================================================

document.addEventListener('DOMContentLoaded', async () => {
  Logger.log('🚀 Uygulama başlatılıyor...');
  
  try {
    // Utilities'i kontrol et
    if (typeof Validators === 'undefined') {
      throw new Error('Utilities dosyası yüklenmedi');
    }

    await initApp();
    Logger.success('✅ Uygulama başarıyla yüklendi');
  } catch (error) {
    Logger.error('❌ Başlatma hatası', error);
    showNotification('Uygulama başlatılamadı: ' + error.message, 'error');
  }
});

async function initApp() {
  // Tema yükle
  loadTheme();

  // Kaydedilmiş token kontrol et
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');

  if (token && user) {
    try {
      const userData = JSON.parse(user);
      // Token'ı doğrula
      const result = MockAuth.verifyToken(token);
      if (result.valid) {
        STATE.user = result.user;
        STATE.token = token;
        STATE.isGuest = userData.isGuest || false;
        showChatScreen();
        initSocket();
        return;
      }
    } catch (e) {
      console.error('Token verification failed:', e);
    }
  }

  // Login ekranını göster
  showLoginScreen();

  // Event listeners
  setupEventListeners();

  // Background animation
  setupBackgroundAnimation();

  // Online/Offline listening
  setupConnectionListeners();

  // Keyboard shortcuts
  setupKeyboardShortcuts();
}

function setupEventListeners() {
  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Message input typing indicator
  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    let typingTimeout;
    messageInput.addEventListener('input', () => {
      if (STATE.socket && STATE.currentRoom) {
        STATE.socket.emit('typing', {
          roomId: STATE.currentRoom.id,
          userId: STATE.user?.id,
          username: STATE.user?.username,
          typing: true
        });

        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => {
          STATE.socket.emit('typing', {
            roomId: STATE.currentRoom.id,
            userId: STATE.user?.id,
            username: STATE.user?.username,
            typing: false
          });
        }, APP_CONFIG.typingIndicatorTimeout);
      }
    });

    // Enter tuşu ile gönder (Shift+Enter yeni satır)
    messageInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', FunctionUtils.debounce(searchMessages, 300));
  }

  // User toggle button
  const toggleUsers = document.getElementById('toggleUsers');
  if (toggleUsers) {
    toggleUsers.addEventListener('click', () => {
      const usersPanel = document.getElementById('usersPanel');
      if (usersPanel) {
        usersPanel.classList.toggle('hidden');
      }
    });
  }

  // Admin panel button
  const adminPanelBtn = document.getElementById('adminPanelBtn');
  if (adminPanelBtn) {
    adminPanelBtn.addEventListener('click', () => {
      const adminPanel = document.getElementById('adminPanel');
      if (adminPanel) {
        adminPanel.classList.toggle('hidden');
        if (!adminPanel.classList.contains('hidden')) {
          loadAdminUsers();
          loadBannedUsers();
          updateAdminStats();
        }
      }
    });
  }

  // Tab visibility listener
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      Logger.log('📄 Sekme arka planda');
    } else {
      Logger.log('📄 Sekme aktif');
    }
  });
}

function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (event) => {
    // Ctrl/Cmd + K: Komut paleti
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault();
      showHelpModal();
    }

    // Ctrl/Cmd + /: Yardım
    if ((event.ctrlKey || event.metaKey) && event.key === '/') {
      event.preventDefault();
      showHelpModal();
    }

    // Esc: Panelleri kapat
    if (event.key === 'Escape') {
      closeAllPanels();
    }
  });
}

function closeAllPanels() {
  const panels = ['voicePanel', 'videoPanel', 'gifPanel', 'profilePanel', 'profileSettings', 'adminPanel'];
  panels.forEach(panelId => {
    const panel = document.getElementById(panelId);
    if (panel) {
      panel.classList.add('hidden');
    }
  });
}

// =====================================================
// ADMIN FUNCTIONS
// =====================================================

function loadAdminUsers() {
  if (!STATE.user || STATE.user.role !== 'admin') return;

  const adminUserList = document.getElementById('adminUserList');
  if (!adminUserList) return;

  const users = MockAuth.getUsers();
  adminUserList.innerHTML = '';

  users.forEach(user => {
    const userDiv = document.createElement('div');
    userDiv.className = 'admin-user-item';
    userDiv.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      margin: 4px 0;
      background: var(--bg-tertiary);
      border-radius: 6px;
      border: 1px solid var(--border-color);
    `;

    userDiv.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 16px;">${user.avatar}</span>
        <div>
          <div style="font-weight: 500; font-size: 13px;">${user.username}</div>
          <div style="font-size: 11px; color: var(--text-muted);">${user.email}</div>
        </div>
      </div>
      <div style="display: flex; gap: 4px;">
        <select onchange="changeUserRole('${user.id}', this.value)" style="font-size: 11px; padding: 2px 4px;">
          <option value="user" ${user.role === 'user' ? 'selected' : ''}>User</option>
          <option value="moderator" ${user.role === 'moderator' ? 'selected' : ''}>Mod</option>
          <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
        </select>
        <button onclick="banUser('${user.id}')" class="btn btn-danger btn-xs" style="padding: 2px 6px; font-size: 11px;">Ban</button>
      </div>
    `;

    adminUserList.appendChild(userDiv);
  });
}

function updateAdminStats() {
  if (!STATE.user || STATE.user.role !== 'admin') return;

  const totalUsersEl = document.getElementById('adminTotalUsers');
  const onlineUsersEl = document.getElementById('adminOnlineUsers');

  const users = MockAuth.getUsers();
  if (totalUsersEl) {
    totalUsersEl.textContent = users.length;
  }

  // Online users (simulated)
  if (onlineUsersEl) {
    const onlineCount = Math.floor(Math.random() * users.length) + 1;
    onlineUsersEl.textContent = onlineCount;
  }
}

function changeUserRole(userId, newRole) {
  if (!STATE.user || STATE.user.role !== 'admin') return;

  const users = MockAuth.getUsers();
  const user = users.find(u => u.id === userId);

  if (user) {
    user.role = newRole;
    MockAuth.saveUsers(users);
    showNotification(`Kullanıcı rolü güncellendi: ${user.username} → ${newRole}`, 'success');
    loadAdminUsers();
  }
}

function banUser(userId) {
  if (!STATE.user || STATE.user.role !== 'admin') return;

  const reason = prompt('Ban sebebi:');
  if (!reason) return;

  const users = MockAuth.getUsers();
  const userIndex = users.findIndex(u => u.id === userId);

  if (userIndex !== -1) {
    const bannedUser = users.splice(userIndex, 1)[0];
    MockAuth.saveUsers(users);

    // Yasaklı kullanıcıları kaydet
    const bannedUsers = JSON.parse(localStorage.getItem('banned_users') || '[]');
    bannedUsers.push({
      id: bannedUser.id,
      username: bannedUser.username,
      email: bannedUser.email,
      reason: reason,
      bannedAt: new Date().toISOString(),
      bannedBy: STATE.user.username
    });
    localStorage.setItem('banned_users', JSON.stringify(bannedUsers));

    showNotification(`Kullanıcı banlandı: ${bannedUser.username}`, 'warning');
    loadAdminUsers();
    loadBannedUsers();
    updateAdminStats();
  }
}

function broadcastMessage() {
  if (!STATE.user || STATE.user.role !== 'admin') return;

  const message = prompt('Tüm odalara gönderilecek mesaj:');
  if (!message || !message.trim()) return;

  // Tüm odalara mesaj gönder
  if (STATE.socket) {
    STATE.socket.emit('admin_broadcast', {
      message: message.trim(),
      adminUsername: STATE.user.username,
      timestamp: new Date().toISOString()
    });
  }

  showNotification('Mesaj tüm odalara gönderildi', 'success');
}

function toggleMaintenance() {
  if (!STATE.user || STATE.user.role !== 'admin') return;

  const btn = document.getElementById('maintenanceBtn');
  const isMaintenance = btn.textContent.includes('Kapat');

  if (isMaintenance) {
    // Bakım modunu kapat
    STATE.maintenance = false;
    btn.textContent = '🔧 Bakım Modu Aç';
    btn.className = 'btn btn-warning';
    showNotification('Bakım modu kapatıldı', 'success');
  } else {
    // Bakım modunu aç
    const reason = prompt('Bakım sebebi:');
    if (!reason) return;

    STATE.maintenance = true;
    STATE.maintenanceReason = reason;
    btn.textContent = '🔧 Bakım Modu Kapat';
    btn.className = 'btn btn-success';
    showNotification('Bakım modu açıldı', 'warning');

    // Tüm kullanıcılara bakım bildirimi gönder
    if (STATE.socket) {
      STATE.socket.emit('maintenance_mode', {
        enabled: true,
        reason: reason,
        adminUsername: STATE.user.username
      });
    }
  }
}

function exportUserData() {
  if (!STATE.user || STATE.user.role !== 'admin') return;

  const users = MockAuth.getUsers();
  const exportData = {
    exportDate: new Date().toISOString(),
    totalUsers: users.length,
    users: users.map(user => ({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      roles: user.roles,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin || 'Never'
    }))
  };

  // JSON olarak indir
  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `user-data-export-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  showNotification('Kullanıcı verileri dışa aktarıldı', 'success');
}

function loadBannedUsers() {
  if (!STATE.user || STATE.user.role !== 'admin') return;

  const bannedUsersList = document.getElementById('bannedUsersList');
  if (!bannedUsersList) return;

  // Yasaklı kullanıcıları localStorage'dan al (şimdilik boş)
  const bannedUsers = JSON.parse(localStorage.getItem('banned_users') || '[]');

  if (bannedUsers.length === 0) {
    bannedUsersList.innerHTML = '<div style="color:var(--text-muted);font-style:italic;">Yasaklı kullanıcı yok</div>';
    return;
  }

  bannedUsersList.innerHTML = bannedUsers.map(user =>
    `<div style="padding:4px 0;border-bottom:1px solid var(--border-color);">
      ${user.username} (${user.reason || 'Belirtilmemiş'})
      <button onclick="unbanUser('${user.id}')" style="float:right;font-size:10px;">Kaldır</button>
    </div>`
  ).join('');
}

function unbanUser(userId) {
  if (!STATE.user || STATE.user.role !== 'admin') return;

  const bannedUsers = JSON.parse(localStorage.getItem('banned_users') || '[]');
  const updatedBanned = bannedUsers.filter(u => u.id !== userId);
  localStorage.setItem('banned_users', JSON.stringify(updatedBanned));

  loadBannedUsers();
  showNotification('Kullanıcı yasağı kaldırıldı', 'success');
}

// =====================================================
// SOCKET.IO INITIALIZATION
// =====================================================

function initSocket() {
  if (STATE.socket && STATE.socket.connected) {
    Logger.warning('⚠️ Socket zaten bağlı');
    return;
  }

  try {
    STATE.socket = io(APP_CONFIG.socketUrl, {
      reconnection: true,
      reconnectionDelay: APP_CONFIG.reconnectDelay,
      reconnectionDelayMax: APP_CONFIG.reconnectDelay * 5,
      reconnectionAttempts: APP_CONFIG.maxReconnectAttempts,
      transports: ['websocket', 'polling']
    });

    // Connection events
    STATE.socket.on('connect', handleSocketConnect);
    STATE.socket.on('disconnect', handleSocketDisconnect);
    STATE.socket.on('error', handleSocketError);
    STATE.socket.on('reconnect', handleSocketReconnect);

    // Message events
    STATE.socket.on('new-message', handleNewMessage);
    STATE.socket.on('message-updated', handleMessageUpdated);
    STATE.socket.on('message-deleted', handleMessageDeleted);

    // User events
    STATE.socket.on('user-joined', handleUserJoined);
    STATE.socket.on('user-left', handleUserLeft);
    STATE.socket.on('typing', handleTypingIndicator);
    STATE.socket.on('room-users-update', handleRoomUsersUpdate);

    // Room events
    STATE.socket.on('room-updated', handleRoomUpdated);
    STATE.socket.on('rooms-list', handleRoomsList);

    Logger.success('✅ Socket bağlantısı kuruldu');
  } catch (error) {
    Logger.error('❌ Socket bağlantı hatası', error);
    showNotification('Gerçek zamanlı bağlantı kurulamadı', 'warning');
  }
}

function handleSocketConnect() {
  Logger.success('🔌 Socket bağlandı');
  STATE.isConnected = true;
  updateConnectionStatus(true);

  // Odaya katıl
  if (STATE.currentRoom) {
    STATE.socket.emit('join-room', {
      roomId: STATE.currentRoom.id,
      userId: STATE.user.id,
      username: STATE.user.username
    });
  }
}

function handleSocketDisconnect(reason) {
  Logger.warning('🔌 Socket bağlantısı kesildi: ' + reason);
  STATE.isConnected = false;
  updateConnectionStatus(false);

  if (reason === 'io server disconnect') {
    STATE.socket.connect();
  }
}

function handleSocketError(error) {
  Logger.error('❌ Socket hatası', error);
  showNotification('Bağlantı hatası oluştu', 'error');
}

function handleSocketReconnect(attemptNumber) {
  Logger.success(`🔄 Socket yeniden bağlandı (Deneme: ${attemptNumber})`);
}

function updateConnectionStatus(connected) {
  const indicator = document.getElementById('connectionIndicator');
  if (indicator) {
    indicator.style.background = connected ? '#10b981' : '#ef4444';
    indicator.style.boxShadow = connected ? '0 0 10px #10b981' : '0 0 10px #ef4444';
    indicator.title = connected ? 'Bağlı' : 'Bağlantı kesildi';
  }
}

// =====================================================
// MESSAGE HANDLING
// =====================================================

function handleNewMessage(data) {
  Logger.log('📨 Yeni mesaj alındı', data);

  if (!STATE.messages.has(data.roomId)) {
    STATE.messages.set(data.roomId, []);
  }

  const message = {
    id: data.id || 'msg_' + Date.now() + Math.random().toString(36).substr(2, 5),
    userId: data.userId,
    username: data.username,
    avatar: data.avatar || '👤',
    content: StringUtils.escape(data.content),
    timestamp: new Date(data.timestamp || Date.now()),
    edited: data.edited || false,
    reactions: data.reactions || [],
    type: data.type || 'text'
  };

  STATE.messages.get(data.roomId).push(message);

  // Mesaj sayısını sınırla
  if (STATE.messages.get(data.roomId).length > 1000) {
    STATE.messages.set(data.roomId, STATE.messages.get(data.roomId).slice(-500));
  }

  // UI güncelle
  if (STATE.currentRoom && STATE.currentRoom.id === data.roomId) {
    displayMessage(message);
    
    // Mesaj arama filtresini uygula
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
      searchMessages();
    }
  } else {
    // Bildirim göster (sekme arka plandaysa)
    if (document.hidden) {
      showNotification(`${data.username}: ${StringUtils.truncate(data.content, 50)}`, 'info', 5000);
    }
  }
}

function handleMessageUpdated(data) {
  const messages = STATE.messages.get(data.roomId);
  if (messages) {
    const index = messages.findIndex(m => m.id === data.id);
    if (index > -1) {
      messages[index] = { ...messages[index], content: StringUtils.escape(data.content), edited: true };
      if (STATE.currentRoom && STATE.currentRoom.id === data.roomId) {
        renderAllMessages();
      }
    }
  }
}

function handleMessageDeleted(data) {
  const messages = STATE.messages.get(data.roomId);
  if (messages) {
    const index = messages.findIndex(m => m.id === data.messageId);
    if (index > -1) {
      messages.splice(index, 1);
      if (STATE.currentRoom && STATE.currentRoom.id === data.roomId) {
        renderAllMessages();
      }
    }
  }
}

function handleUserJoined(data) {
  Logger.log('👤 Kullanıcı katıldı:', data.username);
  showNotification(`${data.username} odaya katıldı`, 'info', 3000);

  if (!STATE.users.has(data.userId)) {
    STATE.users.set(data.userId, {
      id: data.userId,
      username: data.username,
      avatar: data.avatar,
      role: data.role,
      status: 'Online',
      joinedAt: new Date()
    });
  }

  updateUserList();
}

function handleUserLeft(data) {
  Logger.log('👋 Kullanıcı ayrıldı:', data.username);
  showNotification(`${data.username} odadan ayrıldı`, 'info', 3000);

  STATE.users.delete(data.userId);
  updateUserList();
}

function handleTypingIndicator(data) {
  if (data.typing) {
    STATE.typing.add(data.userId);
  } else {
    STATE.typing.delete(data.userId);
  }

  updateTypingIndicator();
}

function handleRoomUsersUpdate(data) {
  if (STATE.currentRoom && data.roomId === STATE.currentRoom.id) {
    STATE.users = new Map(data.users.map(u => [u.id, u]));
    updateUserList();
  }
}

function handleRoomUpdated(data) {
  Logger.log('🏠 Oda güncellendi', data);
  STATE.currentRoom = data;
  updateRoomUI();
}

function handleRoomsList(data) {
  Logger.log('📋 Odalar listesi alındı', data);
  STATE.rooms = new Map(data.rooms.map(r => [r.id, r]));
  updateRoomsList();
}

function updateTypingIndicator() {
  const typingIndicator = document.getElementById('typingIndicator');
  if (!typingIndicator) return;

  const typingUsers = Array.from(STATE.typing).map(userId => {
    const user = STATE.users.get(userId);
    return user ? user.username : 'Bilinmeyen';
  });

  if (typingUsers.length > 0) {
    typingIndicator.textContent = `${typingUsers.join(', ')} yazıyor...`;
    typingIndicator.style.display = 'block';
  } else {
    typingIndicator.style.display = 'none';
  }
}

// =====================================================
// SEND MESSAGE
// =====================================================

async function sendMessage() {
  try {
    const messageInput = document.getElementById('messageInput');
    if (!messageInput) {
      console.error('Message input element not found');
      return;
    }

    let content = messageInput.textContent || messageInput.innerText || '';
    content = content.trim();

    if (!content) {
      showNotification('Boş mesaj gönderilemez', 'warning');
      return;
    }

    if (!STATE.user) {
      showNotification('Mesaj göndermek için giriş yapmalısınız', 'warning');
      return;
    }

    if (content.length > 2000) {
      showNotification('Mesaj çok uzun (Max 2000 karakter)', 'error');
      return;
    }

    if (!STATE.currentRoom) {
      showNotification('Lütfen bir kanal seçin', 'warning');
      return;
    }

    const currentRoomId = typeof STATE.currentRoom === 'string' ? STATE.currentRoom : STATE.currentRoom.id;
    if (!currentRoomId) {
      showNotification('Lütfen bir kanal seçin', 'warning');
      return;
    }

    // Rate limiting
    if (!rateLimiter.check(`message_${STATE.user.id}`, 5, 5000)) {
      showNotification('Çok hızlı mesaj gönderiyorsunuz. Lütfen bekleyin.', 'warning');
      return;
    }

    const message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      roomId: currentRoomId,
      userId: STATE.user.id,
      username: STATE.user.username,
      avatar: STATE.user.avatar || '😀',
      content: content,
      timestamp: new Date().toISOString(),
      type: 'text',
      edited: false,
      reactions: []
    };

    // Mesajı hemen ekrana ekle (optimistic update)
    addMessageToUI(message);

    // Input'u temizle
    messageInput.textContent = '';
    messageInput.innerText = '';
    messageInput.focus();

    // Socket'ten gönder (eğer bağlıysa)
    if (STATE.socket && STATE.isConnected) {
      STATE.socket.emit('send-message', message);
    }

    // Mesaj geçmişine ekle
    if (!STATE.messages.has(currentRoomId)) {
      STATE.messages.set(currentRoomId, []);
    }
    STATE.messages.get(currentRoomId).push(message);

    // Otomatik kaydırma
    scrollToBottom();

    // Typing indicator'ı sıfırla
    STATE.typing.clear();
    updateTypingIndicator();

    // Otomatik bot yanıtı (demo modu için)
    if (!STATE.isConnected) {
      triggerBotResponse(content);
    }

  } catch (error) {
    console.error('Mesaj gönderme hatası:', error);
    showNotification('Mesaj gönderilemedi: ' + error.message, 'error');
  }
}

// =====================================================
// DISCORD-STYLE MESSAGE DISPLAY
// =====================================================

function addMessageToUI(message) {
  const messagesContainer = document.getElementById('messages');
  if (!messagesContainer) return;

  // Welcome message'i gizle
  const welcomeMessage = messagesContainer.querySelector('.welcome-message');
  if (welcomeMessage) {
    welcomeMessage.style.display = 'none';
  }

  const messageElement = createMessageElement(message);
  messagesContainer.appendChild(messageElement);

  // Otomatik kaydırma
  scrollToBottom();
}

function createMessageElement(message) {
  const messageGroup = document.createElement('div');
  messageGroup.className = 'message-group';

  let contentHTML = '';
  if (message.type === 'image') {
    contentHTML = `<img src="${message.content}" class="chat-media chat-image" alt="Fotoğraf">`;
  } else if (message.type === 'video') {
    contentHTML = `<video controls class="chat-media chat-video"><source src="${message.content}" type="video/mp4">Tarayıcınız video oynatmayı desteklemiyor.</video>`;
  } else if (message.type === 'audio') {
    contentHTML = `<audio controls class="chat-audio"><source src="${message.content}" type="audio/webm">Tarayıcınız ses oynatmayı desteklemiyor.</audio>`;
  } else if (message.type === 'gif') {
    contentHTML = `<img src="${message.content}" class="chat-media chat-gif" alt="GIF">`;
  } else {
    contentHTML = `<p>${formatMessageContent(message.content)}</p>`;
  }

  messageGroup.innerHTML = `
    <div class="message-avatar">${avatarElementHtml(message.avatar, message.username)}</div>
    <div class="message-content">
      <div class="message-header">
        <span class="message-author">${StringUtils.escape(message.username)}</span>
        <span class="message-timestamp">${formatMessageTime(message.timestamp)}</span>
      </div>
      <div class="message-text">
        ${contentHTML}
      </div>
    </div>
  `;

  return messageGroup;
}

function formatMessageTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) { // 1 dakika
    return 'Şimdi';
  } else if (diff < 3600000) { // 1 saat
    const minutes = Math.floor(diff / 60000);
    return `${minutes} dakika önce`;
  } else if (diff < 86400000) { // 1 gün
    const hours = Math.floor(diff / 3600000);
    return `${hours} saat önce`;
  } else {
    return date.toLocaleDateString('tr-TR');
  }
}

function formatMessageContent(content) {
  const safeContent = StringUtils.escape(content);
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return safeContent.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');
}

function scrollToBottom() {
  const messagesContainer = document.getElementById('messages');
  if (messagesContainer) {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }
}

// =====================================================
// CHANNEL MANAGEMENT
// =====================================================

function switchChannel(channelName) {
  // Aktif kanalı güncelle
  document.querySelectorAll('.channel-item').forEach(item => {
    item.classList.remove('active');
  });

  const channelElement = document.querySelector(`[data-channel="${channelName}"]`);
  if (channelElement) {
    channelElement.classList.add('active');
  }

  // Oda bilgilerini güncelle
  STATE.currentRoom = {
    id: channelName,
    name: channelName,
    type: 'text'
  };

  // Kanal başlığını güncelle
  const currentChannel = document.getElementById('currentChannel');
  if (currentChannel) {
    currentChannel.textContent = channelName;
  }

  // Mesajları yükle
  loadChannelMessages(channelName);

  // Bildirimleri temizle
  clearChannelNotification(channelName);

  // Socket'e kanal değişikliği bildir
  if (STATE.socket && STATE.isConnected) {
    STATE.socket.emit('join-room', channelName);
  }
}

function loadChannelMessages(channelName) {
  const messagesContainer = document.getElementById('messages');
  if (!messagesContainer) return;

  // Önceki mesajları temizle
  messagesContainer.innerHTML = '';

  // Welcome message ekle
  const welcomeMessage = document.createElement('div');
  welcomeMessage.className = 'welcome-message';
  welcomeMessage.innerHTML = `
    <div class="welcome-content">
      <h2>💬 #${channelName} kanalına hoşgeldiniz!</h2>
      <p>Bu kanal ${getChannelDescription(channelName)} için kullanılır.</p>
      <div class="welcome-tips">
        <div class="tip">
          <span class="tip-icon">💬</span>
          <span>İlk mesajı siz gönderin!</span>
        </div>
      </div>
    </div>
  `;
  messagesContainer.appendChild(welcomeMessage);

  // Kanal mesajlarını yükle
  const channelMessages = STATE.messages.get(channelName) || [];

  // Demo mesajları ekle
  if (channelMessages.length === 0) {
    const demoMessages = getDemoMessages(channelName);
    demoMessages.forEach(message => {
      addMessageToUI(message);
    });
  } else {
    channelMessages.forEach(message => {
      addMessageToUI(message);
    });
  }

  // Otomatik bot sohbeti başlat
  if (channelName === 'genel') {
    setTimeout(() => startChannelBotConversation(channelName), 2000);
  }
}

function getChannelDescription(channelName) {
  const descriptions = {
    'genel': 'genel sohbetler',
    'oyun': 'oyun tartışmaları',
    'muzik': 'müzik paylaşımları',
    'spor': 'spor konuşmaları',
    'teknoloji': 'teknoloji tartışmaları',
    'sanat': 'sanat ve yaratıcılık'
  };
  return descriptions[channelName] || 'sohbet';
}

function getDemoMessages(channelName) {
  const demoMessages = DEMO_MESSAGES[channelName] || [];
  return demoMessages.slice(0, 5); // İlk 5 mesajı göster
}

function clearChannelNotification(channelName) {
  const notifyElement = document.getElementById(`${channelName}Notify`);
  if (notifyElement) {
    notifyElement.style.display = 'none';
    notifyElement.textContent = '';
  }
}

function toggleCategory(categoryName) {
  const category = document.getElementById(`${categoryName}Channels`);
  if (category) {
    category.classList.toggle('hidden');
  }
}

// =====================================================

function showLoginScreen() {
  const homePage = document.getElementById('homePage');
  const login = document.getElementById('login');
  const chatScreen = document.getElementById('chatScreen');
  const mainHeader = document.getElementById('mainHeader');

  if (homePage) homePage.classList.remove('hidden');
  if (login) login.style.display = 'flex';
  if (chatScreen) chatScreen.classList.add('hidden');
  if (mainHeader) mainHeader.classList.add('hidden');
}

function showChatScreen() {
  const homePage = document.getElementById('homePage');
  const login = document.getElementById('login');
  const chatScreen = document.getElementById('chatScreen');
  const mainHeader = document.getElementById('mainHeader');

  if (homePage) homePage.classList.add('hidden');
  if (login) login.style.display = 'none';
  if (chatScreen) chatScreen.classList.remove('hidden');
  if (mainHeader) mainHeader.classList.remove('hidden');

  // UI güncelle
  updateUserInfo();
  loadRooms();

  // Her zaman varsayılan kanalı aç
  if (!STATE.currentRoom) {
    switchChannel('genel');
  }

  const messageInput = document.getElementById('messageInput');
  if (messageInput) {
    messageInput.focus();
  }
  
  // Start live bot conversations for realistic chat experience
  startBotConversations();
  startUserActivitySimulation();
  
  // Show user level
  setTimeout(() => {
    showUserLevel();
  }, 2000);
}

function navigateTo(page) {
  const homePage = document.getElementById('homePage');
  const login = document.getElementById('login');
  const chatScreen = document.getElementById('chatScreen');
  const mainHeader = document.getElementById('mainHeader');

  switch (page) {
    case 'home':
      if (STATE.user) {
        showChatScreen();
      } else {
        if (homePage) homePage.classList.remove('hidden');
        if (login) login.style.display = 'none';
        if (chatScreen) chatScreen.classList.add('hidden');
        if (mainHeader) mainHeader.classList.add('hidden');
      }
      break;
    case 'login':
      if (login) {
        login.style.display = 'flex';
        switchTab('login');
      }
      if (homePage) homePage.classList.add('hidden');
      if (chatScreen) chatScreen.classList.add('hidden');
      if (mainHeader) mainHeader.classList.add('hidden');
      break;
    case 'register':
      if (login) {
        login.style.display = 'flex';
        switchTab('register');
      }
      if (homePage) homePage.classList.add('hidden');
      if (chatScreen) chatScreen.classList.add('hidden');
      if (mainHeader) mainHeader.classList.add('hidden');
      break;
  }
}

// =====================================================
// AUTHENTICATION (MOCK - Demo için)
// =====================================================

async function login() {
  const identifier = document.getElementById('loginIdentifier');
  const password = document.getElementById('loginPassword');
  const loadingDiv = document.getElementById('loginLoading');
  const errorDiv = document.getElementById('loginError');
  const loginBtn = document.getElementById('loginBtn');

  // Clear previous errors
  if (errorDiv) errorDiv.style.display = 'none';

  if (!identifier || !password) {
    showErrorMessage('Form alanları bulunamadı', errorDiv);
    return;
  }

  const identifierValue = identifier.value.trim();
  const passwordValue = password.value;

  // Validasyon
  if (!identifierValue) {
    showErrorMessage('Email veya kullanıcı adı gerekli', errorDiv);
    identifier.focus();
    return;
  }

  if (!passwordValue) {
    showErrorMessage('Şifre gerekli', errorDiv);
    password.focus();
    return;
  }

  try {
    if (loadingDiv) loadingDiv.style.display = 'block';
    if (loginBtn) loginBtn.disabled = true;

    // Mock login - gerçek uygulamada API'ye istek atılacak
    const response = MockAuth.login({
      identifier: identifierValue,
      password: passwordValue
    });

    if (loadingDiv) loadingDiv.style.display = 'none';
    if (loginBtn) loginBtn.disabled = false;

    if (response.error) {
      showErrorMessage(response.error, errorDiv);
      return;
    }

    // Başarılı giriş
    STATE.user = response.user;
    STATE.token = response.token;
    STATE.isGuest = false;

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));

    showNotification(`Hoşgeldiniz ${response.user.username}! 🎉`, 'success');
    showChatScreen();
    initSocket();

    // Formu temizle
    identifier.value = '';
    password.value = '';

  } catch (error) {
    Logger.error('❌ Giriş hatası', error);
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (loginBtn) loginBtn.disabled = false;
    showErrorMessage('Giriş başarısız: ' + (error.message || 'Bilinmeyen hata'), errorDiv);
  }
}

function showErrorMessage(message, errorDiv) {
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
  }
  showNotification(message, 'error');
}

async function register() {
  const username = document.getElementById('regUsername');
  const email = document.getElementById('regEmail');
  const password = document.getElementById('regPassword');
  const passwordConfirm = document.getElementById('regPasswordConfirm');
  const age = document.getElementById('regAge');
  const registerBtn = document.getElementById('registerButton');
  const loadingDiv = document.getElementById('registerLoading');
  const errorDiv = document.getElementById('registerError');

  // Clear previous errors
  if (errorDiv) errorDiv.style.display = 'none';

  if (!username || !email || !password || !passwordConfirm || !age) {
    showErrorMessage('Form alanları bulunamadı', errorDiv);
    return;
  }

  const data = {
    username: username.value.trim(),
    email: email.value.trim(),
    password: password.value,
    passwordConfirm: passwordConfirm.value,
    age: parseInt(age.value)
  };

  // Rolleri topla
  const roleCheckboxes = document.querySelectorAll('.roles-container input[type="checkbox"]:checked');
  data.roles = Array.from(roleCheckboxes).map(cb => cb.value);

  // Validasyonlar
  if (!Validators.username(data.username)) {
    showErrorMessage('Kullanıcı adı 2-20 karakter, sadece harf/rakam/underscore', errorDiv);
    return;
  }

  if (!Validators.email(data.email)) {
    showErrorMessage('Geçerli bir email girin', errorDiv);
    return;
  }

  if (data.password.length < 6) {
    showErrorMessage('Şifre en az 6 karakter olmalı', errorDiv);
    return;
  }

  if (data.password !== data.passwordConfirm) {
    showErrorMessage('Şifreler eşleşmiyor', errorDiv);
    return;
  }

  // Şifre gücü kontrolünü daha toleranslı hale getir (demo kullanım kolaylığı)
  const strength = Validators.passwordStrength(data.password);
  if (strength < 1) {
    showErrorMessage('Şifre çok zayıf görünüyor. En az bir büyük harf/küçük harf/rakam kombinasyonu deneyin.', errorDiv);
    return;
  }

  if (data.age < 13 || data.age > 120) {
    showErrorMessage('Yaş 13-120 arasında olmalı', errorDiv);
    return;
  }

  if (data.roles.length === 0) {
    showErrorMessage('En az bir rol seçin', errorDiv);
    return;
  }

  if (data.roles.length > 5) {
    showErrorMessage('En fazla 5 rol seçebilirsiniz', errorDiv);
    return;
  }

  try {
    if (registerBtn) registerBtn.disabled = true;
    if (loadingDiv) loadingDiv.style.display = 'block';

    // Mock register - gerçek uygulamada API'ye istek atılacak
    const response = MockAuth.register(data);

    if (loadingDiv) loadingDiv.style.display = 'none';
    if (registerBtn) registerBtn.disabled = false;

    if (response.error) {
      showErrorMessage(response.error, errorDiv);
      return;
    }

    showNotification('Kayıt başarılı! Giriş yapabilirsiniz. 🎉', 'success');

    // Login tabına geç
    switchTab('login');

    // Formu temizle
    username.value = '';
    email.value = '';
    password.value = '';
    passwordConfirm.value = '';
    age.value = '';
    document.querySelectorAll('.roles-container input[type="checkbox"]').forEach(cb => {
      cb.checked = cb.value === 'user';
    });

  } catch (error) {
    Logger.error('❌ Kayıt hatası', error);
    if (loadingDiv) loadingDiv.style.display = 'none';
    if (registerBtn) registerBtn.disabled = false;
    showNotification('Kayıt başarısız: ' + (error.message || 'Bilinmeyen hata'), 'error');
  }
}

async function guestLogin() {
  try {
    // Mock guest login
    const response = MockAuth.guestLogin();

    STATE.user = response.user;
    STATE.token = response.token;
    STATE.isGuest = true;

    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    localStorage.setItem('isGuest', 'true');

    showNotification('Misafir olarak giriş yaptınız', 'success');
    showChatScreen();
    initSocket();
  } catch (error) {
    Logger.error('❌ Misafir giriş hatası', error);
    showNotification('Misafir girişi başarısız', 'error');
  }
}

function googleSignIn() {
  // Google Sign-In placeholder - gerçek implementasyon için Google OAuth kullanılmalı
  showNotification('Google Sign-In özelliği yakında aktif olacak', 'info');
}

function logout() {
  if (!confirm('Çıkış yapmak istediğinize emin misiniz?')) return;

  STATE.user = null;
  STATE.token = null;
  STATE.isGuest = false;
  STATE.messages.clear();
  STATE.rooms.clear();
  STATE.users.clear();
  STATE.currentRoom = null;

  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('isGuest');

  if (STATE.socket) {
    STATE.socket.disconnect();
    STATE.socket = null;
  }

  showLoginScreen();
  showNotification('Çıkış yaptınız. Hoşça kalın! 👋', 'success');
}

// =====================================================
// ROOM MANAGEMENT
// =====================================================

async function loadRooms() {
  // Varsayılan odaları ekle
  APP_CONFIG.defaultRooms.forEach(room => {
    if (!STATE.rooms.has(room.id)) {
      STATE.rooms.set(room.id, {
        id: room.id,
        name: room.name,
        icon: room.icon,
        description: room.description,
        usersCount: Math.floor(Math.random() * 50),
        type: 'public'
      });
    }
  });

  updateRoomsList();
}

function updateRoomsList() {
  const roomList = document.getElementById('categoryList');
  if (!roomList) return;

  roomList.innerHTML = '';

  STATE.rooms.forEach(room => {
    const roomBtn = document.createElement('button');
    roomBtn.className = `room-btn ${STATE.currentRoom && STATE.currentRoom.id === room.id ? 'active' : ''}`;
    roomBtn.innerHTML = `<span class="room-icon">${room.icon || '💬'}</span> ${room.name} <span class="room-count">(${room.usersCount || 0})</span>`;
    roomBtn.onclick = () => joinRoom(room.id);
    roomBtn.title = room.description || room.name;

    roomList.appendChild(roomBtn);
  });

  // Varsayılan odaya katıl
  if (!STATE.currentRoom && STATE.rooms.size > 0) {
    const firstRoom = STATE.rooms.get('genel') || STATE.rooms.values().next().value;
    joinRoom(firstRoom.id);
  }
}

async function joinRoom(roomId) {
  try {
    const room = STATE.rooms.get(roomId);
    if (!room) {
      showNotification('Oda bulunamadı', 'error');
      return;
    }

    STATE.currentRoom = room;
    
    if (!STATE.messages.has(roomId)) {
      STATE.messages.set(roomId, []);
    }

    // Socket'ten odaya katıl
    if (STATE.socket && STATE.isConnected) {
      STATE.socket.emit('join-room', {
        roomId: roomId,
        userId: STATE.user?.id,
        username: STATE.user?.username
      });
    }

    // UI güncelle
    updateRoomsList();
    updateRoomUI();

    Logger.success(`✅ ${room.name} odasına katıldınız`);
    showNotification(`${room.icon || '💬'} ${room.name} odasına katıldınız`, 'success', 2000);
  } catch (error) {
    Logger.error('❌ Odaya katılma hatası', error);
    showNotification('Odaya katılınamadı', 'error');
  }
}

function updateRoomUI() {
  if (!STATE.currentRoom) return;

  // Oda başlığını güncelle
  const roomTitle = document.getElementById('roomTitle');
  if (roomTitle) {
    roomTitle.textContent = STATE.currentRoom.name;
  }

  // Mesajları temizle ve yeniden yükle
  const messagesDiv = document.getElementById('messages');
  if (messagesDiv) {
    messagesDiv.innerHTML = '';
  }

  // Kullanıcı listesini güncelle
  STATE.users.clear();
  updateUserList();

  // Demo mesajları ekle
  addDemoMessages();
}

function addDemoMessages() {
  const roomId = STATE.currentRoom.id;
  
  // Get room-specific demo messages or use default
  let demoMessages = [];
  
  if (DEMO_MESSAGES[roomId]) {
    // Use room-specific messages
    demoMessages = DEMO_MESSAGES[roomId].map(msg => ({
      id: Date.now().toString() + Math.random(),
      ...msg,
      timestamp: new Date(msg.timestamp)
    }));
  } else {
    // Default messages for custom rooms
    demoMessages = [
      { id: '1', userId: 'system', username: 'Sistem', avatar: '🤖', content: `💬 ${STATE.currentRoom.name} odasına hoşgeldiniz!`, timestamp: new Date().toISOString() },
      { id: '2', userId: '1', username: 'admin', avatar: '👑', content: 'Herkese merhaba! 👋', timestamp: new Date(Date.now() - 60000).toISOString() },
      { id: '3', userId: '2', username: 'moderator', avatar: '🛡️', content: 'Selam arkadaşlar, nasılsınız?', timestamp: new Date(Date.now() - 30000).toISOString() }
    ];
  }

  STATE.messages.set(STATE.currentRoom.id, demoMessages);
  
  const messagesDiv = document.getElementById('messages');
  if (messagesDiv) {
    messagesDiv.innerHTML = '';
    demoMessages.forEach(msg => displayMessage(msg));
  }
}

async function loadMessages(page = 1) {
  if (!STATE.currentRoom) return;
  addDemoMessages();
}

function renderAllMessages() {
  const messagesDiv = document.getElementById('messages');
  if (!messagesDiv || !STATE.currentRoom) return;

  messagesDiv.innerHTML = '';
  const messages = STATE.messages.get(STATE.currentRoom.id) || [];
  messages.forEach(msg => displayMessage(msg));
}

function displayMessage(message) {
  const messagesDiv = document.getElementById('messages');
  if (!messagesDiv) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'message';
  msgEl.dataset.messageId = message.id;

  const timestamp = DateUtils.formatRelative(message.timestamp);
  const avatarHtml = avatarElementHtml(message.avatar || '👤', message.username);
  const isOwnMessage = message.userId === STATE.user?.id;
  const roleColor = getRoleColor(message.role);

  // Reaksiyonlar
  let reactionsHTML = '';
  if (message.reactions && message.reactions.length > 0) {
    reactionsHTML = '<div class="message-reactions">';
    message.reactions.forEach(reaction => {
      const isReacted = reaction.users.includes(STATE.user?.id);
      reactionsHTML += `
        <span class="reaction-btn ${isReacted ? 'reacted' : ''}" 
              onclick="addMessageReaction('${message.id}', '${reaction.emoji}')">
          ${reaction.emoji} ${reaction.users.length}
        </span>`;
    });
    reactionsHTML += '</div>';
  }

  // İçerik Formatlama (GIF veya Text)
  let contentHTML = formatMessageContent(message.content);
  if (message.type === 'gif' || (message.content && message.content.startsWith('https://media.giphy.com'))) {
    contentHTML = `<img src="${message.content}" class="msg-gif" onclick="window.open(this.src)">`;
  }

  msgEl.innerHTML = `
    <div class="avatar" style="background:${roleColor}" title="${message.username}">${avatarHtml}</div>
    <div class="msg-content" style="position:relative;">
      <div class="message-header">
        <span class="msg-user" onclick="showUserProfile('${message.userId}')" style="cursor:pointer;">${StringUtils.escape(message.username)}</span>
        <span class="badge" style="background:${roleColor}">${getRoleName(message.role)}</span>
        <span class="message-time">${timestamp}</span>
        ${message.edited ? '<span class="edited-badge">düzenlendi</span>' : ''}
      </div>
      <div class="msg-text">${contentHTML}</div>
      ${reactionsHTML}
      <div class="message-actions">
        <button class="msg-action" onclick="toggleReactionPicker('${message.id}')">😊</button>
        ${isOwnMessage ? `
          <button class="msg-action" onclick="editMessage('${message.id}')">✏️</button>
          <button class="msg-action" onclick="deleteMessage('${message.id}')">🗑️</button>
        ` : ''}
      </div>
      <div class="reaction-picker hidden">
        ${REACTION_EMOJIS.map(e => `<span onclick="addMessageReaction('${message.id}', '${e}')">${e}</span>`).join('')}
      </div>
    </div>
  `;

  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function formatMessageContent(content) {
  // URL'leri linke çevir
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  let formatted = content.replace(urlRegex, '<a href="$1" target="_blank" class="msg-link">$1</a>');
  
  // @mention'ları renklendir
  formatted = formatted.replace(/@(\w+)/g, '<span class="mention">@$1</span>');
  
  return formatted;
}

function editMessage(messageId) {
  const messages = STATE.messages.get(STATE.currentRoom.id) || [];
  const message = messages.find(m => m.id === messageId);
  
  if (message && message.userId === STATE.user?.id) {
    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
      messageInput.value = StringUtils.unescape(message.content);
      messageInput.focus();
    }
  }
}

function deleteMessage(messageId) {
  if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;

  const messages = STATE.messages.get(STATE.currentRoom.id) || [];
  const index = messages.findIndex(m => m.id === messageId);
  if (index > -1) {
    messages.splice(index, 1);
    renderAllMessages();
  }
}

// =====================================================
// CREATE ROOM
// =====================================================

async function createRoom() {
  const roomName = document.getElementById('roomName');
  const roomPassword = document.getElementById('roomPassword');
  const roomMax = document.getElementById('roomMax');

  if (!roomName || !roomName.value.trim()) {
    showNotification('Oda adı gerekli', 'warning');
    return;
  }

  const name = roomName.value.trim();

  if (name.length > 30) {
    showNotification('Oda adı 30 karakteri geçemez', 'error');
    return;
  }

  if (STATE.rooms.has(name.toLowerCase())) {
    showNotification('Bu isimde bir oda zaten var', 'warning');
    return;
  }

  const newRoom = {
    id: name.toLowerCase(),
    name: '🏠 ' + name,
    icon: '🏠',
    description: '',
    usersCount: 0,
    type: roomPassword.value ? 'password' : 'public'
  };

  STATE.rooms.set(newRoom.id, newRoom);
  updateRoomsList();

  // Formu temizle
  roomName.value = '';
  roomPassword.value = '';
  roomMax.value = '';

  showNotification(`🎉 "${name}" odası oluşturuldu!`, 'success');
  joinRoom(newRoom.id);
}

// =====================================================
// USER INTERFACE
// =====================================================

function updateUserInfo() {
  if (!STATE.user) return;

  const usernameDisplay = document.getElementById('usernameDisplay');
  if (usernameDisplay) {
    usernameDisplay.textContent = STATE.user.username;
  }

  const roleBadge = document.getElementById('roleBadge');
  if (roleBadge) {
    roleBadge.textContent = getRoleName(STATE.user.role);
    roleBadge.style.background = getRoleColor(STATE.user.role);
  }

  const userInfo = document.getElementById('userInfo');
  if (userInfo) {
    userInfo.classList.remove('hidden');
  }

  // Admin panel butonunu göster/gizle
  const adminPanelBtn = document.getElementById('adminPanelBtn');
  if (adminPanelBtn) {
    if (STATE.user.role === 'admin') {
      adminPanelBtn.classList.remove('hidden');
    } else {
      adminPanelBtn.classList.add('hidden');
    }
  }

  // Admin panelini gizle (varsayılan olarak gizli)
  const adminPanel = document.getElementById('adminPanel');
  if (adminPanel) {
    adminPanel.classList.add('hidden');
  }
}

function updateUserList() {
  const usersList = document.getElementById('userList');
  if (!usersList) return;

  if (STATE.users.size === 0) {
    // Demo kullanıcılar göster
    usersList.innerHTML = `
      <div class="user-item">
        <div class="user-avatar">${avatarElementHtml('https://i.pravatar.cc/150?img=65', 'admin')}</div>
        <div class="user-info">
          <div class="user-name">admin</div>
          <div class="user-status"><span class="status-dot" style="background:#10b981"></span> Online</div>
        </div>
      </div>
      <div class="user-item">
        <div class="user-avatar">${avatarElementHtml('https://i.pravatar.cc/150?img=46', 'moderator')}</div>
        <div class="user-info">
          <div class="user-name">moderator</div>
          <div class="user-status"><span class="status-dot" style="background:#10b981"></span> Online</div>
        </div>
      </div>
      <div class="user-item">
        <div class="user-avatar">${avatarElementHtml('https://i.pravatar.cc/150?img=32', 'user1')}</div>
        <div class="user-info">
          <div class="user-name">user1</div>
          <div class="user-status"><span class="status-dot" style="background:#f59e0b"></span> Boşta</div>
        </div>
      </div>
    `;
    updateUserCount();
    return;
  }

  usersList.innerHTML = '';

  const onlineUsers = Array.from(STATE.users.values()).sort((a, b) => {
    if (a.status === 'Online' && b.status !== 'Online') return -1;
    if (a.status !== 'Online' && b.status === 'Online') return 1;
    return 0;
  });

  onlineUsers.forEach(user => {
    const userEl = document.createElement('div');
    userEl.className = 'user-item';
    userEl.innerHTML = `
      <div class="user-avatar" style="background:${getRoleColor(user.role)}">${user.avatar || user.username.charAt(0).toUpperCase()}</div>
      <div class="user-info">
        <div class="user-name">${StringUtils.escape(user.username)}</div>
        <div class="user-status">
          <span class="status-dot" style="background:${user.status === 'Online' ? '#10b981' : '#f59e0b'}"></span>
          ${user.status || 'Online'}
        </div>
      </div>
    `;
    usersList.appendChild(userEl);
  });
  
  updateUserCount();
}

// =====================================================
// THEME
// =====================================================

function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  STATE.theme = savedTheme;
  applyTheme(savedTheme);
}

function toggleTheme() {
  const newTheme = STATE.theme === 'dark' ? 'light' : 'dark';
  STATE.theme = newTheme;
  localStorage.setItem('theme', newTheme);
  applyTheme(newTheme);
  
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
  }
  
  // Arka plan partiküllerini güncelle
  window.dispatchEvent(new CustomEvent('themeChange'));
  
  showNotification(`${newTheme === 'dark' ? '🌙 Koyu' : '☀️ Aydınlık'} tema aktifleştirildi`, 'success', 2000);
}

function applyTheme(theme) {
  const body = document.body;
  body.style.transition = 'background 0.5s ease, color 0.5s ease';
  
  if (theme === 'light') {
    body.classList.add('light-theme');
    showNotification('☀️ Aydınlık temaya geçildi', 'info', 1500);
  } else {
    body.classList.remove('light-theme');
    showNotification('🌙 Koyu temaya geçildi', 'info', 1500);
  }
  
  // Update background particles
  setTimeout(() => {
    window.dispatchEvent(new CustomEvent('themeChange'));
  }, 250);
}

// =====================================================
// UTILITIES
// =====================================================

const rateLimiter = {
  attempts: new Map(),
  check: (key, limit = 5, windowMs = 5000) => {
    const now = Date.now();
    if (!rateLimiter.attempts.has(key)) {
      rateLimiter.attempts.set(key, []);
    }

    const times = rateLimiter.attempts.get(key);
    const recent = times.filter(t => now - t < windowMs);

    if (recent.length >= limit) {
      return false;
    }

    recent.push(now);
    rateLimiter.attempts.set(key, recent);
    return true;
  }
};

function getRoleName(role) {
  const names = {
    user: 'Üye',
    admin: 'Admin',
    moderator: 'Moderatör',
    kahve: 'Kahve Sever',
    oyun: 'Oyunsever',
    spor: 'Sporcu',
    muzik: 'Müzisyen',
    gezgin: 'Gezgin',
    yazar: 'Yazar',
    sanat: 'Sanatçı',
    programci: 'Programcı',
    gurme: 'Gurme'
  };
  return names[role] || 'Üye';
}

function getRoleColor(role) {
  const colors = {
    admin: '#ef4444',
    moderator: '#f59e0b',
    programci: '#3b82f6',
    sanat: '#ec4899',
    yazar: '#8b5cf6',
    oyun: '#06b6d4',
    kahve: '#f97316',
    muzik: '#10b981',
    spor: '#14b8a6',
    gezgin: '#06b6d4',
    gurme: '#f59e0b',
    default: '#64748b'
  };
  return colors[role] || colors.default;
}

// =====================================================
// BACKGROUND ANIMATION
// =====================================================

function setupBackgroundAnimation() {
  const canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  let particles = [];
  let mouse = { x: null, y: null };

  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 3 + 1;
      this.speedX = (Math.random() - 0.5) * 0.5;
      this.speedY = (Math.random() - 0.5) * 0.5;
      this.opacity = Math.random() * 0.4 + 0.1;
      this.color = this.getColor();
      this.connections = [];
    }

    getColor() {
      const isDark = STATE.theme === 'dark';
      const colors = isDark ? 
        ['#06b6d4', '#22d3ee', '#0891b2', '#3b82f6', '#60a5fa'] : 
        ['#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa', '#06b6d4'];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Mouse etkileşimi
      if (mouse.x && mouse.y) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 100) {
          this.speedX += dx * 0.0001;
          this.speedY += dy * 0.0001;
        }
      }

      // Kenar kontrolü
      if (this.x > canvas.width) this.x = 0;
      if (this.x < 0) this.x = canvas.width;
      if (this.y > canvas.height) this.y = 0;
      if (this.y < 0) this.y = canvas.height;

      // Hız sınırlaması
      this.speedX *= 0.99;
      this.speedY *= 0.99;
    }

    draw() {
      ctx.fillStyle = this.color.replace(')', `, ${this.opacity})`).replace('rgb', 'rgba');
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();

      // Bağlantılar
      this.connections.forEach(conn => {
        ctx.strokeStyle = this.color.replace(')', `, ${this.opacity * 0.3})`).replace('rgb', 'rgba');
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(conn.x, conn.y);
        ctx.stroke();
      });
    }
  }

  // Partikülleri oluştur
  for (let i = 0; i < 80; i++) {
    particles.push(new Particle());
  }

  // Bağlantıları hesapla
  function updateConnections() {
    particles.forEach(particle => {
      particle.connections = [];
      particles.forEach(other => {
        if (particle !== other) {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 120) {
            particle.connections.push(other);
          }
        }
      });
    });
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateConnections();

    particles.forEach(particle => {
      particle.update();
      particle.draw();
    });

    requestAnimationFrame(animate);
  }

  animate();

  // Mouse hareketlerini takip et
  canvas.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  canvas.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Tema değiştiğinde renkleri güncelle
  window.addEventListener('themeChange', () => {
    particles.forEach(particle => {
      particle.color = particle.getColor();
    });
  });

  window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}

function setupConnectionListeners() {
  window.addEventListener('online', () => {
    Logger.success('🌐 İnternet bağlantısı geri geldi');
    showNotification('İnternet bağlantısı geri geldi', 'success');
    updateConnectionStatus(true);
    if (STATE.socket) STATE.socket.connect();
  });

  window.addEventListener('offline', () => {
    Logger.warning('🌐 İnternet bağlantısı koptu');
    showNotification('İnternet bağlantısı koptu', 'warning', 0);
    updateConnectionStatus(false);
  });
}

function showHelpModal() {
  showNotification('⌨️ Kısayollar: Ctrl+K (Yardım), Esc (Panelleri Kapat)', 'info', 5000);
}

// =====================================================
// TAB SWITCHING
// =====================================================

function switchTab(tab) {
  const loginTab = document.getElementById('loginTab');
  const registerTab = document.getElementById('registerTab');
  const tabBtns = document.querySelectorAll('.tab-btn');

  if (tab === 'login') {
    if (loginTab) loginTab.classList.remove('hidden');
    if (registerTab) registerTab.classList.add('hidden');
    if (tabBtns[0]) tabBtns[0].classList.add('active');
    if (tabBtns[1]) tabBtns[1].classList.remove('active');
  } else {
    if (loginTab) loginTab.classList.add('hidden');
    if (registerTab) registerTab.classList.remove('hidden');
    if (tabBtns[0]) tabBtns[0].classList.remove('active');
    if (tabBtns[1]) tabBtns[1].classList.add('active');
  }
}

// =====================================================
// EMOJI PICKER
// =====================================================

const emojis = ['😀', '😂', '🤣', '😊', '😍', '🥰', '😎', '🤩', '🥳', '😜', '🤔', '😐', '😢', '😡', '👍', '👎', '❤️', '💔', '🔥', '✨', '🎉', '🎊', '💯', '⭐', '🌟', '💫', '🎵', '🎶', '🎮', '🎯'];

function toggleEmojiPicker() {
  let emojiBar = document.getElementById('emojiBar');
  if (!emojiBar) {
    const chatInputArea = document.querySelector('.chat-input-area');
    if (chatInputArea) {
      emojiBar = document.createElement('div');
      emojiBar.id = 'emojiBar';
      emojiBar.className = 'emoji-bar';
      chatInputArea.insertBefore(emojiBar, document.getElementById('typingIndicator'));
    }
  }

  if (!emojiBar) return;

  if (emojiBar.classList.contains('hidden')) {
    emojiBar.classList.remove('hidden');
    initializeEmojis();
  } else {
    emojiBar.classList.add('hidden');
  }
}

function initializeEmojis() {
  const emojiBar = document.getElementById('emojiBar');
  if (!emojiBar) return;

  emojiBar.innerHTML = '';
  emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.onclick = () => {
      const messageInput = document.getElementById('messageInput');
      if (messageInput) {
        messageInput.textContent += emoji;
        messageInput.focus();
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(messageInput);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
      }
    };
    emojiBar.appendChild(btn);
  });
}

// =====================================================
// STICKER PICKER
// =====================================================

const stickers = ['👍', '👎', '❤️', '😂', '😢', '😮', '🎉', '🔥', '💯', '🤔', '😴', '🤗', '🤐', '🤯', '🥳', '😎', '👋', '✌️', '🤝', '💪'];

function toggleStickerPicker() {
  const stickerBar = document.getElementById('stickerBar');
  if (!stickerBar) return;

  if (stickerBar.classList.contains('hidden')) {
    stickerBar.classList.remove('hidden');
    initializeStickers();
  } else {
    stickerBar.classList.add('hidden');
  }
}

function initializeStickers() {
  const stickerBar = document.getElementById('stickerBar');
  if (!stickerBar) return;

  stickerBar.innerHTML = '';
  stickers.forEach(sticker => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.textContent = sticker;
    btn.onclick = () => {
      const messageInput = document.getElementById('messageInput');
      if (messageInput) {
        messageInput.value += sticker;
        messageInput.focus();
      }
    };
    stickerBar.appendChild(btn);
  });
}

// =====================================================
// GIF PICKER
// =====================================================

function toggleGifPicker() {
  const gifPanel = document.getElementById('gifPanel');
  if (!gifPanel) return;

  if (gifPanel.classList.contains('hidden')) {
    gifPanel.classList.remove('hidden');
    showGifLibrary();
  } else {
    gifPanel.classList.add('hidden');
  }
}

function addMessageReaction(messageId, emoji) {
  if (!STATE.user || !STATE.currentRoom) return;
  const messages = STATE.messages.get(STATE.currentRoom.id) || [];
  const message = messages.find(m => m.id === messageId);
  
  if (message) {
    if (!message.reactions) message.reactions = [];
    const existing = message.reactions.find(r => r.emoji === emoji);
    
    if (existing) {
      if (existing.users.includes(STATE.user.id)) {
        existing.users = existing.users.filter(id => id !== STATE.user.id);
        if (existing.users.length === 0) message.reactions = message.reactions.filter(r => r !== existing);
      } else {
        existing.users.push(STATE.user.id);
      }
    } else {
      message.reactions.push({ emoji, users: [STATE.user.id] });
    }
    renderAllMessages();
  }
}

function searchGif() {
  const query = document.getElementById('gifSearch').value.trim();
  const resultsDiv = document.getElementById('gifResults');
  
  if (!query) {
    showNotification('GIF arama terimi girin', 'warning');
    return;
  }

  if (resultsDiv) {
    resultsDiv.innerHTML = '<p style="color:#64748b;text-align:center;">GIF arama özelliği için API anahtarı gerekli</p>';
  }
  
  showNotification('GIF arama özelliği yakında aktif olacak', 'info');
}

// =====================================================
// MESSAGE SEARCH
// =====================================================

function searchMessages() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  
  if (!query) {
    renderAllMessages();
    return;
  }

  const messages = STATE.messages.get(STATE.currentRoom?.id) || [];
  const filteredMessages = messages.filter(msg =>
    msg.content.toLowerCase().includes(query) ||
    msg.username.toLowerCase().includes(query)
  );

  const messagesDiv = document.getElementById('messages');
  if (messagesDiv) {
    messagesDiv.innerHTML = '';
    if (filteredMessages.length === 0) {
      messagesDiv.innerHTML = '<div style="color:#64748b;text-align:center;padding:20px;">Sonuç bulunamadı</div>';
    } else {
      filteredMessages.forEach(msg => displayMessage(msg));
    }
  }
}

// =====================================================
// FILE UPLOAD
// =====================================================

function toggleFileUpload(acceptType = 'image/*,video/*,.pdf') {
  const fileInput = document.getElementById('fileInput');
  if (fileInput) {
    fileInput.accept = acceptType;
    fileInput.onchange = (event) => {
      const file = event.target.files?.[0];
      if (file) {
        handleChatFileUpload(file);
      }
      fileInput.value = '';
    };
    fileInput.click();
  }
}

function handleChatFileUpload(file) {
  if (!STATE.user || !STATE.currentRoom) {
    showNotification('Önce bir kanala girin', 'warning');
    return;
  }

  const roomId = typeof STATE.currentRoom === 'string' ? STATE.currentRoom : STATE.currentRoom.id;
  if (!roomId) {
    showNotification('Önce bir kanala girin', 'warning');
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const fileUrl = reader.result;
    let messageType = 'file';
    if (file.type.startsWith('image/')) {
      messageType = 'image';
    } else if (file.type.startsWith('video/')) {
      messageType = 'video';
    } else if (file.type.startsWith('audio/')) {
      messageType = 'audio';
    }

    const message = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        roomId: roomId,
      avatar: STATE.user.avatar || '😀',
      content: fileUrl,
      timestamp: new Date().toISOString(),
      type: messageType,
      filename: file.name,
      edited: false,
      reactions: []
    };

    if (!STATE.messages.has(STATE.currentRoom.id)) {
      STATE.messages.set(STATE.currentRoom.id, []);
    }
    STATE.messages.get(STATE.currentRoom.id).push(message);
    addMessageToUI(message);
    showNotification(`${file.name} başarıyla gönderildi`, 'success');
  };
  reader.readAsDataURL(file);
}

function toggleAudioRecorder() {
  if (isRecordingAudio) {
    stopAudioRecording();
  } else {
    startAudioRecording();
  }
}

async function startAudioRecording() {
  if (!STATE.user) {
    showNotification('Ses göndermek için giriş yapmalısınız', 'warning');
    return;
  }

  if (!navigator.mediaDevices || !window.MediaRecorder) {
    showNotification('Ses kaydı tarayıcınızda desteklenmiyor', 'error');
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioRecorder = new MediaRecorder(stream);
    audioChunks = [];

    audioRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) audioChunks.push(event.data);
    };

    audioRecorder.onstop = () => {
      const roomId = typeof STATE.currentRoom === 'string' ? STATE.currentRoom : STATE.currentRoom.id;
      const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
      const fileUrl = URL.createObjectURL(audioBlob);
      const message = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        roomId: roomId,
        userId: STATE.user.id,
        username: STATE.user.username,
        avatar: STATE.user.avatar || '😀',
        content: fileUrl,
        timestamp: new Date().toISOString(),
        type: 'audio',
        filename: 'Ses kaydı.webm',
        edited: false,
        reactions: []
      };
      if (!STATE.messages.has(STATE.currentRoom.id)) {
        STATE.messages.set(STATE.currentRoom.id, []);
      }
      STATE.messages.get(STATE.currentRoom.id).push(message);
      addMessageToUI(message);
      showNotification('Ses kaydı gönderildi', 'success');
    };

    audioRecorder.start();
    isRecordingAudio = true;
    showNotification('Ses kaydı başlatıldı. Tekrar butona basarak durdurun.', 'info', 4000);
  } catch (error) {
    showNotification('Ses kaydı başlatılamadı: ' + error.message, 'error');
  }
}

function stopAudioRecording() {
  if (audioRecorder && audioRecorder.state !== 'inactive') {
    audioRecorder.stop();
    audioRecorder.stream.getTracks().forEach(track => track.stop());
  }
  isRecordingAudio = false;
}

// =====================================================
// VOICE CHAT
// =====================================================

function toggleVoicePanel() {
  const voicePanel = document.getElementById('voicePanel');
  if (voicePanel) {
    voicePanel.classList.toggle('hidden');
    if (!voicePanel.classList.contains('hidden')) {
      showNotification('🎤 Sesli sohbet paneli açıldı', 'info');
    }
  }
}

async function startVoice(roomType) {
  if (!STATE.user) {
    showNotification('Sesli sohbet için giriş yapmalısınız', 'warning');
    return;
  }

  try {
    const localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });

    STATE.localStream = localStream;
    
    const voicePanel = document.getElementById('voicePanel');
    if (voicePanel) {
      voicePanel.innerHTML = `
        <h3>🎤 ${roomType.charAt(0).toUpperCase() + roomType.slice(1)} Odası</h3>
        <p>Bağlı kullanıcılar: <span id="voiceUserCount">1</span>/5</p>
        <div class="voice-controls">
          <button class="btn btn-secondary" onclick="toggleMic()">🔊 Mikrofon</button>
          <button class="btn btn-danger" onclick="stopVoice()">❌ Ayrıl</button>
        </div>
      `;
    }

    showNotification(`🎙️ ${roomType} odasına katıldınız`, 'success');

    if (STATE.socket) {
      STATE.socket.emit('join-voice-room', {
        roomType,
        userId: STATE.user.id,
        username: STATE.user.username
      });
    }

  } catch (error) {
    Logger.error('❌ Sesli sohbet hatası', error);
    showNotification('Mikrofon erişimi reddedildi!', 'error');
  }
}

function stopVoice() {
  if (STATE.localStream) {
    STATE.localStream.getTracks().forEach(track => track.stop());
    STATE.localStream = null;
  }

  if (STATE.socket) {
    STATE.socket.emit('leave-voice-room');
  }

  // Panel'i sıfırla
  const voicePanel = document.getElementById('voicePanel');
  if (voicePanel) {
    voicePanel.innerHTML = `
      <h3>🎤 Sesli Sohbet Odaları</h3>
      <div class="voice-rooms">
        <button class="btn btn-primary voice-start-btn" onclick="startVoice('genel')">🎙️ Genel Sohbet (5 kişi)</button>
        <button class="btn btn-primary voice-start-btn" onclick="startVoice('oyun')">🎮 Oyun Odası (5 kişi)</button>
        <button class="btn btn-primary voice-start-btn" onclick="startVoice('sohbet')">💬 Sohbet Odası (5 kişi)</button>
        <button class="btn btn-primary voice-start-btn" onclick="startVoice('tanisma')">👋 Tanışma Odası (5 kişi)</button>
      </div>
    `;
  }

  showNotification('Sesli sohbetten ayrıldınız', 'info');
}

function toggleMic() {
  if (STATE.localStream) {
    const audioTrack = STATE.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      showNotification(audioTrack.enabled ? '🔊 Mikrofon açıldı' : '🔇 Mikrofon kapatıldı', 'info');
    }
  }
}

// =====================================================
// VIDEO CHAT
// =====================================================

async function startVideo() {
  if (!STATE.user) {
    showNotification('Video sohbet için giriş yapmalısınız', 'warning');
    return;
  }

  try {
    const localStream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false
    });

    const videoElement = document.getElementById('localVideo');
    if (videoElement) {
      videoElement.srcObject = localStream;
    }

    STATE.localStream = localStream;
    showNotification('📹 Video başlatıldı', 'success');

  } catch (error) {
    Logger.error('❌ Video sohbet hatası', error);
    showNotification('Kamera erişimi reddedildi!', 'error');
  }
}

function stopVideo() {
  if (STATE.localStream) {
    STATE.localStream.getTracks().forEach(track => track.stop());
    STATE.localStream = null;
  }

  const videoElement = document.getElementById('localVideo');
  if (videoElement) {
    videoElement.srcObject = null;
  }

  showNotification('Video kapatıldı', 'info');
}

// =====================================================
// LEADERBOARD
// =====================================================

function showLeaderboard() {
  const messageCounts = {};
  STATE.messages.forEach((messages, roomId) => {
    messages.forEach(msg => {
      if (!messageCounts[msg.username]) {
        messageCounts[msg.username] = 0;
      }
      messageCounts[msg.username]++;
    });
  });

  const sorted = Object.entries(messageCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  if (sorted.length === 0) {
    showNotification('Henüz yeterli mesaj yok', 'info');
    return;
  }

  let html = '<div class="leaderboard-panel"><h2>🏆 Liderlik Tablosu</h2>';
  
  sorted.forEach(([username, count], idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
    html += `
      <div class="leaderboard-item">
        <span class="leaderboard-rank">${medal}</span>
        <span class="leaderboard-name">${StringUtils.escape(username)}</span>
        <span class="leaderboard-score">${count} mesaj</span>
      </div>
    `;
  });

  html += '<button class="btn btn-primary" onclick="this.parentElement.remove()">Kapat</button></div>';
  
  const existing = document.querySelector('.leaderboard-panel');
  if (existing) existing.remove();
  
  document.body.insertAdjacentHTML('beforeend', html);
}

// =====================================================
// PROFILE
// =====================================================

function changeStatus(status) {
  if (STATE.user) {
    STATE.user.status = status;
    localStorage.setItem('user', JSON.stringify(STATE.user));
    showNotification(`Durum "${status}" olarak ayarlandı`, 'success', 2000);
  }
}

function updateProfile() {
  const bioInput = document.getElementById('bioInput');
  if (!bioInput || !STATE.user) return;

  const bio = bioInput.value.trim();

  if (bio.length > 150) {
    showNotification('Biyografi 150 karakteri geçemez', 'error');
    return;
  }

  STATE.user.bio = bio;
  localStorage.setItem('user', JSON.stringify(STATE.user));
  showNotification('Profil güncellendi! ✨', 'success');
}

// =====================================================
// ADMIN FUNCTIONS
// =====================================================

function loadAdminUsers() {
  if (!STATE.user || STATE.user.role !== 'admin') return;

  const users = MockAuth.getUsers();
  const adminUserList = document.getElementById('adminUserList');
  
  // Update stats
  const totalUsersEl = document.getElementById('adminTotalUsers');
  const onlineUsersEl = document.getElementById('adminOnlineUsers');
  if (totalUsersEl) totalUsersEl.textContent = users.length;
  if (onlineUsersEl) onlineUsersEl.textContent = STATE.users.size > 0 ? STATE.users.size : Math.floor(Math.random() * 20) + 5;
  
  if (adminUserList) {
    adminUserList.innerHTML = '';
    users.forEach(user => {
      const userEl = document.createElement('div');
      userEl.className = 'admin-user';
      userEl.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px;margin-bottom:6px;background:var(--bg-tertiary);border-radius:8px;';
      userEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:18px;">${user.avatar || '👤'}</span>
          <div>
            <div style="font-weight:600;font-size:13px;">${StringUtils.escape(user.username)}</div>
            <div style="font-size:11px;color:var(--text-muted);">${user.email || ''}</div>
          </div>
        </div>
        <div style="display:flex;gap:4px;align-items:center;">
          <span class="badge" style="background:${getRoleColor(user.role)};color:white;font-size:10px;">${getRoleName(user.role)}</span>
          ${user.role !== 'admin' ? `
            <button class="btn btn-ghost btn-sm" onclick="promoteUser('${user.id}', 'moderator')" title="Mod yap">⬆️</button>
            <button class="btn btn-danger btn-sm" onclick="banUser('${user.id}')" title="Yasakla">🚫</button>
          ` : ''}
        </div>
      `;
      adminUserList.appendChild(userEl);
    });
  }
}

function promoteUser(userId, newRole) {
  const users = MockAuth.getUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.role = newRole;
    MockAuth.saveUsers(users);
    showNotification(`${user.username} moderatör yapıldı!`, 'success');
    loadAdminUsers();
  }
}

function banUser(userId) {
  if (!confirm('Bu kullanıcıyı yasaklamak istediğinize emin misiniz?')) return;
  
  const users = MockAuth.getUsers();
  const index = users.findIndex(u => u.id === userId);
  if (index > -1) {
    const user = users[index];
    users.splice(index, 1);
    MockAuth.saveUsers(users);
    showNotification(`${user.username} yasaklandı!`, 'success');
    loadAdminUsers();
  }
}

function broadcastMessage() {
  const message = prompt('Tüm odalara gönderilecek mesajı yazın:');
  if (!message) return;
  
  STATE.rooms.forEach((room, roomId) => {
    const broadcastMsg = {
      id: 'broadcast_' + Date.now() + '_' + roomId,
      userId: 'system',
      username: '📢 Sistem',
      avatar: '📢',
      content: `[GENEL DUYURU] ${message}`,
      timestamp: new Date(),
      type: 'text',
      reactions: []
    };
    
    if (!STATE.messages.has(roomId)) {
      STATE.messages.set(roomId, []);
    }
    STATE.messages.get(roomId).push(broadcastMsg);
  });
  
  showNotification('Mesaj tüm odalara gönderildi!', 'success');
  renderAllMessages();
}

function clearRoom() {
  if (!confirm('Tüm mesajları silmek istediğinize emin misiniz?')) return;

  if (STATE.currentRoom) {
    STATE.messages.set(STATE.currentRoom.id, []);
    const messagesDiv = document.getElementById('messages');
    if (messagesDiv) {
      messagesDiv.innerHTML = '<div style="color:#64748b;text-align:center;padding:40px;">Oda temizlendi</div>';
    }
    showNotification('Oda temizlendi', 'info');
  }
}

// =====================================================
// BOT AUTO-RESPONSE SYSTEM
// =====================================================

function triggerBotResponse(userMessage) {
  // Only respond in demo mode (no socket connection)
  if (STATE.isConnected) return;
  
  const lowerMessage = userMessage.toLowerCase();
  
  // Check for specific keywords and respond accordingly
  let botResponses = [];
  
  // Greeting responses
  if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam') || lowerMessage.includes('hey') || lowerMessage.includes('hi')) {
    botResponses = [
      { userId: '1', username: 'admin', avatar: '👑', content: 'Merhaba! Hoşgeldin! 👋', delay: 2000 },
      { userId: '9', username: 'ayse_celik', avatar: 'https://i.pravatar.cc/150?img=20', content: 'Selam! Nasılsın? 😊', delay: 4000 }
    ];
  }
  
  // Game responses
  else if (lowerMessage.includes('oyun') || lowerMessage.includes('game') || lowerMessage.includes('valorant') || lowerMessage.includes('league')) {
    botResponses = [
      { userId: '4', username: 'ahmet_yilmaz', avatar: 'https://i.pravatar.cc/150?img=14', content: 'Oyun mu? Ben de oynamak istiyorum! 🎮', delay: 2000 },
      { userId: '11', username: 'zeynep_aydin', avatar: 'https://i.pravatar.cc/150?img=44', content: 'Hangi oyun? Valorant mı? 💜', delay: 4000 }
    ];
  }
  
  // Music responses
  else if (lowerMessage.includes('müzik') || lowerMessage.includes('music') || lowerMessage.includes('şarkı')) {
    botResponses = [
      { userId: '7', username: 'emre_kaya', avatar: 'https://i.pravatar.cc/150?img=38', content: 'Ne tür müzik dinliyorsun? 🎵', delay: 2000 },
      { userId: '13', username: 'meryem_koc', avatar: 'https://i.pravatar.cc/150?img=55', content: 'K-pop dinledin mi? Harika! 💜🎤', delay: 4000 }
    ];
  }
  
  // General conversation
  else if (lowerMessage.includes('nasılsın') || lowerMessage.includes('naber') || lowerMessage.includes('ne yapıyorsun')) {
    botResponses = [
      { userId: '5', username: 'mehmet_demir', avatar: 'https://i.pravatar.cc/150?img=31', content: 'İyiyim, teşekkürler! Sen nasılsın? 😊', delay: 2000 },
      { userId: '10', username: 'fatma_ozdemir', avatar: 'https://i.pravatar.cc/150?img=17', content: 'Harika! Kahvemi yudumluyorum ☕', delay: 4000 }
    ];
  }
  
  // Thank you responses
  else if (lowerMessage.includes('teşekkür') || lowerMessage.includes('sağol') || lowerMessage.includes('thanks')) {
    botResponses = [
      { userId: '6', username: 'can_ozturk', avatar: 'https://i.pravatar.cc/150?img=26', content: 'Rica ederim! 😊', delay: 2000 }
    ];
  }
  
  // Default random response
  else {
    const randomResponse = BOT_RESPONSES[Math.floor(Math.random() * BOT_RESPONSES.length)];
    const randomBot = MOCK_USERS[Math.floor(Math.random() * 5) + 4]; // Pick from user 4-8
    botResponses = [
      { userId: randomBot.id, username: randomBot.username, avatar: randomBot.avatar, content: randomResponse, delay: 2000 }
    ];
  }
  
  // Send bot responses with delays
  botResponses.forEach((botMsg, index) => {
    setTimeout(() => {
      if (STATE.currentRoom) {
        const message = {
          id: 'bot_' + Date.now() + '_' + index,
          userId: botMsg.userId,
          username: botMsg.username,
          avatar: botMsg.avatar,
          content: botMsg.content,
          timestamp: new Date(),
          type: 'text',
          reactions: []
        };
        
        handleNewMessage(message);
      }
    }, botMsg.delay);
  });
}

// =====================================================
// FRIEND SYSTEM
// =====================================================

const FriendSystem = {
  // Arkadaş listesi
  friends: [],
  // Bekleyen istekler
  pendingRequests: [],
  // Engellenen kullanıcılar
  blockedUsers: [],
  // Spam mesajları
  spamMessages: [],

  // Başlat
  init() {
    const savedFriends = localStorage.getItem('friends');
    const savedRequests = localStorage.getItem('friendRequests');
    const savedBlocked = localStorage.getItem('blockedUsers');
    const savedSpam = localStorage.getItem('spamMessages');

    if (savedFriends) this.friends = JSON.parse(savedFriends);
    if (savedRequests) this.pendingRequests = JSON.parse(savedRequests);
    if (savedBlocked) this.blockedUsers = JSON.parse(savedBlocked);
    if (savedSpam) this.spamMessages = JSON.parse(savedSpam);
  },

  // Kaydet
  save() {
    localStorage.setItem('friends', JSON.stringify(this.friends));
    localStorage.setItem('friendRequests', JSON.stringify(this.pendingRequests));
    localStorage.setItem('blockedUsers', JSON.stringify(this.blockedUsers));
    localStorage.setItem('spamMessages', JSON.stringify(this.spamMessages));
  },

  // Arkadaşlık isteği gönder
  sendRequest(targetUserId, targetUsername) {
    if (this.isBlocked(targetUserId)) {
      showNotification('Bu kullanıcı engellenmiş', 'error');
      return false;
    }

    if (this.isFriend(targetUserId)) {
      showNotification('Zaten arkadaşsınız', 'warning');
      return false;
    }

    if (this.pendingRequests.find(r => r.userId === targetUserId)) {
      showNotification('Zaten istek gönderilmiş', 'warning');
      return false;
    }

    const request = {
      id: Date.now().toString(),
      fromUserId: STATE.user?.id,
      fromUsername: STATE.user?.username,
      toUserId: targetUserId,
      toUsername: targetUsername,
      timestamp: new Date().toISOString()
    };

    this.pendingRequests.push(request);
    this.save();
    showNotification(`Arkadaşlık isteği gönderildi: ${targetUsername}`, 'success');
    return true;
  },

  // İsteği kabul et
  acceptRequest(requestId) {
    const index = this.pendingRequests.findIndex(r => r.id === requestId);
    if (index === -1) return false;

    const request = this.pendingRequests[index];
    this.pendingRequests.splice(index, 1);

    this.friends.push({
      userId: request.fromUserId,
      username: request.fromUsername,
      avatar: 'https://i.pravatar.cc/150?img=20',
      addedAt: new Date().toISOString()
    });

    this.save();
    showNotification(`${request.fromUsername} ile arkadaş olundunuz!`, 'success');
    return true;
  },

  // İsteği reddet
  rejectRequest(requestId) {
    const index = this.pendingRequests.findIndex(r => r.id === requestId);
    if (index === -1) return false;

    const request = this.pendingRequests[index];
    this.pendingRequests.splice(index, 1);
    this.save();
    showNotification('İstek reddedildi', 'info');
    return true;
  },

  // Arkadaş mı?
  isFriend(userId) {
    return this.friends.find(f => f.userId === userId);
  },

  // Engelle
  blockUser(userId, username) {
    if (this.isBlocked(userId)) {
      showNotification('Kullanıcı zaten engellenmiş', 'warning');
      return false;
    }

    this.blockedUsers.push({
      userId,
      username,
      blockedAt: new Date().toISOString()
    });

    // Arkadaş listesinden çıkar
    const friendIndex = this.friends.findIndex(f => f.userId === userId);
    if (friendIndex > -1) {
      this.friends.splice(friendIndex, 1);
    }

    this.save();
    showNotification(`${username} engellendi`, 'success');
    return true;
  },

  // Engel kaldır
  unblockUser(userId) {
    const index = this.blockedUsers.findIndex(b => b.userId === userId);
    if (index === -1) return false;

    const blocked = this.blockedUsers[index];
    this.blockedUsers.splice(index, 1);
    this.save();
    showNotification(`${blocked.username} engeli kaldırıldı`, 'success');
    return true;
  },

  // Engellenmiş mi?
  isBlocked(userId) {
    return this.blockedUsers.find(b => b.userId === userId);
  },

  // Spam mesaj ekle
  addSpamMessage(fromUserId, fromUsername, content) {
    this.spamMessages.push({
      id: Date.now().toString(),
      fromUserId,
      fromUsername,
      content,
      timestamp: new Date().toISOString(),
      read: false
    });
    this.save();
  },

  // Spam mesajı sil
  deleteSpamMessage(messageId) {
    const index = this.spamMessages.findIndex(m => m.id === messageId);
    if (index > -1) {
      this.spamMessages.splice(index, 1);
      this.save();
    }
  },

  // Arkadaş listesini göster
  showFriendList() {
    const friendListContainer = document.getElementById('friendList');
    if (!friendListContainer) return;

    friendListContainer.innerHTML = '';

    if (this.friends.length === 0) {
      friendListContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:10px;">Henüz arkadaş yok</p>';
      return;
    }

    this.friends.forEach(friend => {
      const friendEl = document.createElement('div');
      friendEl.className = 'friend-item';
      friendEl.innerHTML = `
        <div class="friend-avatar">${friend.avatar || '😊'}</div>
        <div class="friend-info">
          <span class="friend-name">${friend.username}</span>
          <span class="friend-status">Arkadaş</span>
        </div>
        <div class="friend-actions">
          <button class="btn btn-ghost btn-sm" onclick="openDMWithFriend('${friend.userId}', '${friend.username}')" title="Mesaj gönder">📩</button>
          <button class="btn btn-ghost btn-sm" onclick="FriendSystem.blockUser('${friend.userId}', '${friend.username}')" title="Engelle">🚫</button>
        </div>
      `;
      friendListContainer.appendChild(friendEl);
    });
  },

  // Bekleyen istekleri göster
  showPendingRequests() {
    const requestsContainer = document.getElementById('friendRequests');
    if (!requestsContainer) return;

    requestsContainer.innerHTML = '';

    if (this.pendingRequests.length === 0) {
      requestsContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:10px;">Bekleyen istek yok</p>';
      return;
    }

    this.pendingRequests.forEach(request => {
      const requestEl = document.createElement('div');
      requestEl.className = 'friend-request-item';
      requestEl.innerHTML = `
        <div class="request-avatar">👤</div>
        <div class="request-info">
          <span class="request-name">${request.fromUsername}</span>
          <span class="request-time">${DateUtils.formatRelative(request.timestamp)}</span>
        </div>
        <div class="request-actions">
          <button class="btn btn-success btn-sm" onclick="FriendSystem.acceptRequest('${request.id}')" title="Kabul et">✓</button>
          <button class="btn btn-danger btn-sm" onclick="FriendSystem.rejectRequest('${request.id}')" title="Reddet">✕</button>
        </div>
      `;
      requestsContainer.appendChild(requestEl);
    });
  },

  // Engellenenleri göster
  showBlockedUsers() {
    const blockedContainer = document.getElementById('blockedUsers');
    if (!blockedContainer) return;

    blockedContainer.innerHTML = '';

    if (this.blockedUsers.length === 0) {
      blockedContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:10px;">Engellenen kullanıcı yok</p>';
      return;
    }

    this.blockedUsers.forEach(blocked => {
      const blockedEl = document.createElement('div');
      blockedEl.className = 'blocked-user-item';
      blockedEl.innerHTML = `
        <div class="blocked-avatar">🚫</div>
        <div class="blocked-info">
          <span class="blocked-name">${blocked.username}</span>
          <span class="blocked-time">${DateUtils.formatRelative(blocked.blockedAt)}</span>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="FriendSystem.unblockUser('${blocked.userId}')" title="Engeli kaldır">Unblock</button>
      `;
      blockedContainer.appendChild(blockedEl);
    });
  },

  // Spam mesajları göster
  showSpamMessages() {
    const spamContainer = document.getElementById('spamMessages');
    if (!spamContainer) return;

    spamContainer.innerHTML = '';

    if (this.spamMessages.length === 0) {
      spamContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:10px;">Spam mesaj yok</p>';
      return;
    }

    this.spamMessages.forEach(spam => {
      const spamEl = document.createElement('div');
      spamEl.className = 'spam-message-item';
      spamEl.innerHTML = `
        <div class="spam-info">
          <span class="spam-from">${spam.fromUsername}</span>
          <span class="spam-content">${StringUtils.truncate(spam.content, 50)}</span>
          <span class="spam-time">${DateUtils.formatRelative(spam.timestamp)}</span>
        </div>
        <div class="spam-actions">
          <button class="btn btn-ghost btn-sm" onclick="FriendSystem.blockUser('${spam.fromUserId}', '${spam.fromUsername}')" title="Engelle">🚫</button>
          <button class="btn btn-ghost btn-sm" onclick="FriendSystem.deleteSpamMessage('${spam.id}')" title="Sil">🗑️</button>
        </div>
      `;
      spamContainer.appendChild(spamEl);
    });
  }
};

// Arkadaşlık sistemi başlat
FriendSystem.init();

// Arkadaş ile DM aç
function openDMWithFriend(userId, username) {
  openDM(userId, username);
}

// =====================================================
// STORY SYSTEM
// =====================================================

const StorySystem = {
  stories: [],

  init() {
    const savedStories = localStorage.getItem('stories');
    if (savedStories) this.stories = JSON.parse(savedStories);

    // Eski story'leri temizle (24 saatten eski)
    const now = Date.now();
    this.stories = this.stories.filter(s => now - new Date(s.timestamp).getTime() < 24 * 60 * 60 * 1000);
    this.save();
  },

  save() {
    localStorage.setItem('stories', JSON.stringify(this.stories));
  },

  // Story ekle
  addStory(content, type = 'text', mediaUrl = null) {
    if (!STATE.user) return;

    const story = {
      id: Date.now().toString(),
      userId: STATE.user.id,
      username: STATE.user.username,
      avatar: STATE.user.avatar,
      content,
      type,
      mediaUrl,
      timestamp: new Date().toISOString(),
      views: []
    };

    this.stories.unshift(story);
    this.save();
    showNotification('Story paylaşıldı! 📸', 'success');
    return story;
  },

  // Story görüntüle
  viewStory(storyId) {
    const story = this.stories.find(s => s.id === storyId);
    if (story && STATE.user) {
      if (!story.views.find(v => v.userId === STATE.user.id)) {
        story.views.push({
          userId: STATE.user.id,
          username: STATE.user.username,
          viewedAt: new Date().toISOString()
        });
        this.save();
      }
    }
  },

  // Story sil
  deleteStory(storyId) {
    const index = this.stories.findIndex(s => s.id === storyId);
    if (index > -1) {
      this.stories.splice(index, 1);
      this.save();
      showNotification('Story silindi', 'info');
    }
  },

  // Story'leri göster
  showStories() {
    const storiesContainer = document.getElementById('storiesContainer');
    if (!storiesContainer) return;

    storiesContainer.innerHTML = '';

    if (this.stories.length === 0) {
      storiesContainer.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:10px;">Henüz story yok</p>';
      return;
    }

    this.stories.forEach(story => {
      const storyEl = document.createElement('div');
      storyEl.className = 'story-item';
      storyEl.innerHTML = `
        <div class="story-header">
          <div class="story-avatar">${story.avatar || '😊'}</div>
          <div class="story-user-info">
            <span class="story-username">${story.username}</span>
            <span class="story-time">${DateUtils.formatRelative(story.timestamp)}</span>
          </div>
          ${story.userId === STATE.user?.id ? `<button class="btn btn-ghost btn-sm" onclick="StorySystem.deleteStory('${story.id}')">🗑️</button>` : ''}
        </div>
        <div class="story-content" onclick="StorySystem.viewStory('${story.id}')">
          ${story.type === 'text' ? `<p>${StringUtils.escape(story.content)}</p>` : ''}
          ${story.type === 'image' ? `<img src="${story.mediaUrl}" alt="Story" style="max-width:100%;border-radius:8px;">` : ''}
        </div>
        <div class="story-footer">
          <span class="story-views">👁️ ${story.views.length} görüntüleme</span>
        </div>
      `;
      storiesContainer.appendChild(storyEl);
    });
  }
};

// Story sistemi başlat
StorySystem.init();

// =====================================================
// AUTOMATIC BOT CONVERSATIONS
// =====================================================

function startChannelBotConversation(channelName) {
  if (!ROLE_BOT_MESSAGES[channelName]) return;

  const messages = ROLE_BOT_MESSAGES[channelName];
  let messageIndex = 0;

  const sendBotMessage = () => {
    if (messageIndex >= messages.length) return;

    const botMessage = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      roomId: channelName,
      userId: messages[messageIndex].userId,
      username: messages[messageIndex].username,
      avatar: messages[messageIndex].avatar || '🤖',
      content: messages[messageIndex].content,
      timestamp: new Date().toISOString(),
      type: 'text',
      edited: false,
      reactions: [],
      isBot: true
    };

    // Sadece aktif kanal ise mesajı göster
    if (STATE.currentRoom && STATE.currentRoom.id === channelName) {
      addMessageToUI(botMessage);
    }

    messageIndex++;

    // Sonraki mesaj için rastgele bekleme
    const delay = 3000 + Math.random() * 7000; // 3-10 saniye arası
    setTimeout(sendBotMessage, delay);
  };

  // İlk mesajı gönder
  setTimeout(sendBotMessage, 1000);
}

function startBotConversations() {
  // Tüm kanallar için bot konuşmalarını başlat
  const channels = ['genel', 'oyun', 'muzik', 'spor', 'teknoloji', 'sanat'];

  channels.forEach(channel => {
    if (channel !== 'genel') { // Genel kanal zaten başlatılmış
      setTimeout(() => startChannelBotConversation(channel), Math.random() * 5000);
    }
  });
}

// =====================================================

// Start live bot conversations
function startBotConversations() {
  if (botConversationInterval) {
    clearInterval(botConversationInterval);
  }

  // Send bot messages at random intervals (5-30 seconds)
  botConversationInterval = setInterval(() => {
    if (STATE.currentRoom && STATE.user) {
      sendRandomBotMessage();
    }
  }, Math.random() * 25000 + 5000);
}

// Stop bot conversations
function stopBotConversations() {
  if (botConversationInterval) {
    clearInterval(botConversationInterval);
    botConversationInterval = null;
  }
}

// Send a random bot message
function sendRandomBotMessage() {
  const roomId = STATE.currentRoom.id;
  const roomMessages = ROLE_BOT_MESSAGES[roomId] || ROLE_BOT_MESSAGES.genel;
  
  if (!roomMessages || roomMessages.length === 0) return;

  // Pick a random message
  const randomMsg = roomMessages[Math.floor(Math.random() * roomMessages.length)];
  
  // Check if this user recently sent a message (prevent spam)
  const now = Date.now();
  if (lastBotMessageTime[randomMsg.userId] && (now - lastBotMessageTime[randomMsg.userId]) < 15000) {
    return;
  }
  
  lastBotMessageTime[randomMsg.userId] = now;

  // Simulate typing first
  simulateTyping(randomMsg, () => {
    // Then send the message
    const message = {
      id: 'bot_' + Date.now() + '_' + Math.random(),
      userId: randomMsg.userId,
      username: randomMsg.username,
      avatar: randomMsg.avatar,
      content: randomMsg.content,
      timestamp: new Date(),
      edited: false,
      reactions: [],
      type: 'text'
    };

    handleNewMessage(message);
  });
}

// Simulate typing indicator before sending message
function simulateTyping(botMsg, callback) {
  const typingIndicator = document.getElementById('typingIndicator');
  if (typingIndicator) {
    typingIndicator.textContent = `${botMsg.username} yazıyor...`;
    typingIndicator.style.display = 'block';
    
    // Random typing delay (1-4 seconds)
    const typingDelay = Math.random() * 3000 + 1000;
    
    setTimeout(() => {
      typingIndicator.style.display = 'none';
      callback();
    }, typingDelay);
  } else {
    callback();
  }
}

// Add random user join/leave events
function startUserActivitySimulation() {
  setInterval(() => {
    if (STATE.currentRoom && STATE.user && Math.random() > 0.7) {
      const mockUser = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      if (mockUser.id !== STATE.user.id) {
        const action = Math.random() > 0.5 ? 'join' : 'leave';
        
        if (action === 'join' && !STATE.users.has(mockUser.id)) {
          STATE.users.set(mockUser.id, {
            id: mockUser.id,
            username: mockUser.username,
            avatar: mockUser.avatar,
            role: mockUser.role,
            status: 'Online',
            joinedAt: new Date()
          });
          handleUserJoined({
            userId: mockUser.id,
            username: mockUser.username,
            avatar: mockUser.avatar,
            role: mockUser.role
          });
        } else if (action === 'leave' && STATE.users.has(mockUser.id)) {
          const user = STATE.users.get(mockUser.id);
          STATE.users.delete(mockUser.id);
          handleUserLeft({
            userId: mockUser.id,
            username: mockUser.username
          });
        }
      }
    }
  }, 20000); // Check every 20 seconds
}

// =====================================================
// NOTIFICATION SYSTEM
// =====================================================

function showNotification(message, type = 'info', duration = 3000) {
  const container = document.getElementById('notification-container');
  if (!container) return;

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  const colors = {
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6'
  };
  
  notification.style.cssText = `
    background: ${colors[type] || colors.info};
    color: white;
    padding: 14px 20px;
    border-radius: 10px;
    margin-bottom: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideInRight 0.3s ease-out;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    font-size: 14px;
    font-weight: 500;
  `;
  
  notification.innerHTML = `
    <span>${message}</span>
    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;font-size:18px;cursor:pointer;opacity:0.7;">✕</button>
  `;
  
  container.appendChild(notification);
  
  if (duration > 0) {
    setTimeout(() => {
      notification.style.animation = 'slideOutRight 0.3s ease-in forwards';
      setTimeout(() => notification.remove(), 300);
    }, duration);
  }
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(100%); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideOutRight {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
  }
`;
document.head.appendChild(style);

// =====================================================
// BOT MESSAGING SYSTEM (Automatic conversations)
// =====================================================

let botMessageTimers = [];

function startBotMessaging() {
  // Clear existing timers
  botMessageTimers.forEach(timer => clearTimeout(timer));
  botMessageTimers = [];

  if (!STATE.currentRoom) return;

  const roomId = STATE.currentRoom.id;
  const botMessages = ROLE_BOT_MESSAGES[roomId];

  if (!botMessages) return;

  botMessages.forEach((botMsg, index) => {
    const timer = setTimeout(() => {
      if (STATE.currentRoom && STATE.currentRoom.id === roomId) {
        const message = {
          id: 'bot_' + Date.now() + '_' + index,
          userId: botMsg.userId,
          username: botMsg.username,
          avatar: botMsg.avatar,
          content: botMsg.content,
          timestamp: new Date(),
          type: 'text',
          reactions: []
        };

        if (!STATE.messages.has(roomId)) {
          STATE.messages.set(roomId, []);
        }

        STATE.messages.get(roomId).push(message);
        displayMessage(message);

        // Award XP to user for activity
        if (STATE.user) {
          addXP(LEVEL_CONFIG.messageXP);
        }
      }
    }, botMsg.delay);

    botMessageTimers.push(timer);
  });
}

function stopBotMessaging() {
  botMessageTimers.forEach(timer => clearTimeout(timer));
  botMessageTimers = [];
}

// =====================================================
// LEVEL / XP SYSTEM
// =====================================================

function getUserLevel(userId) {
  const userXP = StorageUtils.get(`user_xp_${userId}`) || 0;
  let level = 1;
  let requiredXP = LEVEL_CONFIG.baseXP;
  
  while (userXP >= requiredXP) {
    userXP - requiredXP;
    level++;
    requiredXP = Math.floor(requiredXP * LEVEL_CONFIG.multiplier);
  }
  
  return { level, xp: userXP, nextLevelXP: requiredXP };
}

function addXP(amount) {
  if (!STATE.user) return;
  
  const currentXP = StorageUtils.get(`user_xp_${STATE.user.id}`) || 0;
  const newXP = currentXP + amount;
  StorageUtils.set(`user_xp_${STATE.user.id}`, newXP);
  
  const { level, nextLevelXP } = getUserLevel(STATE.user.id);
  const progress = ((newXP % nextLevelXP) / nextLevelXP * 100).toFixed(0);
  
  Logger.log(`📊 XP: ${newXP} | Level: ${level} | Progress: ${progress}%`);
  
  // Check for level up rewards
  const levelRole = LEVEL_CONFIG.levelRoles[level];
  if (levelRole) {
    showNotification(`🎉 Tebrikler! Seviye ${level} ulaştınız: ${levelRole}`, 'success', 5000);
  }
}

function showUserLevel() {
  if (!STATE.user) return;
  
  const { level, xp, nextLevelXP } = getUserLevel(STATE.user.id);
  const progress = ((xp % nextLevelXP) / nextLevelXP * 100).toFixed(0);
  const levelRole = LEVEL_CONFIG.levelRoles[level] || '🌟 Yeni Üye';
  
  showNotification(`📊 Seviye ${level} - ${levelRole} | XP: ${xp} | İlerleme: ${progress}%`, 'info', 5000);
}

// =====================================================
// MESSAGE REACTIONS
// =====================================================

const REACTION_EMOJIS = ['👍', '👎', '❤️', '😂', '😮', '😢', '😡', '🎉'];

function addMessageReaction(messageId, emoji) {
  if (!STATE.user || !STATE.currentRoom) return;
  
  const messages = STATE.messages.get(STATE.currentRoom.id) || [];
  const message = messages.find(m => m.id === messageId);
  
  if (message) {
    if (!message.reactions) message.reactions = [];
    
    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    if (existingReaction) {
      if (existingReaction.users.includes(STATE.user.id)) {
        // Remove reaction
        existingReaction.users = existingReaction.users.filter(u => u !== STATE.user.id);
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r !== existingReaction);
        }
      } else {
        existingReaction.users.push(STATE.user.id);
      }
    } else {
      message.reactions.push({ emoji, users: [STATE.user.id] });
    }
    
    renderAllMessages();
  }
}

function displayMessageWithReactions(message) {
  const messagesDiv = document.getElementById('messages');
  if (!messagesDiv) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'message';
  msgEl.dataset.messageId = message.id;

  const timestamp = DateUtils.formatRelative(message.timestamp);
  const avatarHtml = avatarElementHtml(message.avatar || '👤', message.username);
  const isOwnMessage = message.userId === STATE.user?.id;

  // Build reactions HTML
  let reactionsHTML = '';
  if (message.reactions && message.reactions.length > 0) {
    reactionsHTML = '<div class="message-reactions">';
    message.reactions.forEach(reaction => {
      const isReacted = reaction.users.includes(STATE.user?.id);
      reactionsHTML += `
        <span class="reaction-btn ${isReacted ? 'reacted' : ''}" 
              onclick="addMessageReaction('${message.id}', '${reaction.emoji}')"
              title="${reaction.users.length} kişi">
          ${reaction.emoji} ${reaction.users.length}
        </span>
      `;
    });
    reactionsHTML += '</div>';
  }

  // Build reaction picker HTML
  let reactionPickerHTML = '<div class="reaction-picker" style="display:none;">';
  REACTION_EMOJIS.forEach(emoji => {
    reactionPickerHTML += `
      <span class="reaction-emoji" onclick="addMessageReaction('${message.id}', '${emoji}')">${emoji}</span>
    `;
  });
  reactionPickerHTML += '</div>';

  msgEl.innerHTML = `
    <div class="avatar" style="background:${getRoleColor(message.role)}" title="${message.username}">${avatarHtml}</div>
    <div class="msg-content">
      <div class="message-header">
        <span class="msg-user">${StringUtils.escape(message.username)}</span>
        <span class="badge" style="background:${getRoleColor(message.role)}">${getRoleName(message.role)}</span>
        <span class="message-time">${timestamp}</span>
        ${message.edited ? '<span class="edited-badge">düzenlendi</span>' : ''}
      </div>
      <div class="msg-text">${formatMessageContent(message.content)}</div>
      ${reactionsHTML}
      <div class="message-actions">
        <button class="msg-action" onclick="toggleReactionPicker('${message.id}')" title="Tepki ver">😊</button>
        ${isOwnMessage ? `
          <button class="msg-action" onclick="editMessage('${message.id}')" title="Düzenle">✏️</button>
          <button class="msg-action" onclick="deleteMessage('${message.id}')" title="Sil">🗑️</button>
        ` : ''}
      </div>
      ${reactionPickerHTML}
    </div>
  `;

  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

function toggleReactionPicker(messageId) {
  const msgEl = document.querySelector(`[data-message-id="${messageId}"]`);
  if (msgEl) {
    const picker = msgEl.querySelector('.reaction-picker');
    if (picker) {
      picker.style.display = picker.style.display === 'none' ? 'flex' : 'none';
    }
  }
}

// =====================================================
// DM (DIRECT MESSAGING) SYSTEM
// =====================================================

const DM_STATE = {
  conversations: new Map(),
  activeConversation: null,
  isOpen: false
};

function openDMPanel() {
  const dmPanel = document.getElementById('dmPanel');
  if (dmPanel) {
    dmPanel.classList.remove('hidden');
    DM_STATE.isOpen = true;
    loadDMConversations();
  }
}

function closeDMPanel() {
  const dmPanel = document.getElementById('dmPanel');
  if (dmPanel) {
    dmPanel.classList.add('hidden');
    DM_STATE.isOpen = false;
  }
}

function loadDMConversations() {
  const dmList = document.getElementById('dmList');
  if (!dmList) return;

  const conversations = StorageUtils.get('dm_conversations') || {};
  dmList.innerHTML = '';

  if (Object.keys(conversations).length === 0) {
    dmList.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Henüz DM yok. Kullanıcılara tıklayarak mesaj gönderin.</p>';
    return;
  }

  Object.entries(conversations).forEach(([userId, conv]) => {
    const convEl = document.createElement('div');
    convEl.className = 'dm-conversation';
    convEl.innerHTML = `
      <div class="dm-user-info" onclick="openDMConversation('${userId}')">
        <div class="dm-avatar">${avatarElementHtml(conv.avatar || '?', conv.username)}</div>
        <div class="dm-details">
          <div class="dm-username">${StringUtils.escape(conv.username)}</div>
          <div class="dm-preview">${StringUtils.truncate(conv.lastMessage, 30)}</div>
        </div>
        <div class="dm-time">${DateUtils.formatRelative(conv.lastMessageTime)}</div>
      </div>
    `;
    dmList.appendChild(convEl);
  });
}

function openDMConversation(userId) {
  const conversations = StorageUtils.get('dm_conversations') || {};
  const conv = conversations[userId];

  if (!conv) return;

  DM_STATE.activeConversation = userId;

  const dmMessages = document.getElementById('dmMessages');
  const dmHeader = document.getElementById('dmHeader');
  const dmInputArea = document.getElementById('dmInputArea');

  if (dmHeader) {
    dmHeader.textContent = `💬 ${conv.username}`;
  }

  if (dmMessages) {
    dmMessages.classList.remove('hidden');
    dmMessages.innerHTML = '';

    conv.messages.forEach(msg => {
      const msgEl = document.createElement('div');
      msgEl.className = `dm-message ${msg.senderId === STATE.user?.id ? 'own' : ''}`;
      msgEl.innerHTML = `
        <div class="dm-msg-text">${StringUtils.escape(msg.content)}</div>
        <div class="dm-msg-time">${DateUtils.formatRelative(msg.timestamp)}</div>
      `;
      dmMessages.appendChild(msgEl);
    });

    if (dmMessages.children.length === 0) {
      dmMessages.innerHTML = '<div style="color:var(--text-muted);font-size:12px;padding:8px;">Henüz mesaj yok</div>';
    }

    dmMessages.scrollTop = dmMessages.scrollHeight;
  }

  if (dmInputArea) {
    dmInputArea.classList.remove('hidden');
    const dmInput = document.getElementById('dmInput');
    if (dmInput) dmInput.focus();
  }
}

function sendDM(userId, content) {
  if (!STATE.user || !content.trim()) return;
  
  const conversations = StorageUtils.get('dm_conversations') || {};
  
  if (!conversations[userId]) {
    const targetUser = MOCK_USERS.find(u => u.id === userId);
    conversations[userId] = {
      userId,
      username: targetUser?.username || 'Bilinmeyen',
      avatar: targetUser?.avatar || '?',
      messages: [],
      lastMessage: '',
      lastMessageTime: new Date().toISOString()
    };
  }
  
  const message = {
    id: Date.now().toString(),
    senderId: STATE.user.id,
    content: content.trim(),
    timestamp: new Date().toISOString()
  };
  
  conversations[userId].messages.push(message);
  conversations[userId].lastMessage = content.trim();
  conversations[userId].lastMessageTime = new Date().toISOString();
  
  StorageUtils.set('dm_conversations', conversations);
  
  // Show notification
  showNotification(`📩 DM gönderildi: ${conversations[userId].username}`, 'success', 2000);
  
  // Refresh DM list
  loadDMConversations();
  
  // If conversation is open, show new message
  if (DM_STATE.activeConversation === userId) {
    openDMConversation(userId);
  }
}

// =====================================================
// ENHANCED GIF PICKER
// =====================================================

function showGifLibrary() {
  const gifPanel = document.getElementById('gifPanel');
  const resultsDiv = document.getElementById('gifResults');
  
  if (!gifPanel || !resultsDiv) return;
  
  gifPanel.classList.remove('hidden');
  
  // Show all GIFs
  resultsDiv.innerHTML = '';
  GIF_LIBRARY.forEach(gif => {
    const img = document.createElement('img');
    img.src = gif.url;
    img.style.cssText = 'width:100px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;margin:4px;transition:transform 0.2s;';
    img.onmouseover = () => img.style.transform = 'scale(1.1)';
    img.onmouseout = () => img.style.transform = 'scale(1)';
    img.onclick = () => {
      sendGif(gif.url);
      gifPanel.classList.add('hidden');
    };
    resultsDiv.appendChild(img);
  });
}

function sendGif(url) {
  if (!STATE.user || !STATE.currentRoom) return;

  const roomId = typeof STATE.currentRoom === 'string' ? STATE.currentRoom : STATE.currentRoom.id;
  const message = {
    id: 'gif_' + Date.now(),
    roomId: roomId,
    userId: STATE.user.id,
    username: STATE.user.username,
    avatar: STATE.user.avatar || '😀',
    content: url,
    timestamp: new Date().toISOString(),
    type: 'gif',
    edited: false,
    reactions: []
  };

  if (!STATE.messages.has(roomId)) {
    STATE.messages.set(roomId, []);
  }

  STATE.messages.get(roomId).push(message);
  addMessageToUI(message);
  showNotification('🎬 GIF gönderildi!', 'success', 2000);
}

// Override the existing searchGif function
function searchGif() {
  const query = document.getElementById('gifSearch').value.trim().toLowerCase();
  const resultsDiv = document.getElementById('gifResults');
  
  if (!query) {
    showGifLibrary();
    return;
  }

  if (resultsDiv) {
    resultsDiv.innerHTML = '';
    
    const filteredGifs = GIF_LIBRARY.filter(gif => 
      gif.tags.some(tag => tag.includes(query))
    );
    
    if (filteredGifs.length === 0) {
      resultsDiv.innerHTML = '<p style="color:#64748b;text-align:center;">Sonuç bulunamadı</p>';
      return;
    }
    
    filteredGifs.forEach(gif => {
      const img = document.createElement('img');
      img.src = gif.url;
      img.style.cssText = 'width:100px;height:80px;object-fit:cover;border-radius:8px;cursor:pointer;margin:4px;transition:transform 0.2s;';
      img.onmouseover = () => img.style.transform = 'scale(1.1)';
      img.onmouseout = () => img.style.transform = 'scale(1)';
      img.onclick = () => {
        sendGif(gif.url);
        document.getElementById('gifPanel').classList.add('hidden');
      };
      resultsDiv.appendChild(img);
    });
  }
}

// =====================================================
// SCREEN SHARING
// =====================================================

async function startScreenShare() {
  if (!STATE.user) {
    showNotification('Ekran paylaşımı için giriş yapmalısınız', 'warning');
    return;
  }

  try {
    const screenStream = await navigator.mediaDevices.getDisplayMedia({
      video: {
        cursor: 'always'
      },
      audio: true
    });

    STATE.localStream = screenStream;
    
    const videoPanel = document.getElementById('videoPanel');
    const videoElement = document.getElementById('localVideo');
    
    if (videoElement) {
      videoElement.srcObject = screenStream;
    }
    
    if (videoPanel) {
      videoPanel.innerHTML = `
        <h3>🖥️ Ekran Paylaşımı</h3>
        <p style="color:#10b981;">Ekranınız paylaşılıyor</p>
        <video id="localVideo" autoplay style="width:100%;height:200px;border-radius:var(--radius-md);background:#000;margin-top:10px;"></video>
        <button class="btn btn-danger" onclick="stopScreenShare()" style="width:100%;margin-top:10px;">⏹️ Paylaşımı Durdur</button>
      `;
    }

    // Handle stream end
    screenStream.getVideoTracks()[0].onended = () => {
      stopScreenShare();
    };

    showNotification('🖥️ Ekran paylaşımı başladı!', 'success', 3000);

  } catch (error) {
    Logger.error('❌ Ekran paylaşımı hatası', error);
    showNotification('Ekran paylaşımı reddedildi!', 'error');
  }
}

function stopScreenShare() {
  if (STATE.localStream) {
    STATE.localStream.getTracks().forEach(track => track.stop());
    STATE.localStream = null;
  }

  // Reset video panel
  const videoPanel = document.getElementById('videoPanel');
  if (videoPanel) {
    videoPanel.innerHTML = `
      <h3>📹 Video Sohbet</h3>
      <button class="btn btn-primary" onclick="startVideo()">📷 Kamerayı Başlat</button>
      <button class="btn btn-secondary" onclick="startScreenShare()">🖥️ Ekran Paylaş</button>
      <button class="btn btn-ghost" onclick="stopVideo()">⏹️ Durdur</button>
      <video id="localVideo" autoplay muted style="width:100%;height:200px;border-radius:var(--radius-md);background:#000;margin-top:10px;"></video>
    `;
  }

  showNotification('Ekran paylaşımı durduruldu', 'info');
}

// =====================================================
// UPDATE displayMessage TO USE REACTIONS
// =====================================================

// Override the existing displayMessage function to include reactions
const originalDisplayMessage = displayMessage;
displayMessage = function(message) {
  const messagesDiv = document.getElementById('messages');
  if (!messagesDiv) return;

  const msgEl = document.createElement('div');
  msgEl.className = 'message';
  msgEl.dataset.messageId = message.id;

  const timestamp = DateUtils.formatRelative(message.timestamp);
  const avatarHtml = avatarElementHtml(message.avatar || '👤', message.username);
  const isOwnMessage = message.userId === STATE.user?.id;

  // Build reactions HTML
  let reactionsHTML = '';
  if (message.reactions && message.reactions.length > 0) {
    reactionsHTML = '<div class="message-reactions">';
    message.reactions.forEach(reaction => {
      const isReacted = reaction.users.includes(STATE.user?.id);
      reactionsHTML += `
        <span class="reaction-btn ${isReacted ? 'reacted' : ''}" 
              onclick="addMessageReaction('${message.id}', '${reaction.emoji}')"
              title="${reaction.users.length} kişi">
          ${reaction.emoji} ${reaction.users.length}
        </span>
      `;
    });
    reactionsHTML += '</div>';
  }

  // Build reaction picker HTML
  let reactionPickerHTML = '<div class="reaction-picker" style="display:none;position:absolute;bottom:100%;left:0;background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:8px;padding:4px;gap:2px;z-index:100;">';
  REACTION_EMOJIS.forEach(emoji => {
    reactionPickerHTML += `
      <span class="reaction-emoji" onclick="addMessageReaction('${message.id}', '${emoji}');this.parentElement.style.display='none';" style="cursor:pointer;padding:4px;font-size:18px;">${emoji}</span>
    `;
  });
  reactionPickerHTML += '</div>';

  // Handle media messages
  let contentHTML = formatMessageContent(message.content);
  if (message.type === 'gif') {
    contentHTML = `<img src="${message.content}" style="max-width:300px;max-height:200px;border-radius:8px;cursor:pointer;" onclick="window.open(this.src)">`;
  } else if (message.type === 'image') {
    contentHTML = `<img src="${message.content}" style="max-width:320px;max-height:260px;border-radius:12px;cursor:pointer;" onclick="window.open(this.src)">`;
  } else if (message.type === 'video') {
    contentHTML = `<video controls style="max-width:320px;max-height:260px;border-radius:12px;display:block;"> <source src="${message.content}" type="video/mp4">Tarayıcınız video oynatmayı desteklemiyor.</video>`;
  } else if (message.type === 'audio') {
    contentHTML = `<audio controls style="width:100%;margin-top:8px;"><source src="${message.content}" type="audio/webm">Tarayıcınız ses oynatmayı desteklemiyor.</audio>`;
  }

  msgEl.innerHTML = `
    <div class="avatar" style="background:${getRoleColor(message.role)}" title="${message.username}">${avatarHtml}</div>
    <div class="msg-content" style="position:relative;">
      <div class="message-header">
        <span class="msg-user">${StringUtils.escape(message.username)}</span>
        <span class="badge" style="background:${getRoleColor(message.role)}">${getRoleName(message.role)}</span>
        <span class="message-time">${timestamp}</span>
        ${message.edited ? '<span class="edited-badge">düzenlendi</span>' : ''}
      </div>
      <div class="msg-text">${contentHTML}</div>
      ${reactionsHTML}
      <div class="message-actions">
        <button class="msg-action" onclick="toggleReactionPicker('${message.id}')" title="Tepki ver">😊</button>
        ${isOwnMessage ? `
          <button class="msg-action" onclick="editMessage('${message.id}')" title="Düzenle">✏️</button>
          <button class="msg-action" onclick="deleteMessage('${message.id}')" title="Sil">🗑️</button>
        ` : ''}
      </div>
      ${reactionPickerHTML}
    </div>
  `;

  messagesDiv.appendChild(msgEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
};

// =====================================================
// ADD DM BUTTON TO USER LIST
// =====================================================

function updateUserListWithDM() {
  const usersList = document.getElementById('userList');
  if (!usersList) return;

  if (STATE.users.size === 0) {
    // Demo users with DM button
    usersList.innerHTML = `
      <div class="user-item">
        <div class="user-avatar">${avatarElementHtml('https://i.pravatar.cc/150?img=65', 'admin')}</div>
        <div class="user-info">
          <div class="user-name">admin</div>
          <div class="user-status"><span class="status-dot" style="background:#10b981"></span> Online</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="openDMWithUser('1')" title="DM gönder">📩</button>
      </div>
      <div class="user-item">
        <div class="user-avatar">${avatarElementHtml('https://i.pravatar.cc/150?img=46', 'moderator')}</div>
        <div class="user-info">
          <div class="user-name">moderator</div>
          <div class="user-status"><span class="status-dot" style="background:#10b981"></span> Online</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="openDMWithUser('2')" title="DM gönder">📩</button>
      </div>
      <div class="user-item">
        <div class="user-avatar">${avatarElementHtml('https://i.pravatar.cc/150?img=32', 'user1')}</div>
        <div class="user-info">
          <div class="user-name">user1</div>
          <div class="user-status"><span class="status-dot" style="background:#f59e0b"></span> Boşta</div>
        </div>
        <button class="btn btn-ghost btn-sm" onclick="openDMWithUser('3')" title="DM gönder">📩</button>
      </div>
    `;
    return;
  }

  usersList.innerHTML = '';

  const onlineUsers = Array.from(STATE.users.values()).sort((a, b) => {
    if (a.status === 'Online' && b.status !== 'Online') return -1;
    if (a.status !== 'Online' && b.status === 'Online') return 1;
    return 0;
  });

  onlineUsers.forEach(user => {
    const userEl = document.createElement('div');
    userEl.className = 'user-item';
    userEl.innerHTML = `
      <div class="user-avatar">${avatarElementHtml(user.avatar, user.username)}</div>
      <div class="user-info">
        <div class="user-name">${StringUtils.escape(user.username)}</div>
        <div class="user-status">
          <span class="status-dot" style="background:${user.status === 'Online' ? '#10b981' : '#f59e0b'}"></span>
          ${user.status || 'Online'}
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" onclick="openDMWithUser('${user.id}')" title="DM gönder">📩</button>
    `;
    usersList.appendChild(userEl);
  });
}

function openDMWithUser(userId) {
  openDMPanel();
  openDMConversation(userId);
}

// =====================================================
// INITIALIZATION HOOKS
// =====================================================

// Override joinRoom to start bot messaging
const originalJoinRoom = joinRoom;
joinRoom = async function(roomId) {
  await originalJoinRoom(roomId);
  stopBotMessaging();
  startBotMessaging();
};

// Show user level on login
const originalShowChatScreen = showChatScreen;
showChatScreen = function() {
  originalShowChatScreen();
  if (STATE.user) {
    setTimeout(() => {
      showUserLevel();
    }, 2000);
  }
};

// Add CSS for new features
const extraStyles = document.createElement('style');
extraStyles.textContent = `
  .message-reactions {
    display: flex;
    gap: 4px;
    margin-top: 8px;
    flex-wrap: wrap;
  }
  
  .reaction-btn {
    padding: 2px 8px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .reaction-btn:hover {
    background: rgba(34, 211, 238, 0.2);
    border-color: var(--primary);
  }
  
  .reaction-btn.reacted {
    background: rgba(6, 182, 212, 0.3);
    border-color: var(--primary);
  }
  
  .reaction-emoji {
    padding: 4px;
    font-size: 18px;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .reaction-emoji:hover {
    transform: scale(1.3);
  }
  
  .dm-panel {
    position: fixed;
    right: 20px;
    top: 80px;
    width: 320px;
    height: calc(100vh - 100px);
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-xl);
    z-index: 150;
    display: flex;
    flex-direction: column;
  }
  
  .dm-panel.hidden {
    display: none;
  }
  
  .dm-header {
    padding: 16px;
    border-bottom: 1px solid var(--border-color);
    font-weight: 600;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .dm-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
  }
  
  .dm-conversation {
    padding: 12px;
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .dm-conversation:hover {
    background: rgba(34, 211, 238, 0.1);
  }
  
  .dm-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  
  .dm-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--primary);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  
  .dm-details {
    flex: 1;
    min-width: 0;
  }
  
  .dm-username {
    font-weight: 600;
    font-size: 14px;
  }
  
  .dm-preview {
    font-size: 12px;
    color: var(--text-muted);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  
  .dm-time {
    font-size: 11px;
    color: var(--text-muted);
  }
  
  .dm-messages {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .dm-message {
    max-width: 80%;
    padding: 8px 12px;
    border-radius: var(--radius-md);
    background: var(--bg-tertiary);
  }
  
  .dm-message.own {
    align-self: flex-end;
    background: var(--primary);
    color: white;
  }
  
  .dm-msg-text {
    font-size: 14px;
    word-break: break-word;
  }
  
  .dm-msg-time {
    font-size: 10px;
    opacity: 0.7;
    margin-top: 4px;
  }
  
  .dm-input-area {
    padding: 12px;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 8px;
  }
  
  .dm-input-area input {
    flex: 1;
    margin-bottom: 0;
  }
`;
document.head.appendChild(extraStyles);

// Add DM button to header
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const headerRight = document.querySelector('.header-right');
    if (headerRight) {
      const dmBtn = document.createElement('button');
      dmBtn.className = 'btn btn-ghost';
      dmBtn.id = 'dmToggleButton';
      dmBtn.title = 'Direkt Mesajlar';
      dmBtn.textContent = '📩';
      dmBtn.onclick = () => {
        const dmPanel = document.getElementById('dmPanel');
        if (dmPanel) {
          if (dmPanel.classList.contains('hidden')) {
            openDMPanel();
          } else {
            closeDMPanel();
          }
        } else {
          createDMPanel();
          openDMPanel();
        }
      };
      headerRight.insertBefore(dmBtn, headerRight.firstChild);
    }
  }, 100);
});

function createDMPanel() {
  const dmPanel = document.createElement('div');
  dmPanel.id = 'dmPanel';
  dmPanel.className = 'dm-panel hidden';
  dmPanel.innerHTML = `
    <div class="dm-header">
      <span id="dmHeader">📩 Direkt Mesajlar</span>
      <button class="btn btn-ghost btn-sm" onclick="closeDMPanel()">✕</button>
    </div>
    <div class="dm-list" id="dmList"></div>
    <div class="dm-messages hidden" id="dmMessages"></div>
    <div class="dm-input-area hidden" id="dmInputArea">
      <input type="text" id="dmInput" placeholder="Mesaj yaz...">
      <button class="btn btn-primary btn-sm" onclick="sendDMFromInput()">📤</button>
    </div>
  `;
  document.body.appendChild(dmPanel);
}

function sendDMFromInput() {
  const input = document.getElementById('dmInput');
  const content = input.value.trim();
  
  if (!content || !DM_STATE.activeConversation) return;
  
  sendDM(DM_STATE.activeConversation, content);
  input.value = '';
  
  // Auto-resize input
  input.style.height = '40px';
}

// Show typing indicator in DM
function showTypingInDM(userId, isTyping) {
  const dmMessages = document.getElementById('dmMessages');
  if (!dmMessages) return;
  
  const typingEl = dmMessages.querySelector('.dm-typing');
  if (isTyping) {
    if (!typingEl) {
      const typing = document.createElement('div');
      typing.className = 'dm-typing';
      typing.style.cssText = 'color: var(--text-muted); font-size: 12px; padding: 8px;';
      typing.textContent = '✍️ Yazıyor...';
      dmMessages.appendChild(typing);
    }
  } else {
    if (typingEl) typingEl.remove();
  }
}

// DM Emoji Picker
function toggleDMEmojiPicker() {
  const emojiBar = document.getElementById('dmEmojiBar');
  if (!emojiBar) {
    createDMEmojiBar();
    return;
  }
  emojiBar.classList.toggle('hidden');
}

function createDMEmojiBar() {
  const inputArea = document.getElementById('dmInputArea');
  if (!inputArea) return;

  const emojiBar = document.createElement('div');
  emojiBar.id = 'dmEmojiBar';
  emojiBar.className = 'emoji-bar';
  
  const emojis = ['😀', '😂', '😊', '😍', '🥰', '😘', '😉', '😎', '🤔', '😮', '😢', '😭', '😤', '😡', '🥺', '😴', '🤤', '😈', '👻', '💀', '👽', '🤖', '💯', '🔥', '⭐', '✨', '💫', '🎉', '🎊', '🎈', '🎁', '💝', '💖', '💕', '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💌', '💋', '💍', '💎'];
  
  emojis.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = 'emoji-btn';
    btn.textContent = emoji;
    btn.onclick = () => addEmojiToDM(emoji);
    emojiBar.appendChild(btn);
  });
  
  inputArea.appendChild(emojiBar);
}

function addEmojiToDM(emoji) {
  const input = document.getElementById('dmInput');
  if (input) {
    input.value += emoji;
    input.focus();
  }
}

// DM File Upload
function toggleDMFileUpload() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*,video/*,.pdf';
  input.onchange = (e) => handleDMFileUpload(e.target.files[0]);
  input.click();
}

function handleDMFileUpload(file) {
  if (!file || !DM_STATE.activeConversation) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = `[Dosya: ${file.name}]`;
    sendDM(DM_STATE.activeConversation, content);
    showNotification('📎 Dosya DM\'ye gönderildi!', 'success', 2000);
  };
  reader.readAsDataURL(file);
}

// Profile Modal Functions
function showUserProfile(userId) {
  const user = MOCK_USERS.find(u => u.id === userId) || STATE.users.get(userId);
  if (!user) return;

  const modal = document.getElementById('profileModal');
  const body = document.getElementById('profileModalBody');
  
  if (!modal || !body) return;

  // Calculate user stats
  const messagesSent = Math.floor(Math.random() * 500) + 50;
  const joinDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  const lastSeen = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000);

  body.innerHTML = `
    <div class="profile-avatar">${user.avatar}</div>
    <div class="profile-name">${user.username}</div>
    <div class="profile-role">${getRoleName(user.role)}</div>
    
    <div class="profile-stats">
      <div class="profile-stat">
        <span class="profile-stat-number">${messagesSent}</span>
        <span class="profile-stat-label">Mesaj</span>
      </div>
      <div class="profile-stat">
        <span class="profile-stat-number">${Math.floor(Math.random() * 50) + 1}</span>
        <span class="profile-stat-label">Rozet</span>
      </div>
      <div class="profile-stat">
        <span class="profile-stat-number">${Math.floor(Math.random() * 100) + 1}</span>
        <span class="profile-stat-label">XP</span>
      </div>
    </div>

    <div class="profile-bio">
      <h4>📅 Katılma Tarihi</h4>
      <p>${joinDate.toLocaleDateString('tr-TR')}</p>
      
      <h4>🟢 Son Görülme</h4>
      <p>${lastSeen.toLocaleString('tr-TR')}</p>
      
      <h4>🎯 İlgi Alanları</h4>
      <p>${user.favorites ? user.favorites.join(', ') : 'Henüz belirtilmemiş'}</p>
    </div>

    <div class="profile-actions">
      <button class="btn btn-primary" onclick="openDM('${user.id}')">💬 Mesaj Gönder</button>
      <button class="btn btn-ghost" onclick="closeProfileModal()">Kapat</button>
    </div>
  `;

  modal.classList.remove('hidden');
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function openDM(userId) {
  closeProfileModal();
  // Open DM panel and start conversation
  openDMPanel();
  openDMConversation(userId);
}

// Message Search Functions
function searchMessages() {
  const query = document.getElementById('searchInput').value.trim().toLowerCase();
  const messages = document.querySelectorAll('.message');
  
  if (!query) {
    clearSearch();
    return;
  }

  messages.forEach(msg => {
    const text = msg.textContent.toLowerCase();
    if (text.includes(query)) {
      msg.style.background = 'rgba(34, 211, 238, 0.1)';
      msg.style.borderLeft = '3px solid var(--primary)';
      msg.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      msg.style.background = '';
      msg.style.borderLeft = '';
    }
  });
  
  showNotification(`"${query}" için arama sonuçları gösteriliyor`, 'info', 2000);
}

function clearSearch() {
  document.getElementById('searchInput').value = '';
  const messages = document.querySelectorAll('.message');
  messages.forEach(msg => {
    msg.style.background = '';
    msg.style.borderLeft = '';
  });
}

// Update user count display
function updateUserCount() {
  const userCount = document.getElementById('userCount');
  const onlineUsers = STATE.users.size;
  
  if (userCount) {
    userCount.textContent = `(${onlineUsers})`;
    userCount.style.background = onlineUsers > 0 ? 'var(--success)' : 'var(--text-muted)';
  }
}

// =====================================================
// MISSING UI FUNCTIONS
// =====================================================

function toggleUserMenu() {
  const userMenu = document.getElementById('userMenu');
  if (userMenu) {
    userMenu.classList.toggle('hidden');
  } else {
    showNotification('Kullanıcı menüsü bulunamadı', 'warning');
  }
}

function switchServer(serverId) {
  const serverItems = document.querySelectorAll('.server-item');
  serverItems.forEach(item => item.classList.remove('active'));
  
  const activeItem = document.querySelector(`.server-item[onclick*="${serverId}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }
  
  showNotification(`Sunucu değiştirildi: ${serverId}`, 'info', 1500);
}

function toggleChannels() {
  const channelsList = document.querySelector('.channels-list');
  if (channelsList) {
    channelsList.classList.toggle('hidden');
  }
}

function showVoicePanel() {
  const voicePanel = document.getElementById('voicePanel');
  if (voicePanel) {
    voicePanel.classList.remove('hidden');
  } else {
    showNotification('Sesli sohbet paneli bulunamadı', 'warning');
  }
}
