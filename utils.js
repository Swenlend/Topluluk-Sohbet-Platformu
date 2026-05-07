/**
 * Utility Functions - Profesyonel Sohbet Platformu
 * Genel yardımcı fonksiyonlar ve validasyonlar
 */

// =====================================================
// VALIDATION UTILITIES
// =====================================================

const Validators = {
  // Email validasyonu
  email: (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Username validasyonu
  username: (username) => {
    if (!username || username.length < 2 || username.length > 20) return false;
    return /^[a-zA-Z0-9_]+$/.test(username);
  },

  // Password validasyonu (guçlü)
  password: (password) => {
    if (password.length < 6) return false;
    // En az bir büyük harf, bir küçük harf, bir rakam içermeli
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    return hasUpperCase && hasLowerCase && hasNumbers;
  },

  // Şifre strength kontrolü
  passwordStrength: (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;
    return Math.min(strength, 5); // 0-5 arası
  },

  // URL validasyonu
  url: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Telefon validasyonu (Turkish)
  phone: (phone) => {
    return /^(\+90|0)?[1-9]\d{9}$/.test(phone.replace(/\s/g, ''));
  }
};

// =====================================================
// STRING UTILITIES
// =====================================================

const StringUtils = {
  // HTML escape işlemi (XSS koruması)
  escape: (str) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return str.replace(/[&<>"']/g, m => map[m]);
  },

  // HTML unescape
  unescape: (str) => {
    const map = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#039;': "'"
    };
    return str.replace(/&amp;|&lt;|&gt;|&quot;|&#039;/g, m => map[m]);
  },

  // URL encode
  urlEncode: (str) => encodeURIComponent(str),

  // URL decode
  urlDecode: (str) => decodeURIComponent(str),

  // Capitalize
  capitalize: (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(),

  // Truncate metni
  truncate: (str, length, suffix = '...') => {
    if (str.length <= length) return str;
    return str.slice(0, length - suffix.length) + suffix;
  },

  // Slug oluştur
  slug: (str) => {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^\-+|\-+$/g, '');
  },

  // Random string
  random: (length = 8) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
};

// =====================================================
// DATE/TIME UTILITIES
// =====================================================

const DateUtils = {
  // Türkçe tarihe formatla
  formatTR: (date) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('tr-TR', options);
  },

  // Göreceli zaman (1 dakika önce, 2 saat önce vs)
  formatRelative: (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    if (seconds < 60) return 'Şimdi';
    if (seconds < 3600) return Math.floor(seconds / 60) + ' dakika önce';
    if (seconds < 86400) return Math.floor(seconds / 3600) + ' saat önce';
    if (seconds < 604800) return Math.floor(seconds / 86400) + ' gün önce';
    return new Date(date).toLocaleDateString('tr-TR');
  },

  // ISO string'e çevir
  toISO: (date) => new Date(date).toISOString(),

  // Timestamp'ten tarih yap
  fromTimestamp: (timestamp) => new Date(timestamp),

  // Tarihleri karşılaştır
  compare: (date1, date2) => new Date(date1) - new Date(date2)
};

// =====================================================
// STORAGE UTILITIES (localStorage wrapper)
// =====================================================

const StorageUtils = {
  // Veri kaydet (auto stringify)
  set: (key, value, ttl = null) => {
    const data = {
      value: value,
      timestamp: Date.now(),
      ttl: ttl
    };
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch {
      console.warn('Storage quota exceeded');
      return false;
    }
  },

  // Veri getir (auto parse)
  get: (key) => {
    try {
      const data = JSON.parse(localStorage.getItem(key));
      if (!data) return null;

      // TTL kontrolü
      if (data.ttl && (Date.now() - data.timestamp) > data.ttl) {
        localStorage.removeItem(key);
        return null;
      }

      return data.value;
    } catch {
      return null;
    }
  },

  // Veri sil
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  // Hepsi sil
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },

  // Anahtar var mı?
  has: (key) => localStorage.getItem(key) !== null
};

// =====================================================
// API UTILITIES
// =====================================================

const APIClient = {
  baseURL: '/api',
  timeout: 30000,

  // Headers oluştur
  getHeaders: () => {
    const token = StorageUtils.get('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  },

  // GET request
  get: async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${APIClient.baseURL}${endpoint}`, {
        method: 'GET',
        headers: APIClient.getHeaders(),
        ...options
      });
      return await APIClient.handleResponse(response);
    } catch (error) {
      return { error: error.message };
    }
  },

  // POST request
  post: async (endpoint, data, options = {}) => {
    try {
      const response = await fetch(`${APIClient.baseURL}${endpoint}`, {
        method: 'POST',
        headers: APIClient.getHeaders(),
        body: JSON.stringify(data),
        ...options
      });
      return await APIClient.handleResponse(response);
    } catch (error) {
      return { error: error.message };
    }
  },

  // PUT request
  put: async (endpoint, data, options = {}) => {
    try {
      const response = await fetch(`${APIClient.baseURL}${endpoint}`, {
        method: 'PUT',
        headers: APIClient.getHeaders(),
        body: JSON.stringify(data),
        ...options
      });
      return await APIClient.handleResponse(response);
    } catch (error) {
      return { error: error.message };
    }
  },

  // DELETE request
  delete: async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${APIClient.baseURL}${endpoint}`, {
        method: 'DELETE',
        headers: APIClient.getHeaders(),
        ...options
      });
      return await APIClient.handleResponse(response);
    } catch (error) {
      return { error: error.message };
    }
  },

  // Response handle
  handleResponse: async (response) => {
    const data = await response.json();
    if (!response.ok) {
      return { error: data.message || 'Server hatası', status: response.status };
    }
    return data;
  }
};

// =====================================================
// DOM UTILITIES
// =====================================================

const DOMUtils = {
  // Element seçimi (selector)
  $(selector) {
    return document.querySelector(selector);
  },

  // Tüm elementleri seçimi
  $$(selector) {
    return document.querySelectorAll(selector);
  },

  // Class ekle/sil/toggle
  addClass: (el, className) => el.classList.add(className),
  removeClass: (el, className) => el.classList.remove(className),
  toggleClass: (el, className) => el.classList.toggle(className),

  // Attribute işlemleri
  setAttr: (el, attr, value) => el.setAttribute(attr, value),
  getAttr: (el, attr) => el.getAttribute(attr),
  removeAttr: (el, attr) => el.removeAttribute(attr),

  // Text/HTML
  // textContent otomatik escape yaptığı için StringUtils.escape'e gerek yok.
  setText: (el, text) => el.textContent = text,
  getText: (el) => el.textContent,
  setHTML: (el, html) => el.innerHTML = html,
  getHTML: (el) => el.innerHTML,

  // Show/Hide
  show: (el) => el.style.display = '',
  hide: (el) => el.style.display = 'none',
  toggle: (el) => el.style.display = el.style.display === 'none' ? '' : 'none',

  // Remove element
  remove: (el) => el.remove(),

  // Event listeners
  on: (el, event, callback) => el.addEventListener(event, callback),
  off: (el, event, callback) => el.removeEventListener(event, callback),
  once: (el, event, callback) => el.addEventListener(event, callback, { once: true }),

  // Parent bulma
  closest: (el, selector) => el.closest(selector),

  // Position/Size
  getPosition: (el) => ({
    top: el.offsetTop,
    left: el.offsetLeft,
    width: el.offsetWidth,
    height: el.offsetHeight
  })
};

// =====================================================
// NOTIFICATION SYSTEM (Professional)
// =====================================================

const NotificationManager = {
  container: null,

  init: () => {
    if (!NotificationManager.container) {
      NotificationManager.container = document.createElement('div');
      NotificationManager.container.id = 'notification-container';
      NotificationManager.container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        max-width: 400px;
      `;
      document.body.appendChild(NotificationManager.container);
    }
  },

  show: (message, type = 'info', duration = 5000) => {
    NotificationManager.init();

    const notification = document.createElement('div');
    const bgColor = {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6'
    }[type] || '#3b82f6';

    notification.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      animation: slideIn 0.3s ease-out;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 300px;
    `;

    const text = document.createElement('span');
    text.textContent = message;
    notification.appendChild(text);

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '✕';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      margin-left: 10px;
    `;
    closeBtn.onclick = () => notification.remove();
    notification.appendChild(closeBtn);

    NotificationManager.container.appendChild(notification);

    if (duration > 0) {
      setTimeout(() => notification.remove(), duration);
    }
  }
};

// =====================================================
// LOADING SPINNER
// =====================================================

const LoadingSpinner = {
  create: (text = 'Yükleniyor...') => {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;

    const spinner = document.createElement('div');
    spinner.style.cssText = `
      background: white;
      padding: 40px;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    `;

    const dot = document.createElement('div');
    dot.style.cssText = `
      width: 50px;
      height: 50px;
      margin: 0 auto 20px;
      border: 4px solid #f3f4f6;
      border-top: 4px solid #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    `;

    const textLabel = document.createElement('p');
    textLabel.textContent = text;
    textLabel.style.color = '#6b7280';

    spinner.appendChild(dot);
    spinner.appendChild(textLabel);
    overlay.appendChild(spinner);

    return overlay;
  }
};

// =====================================================
// COOKIE UTILITIES
// =====================================================

const CookieUtils = {
  set: (name, value, days = 7) => {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    const expires = 'expires=' + date.toUTCString();
    document.cookie = name + '=' + encodeURIComponent(value) + ';' + expires + ';path=/';
  },

  get: (name) => {
    const nameEQ = name + '=';
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return decodeURIComponent(cookie.substring(nameEQ.length));
      }
    }
    return null;
  },

  remove: (name) => {
    CookieUtils.set(name, '', -1);
  }
};

// =====================================================
// DEBOUNCE & THROTTLE
// =====================================================

const FunctionUtils = {
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }
};

// Console styling
const Logger = {
  log: (message, data = null) => {
    console.log(`%c[ℹ] ${message}`, 'color: #3b82f6; font-weight: bold;', data);
  },

  success: (message, data = null) => {
    console.log(`%c[✓] ${message}`, 'color: #10b981; font-weight: bold;', data);
  },

  error: (message, data = null) => {
    console.error(`%c[✕] ${message}`, 'color: #ef4444; font-weight: bold;', data);
  },

  warning: (message, data = null) => {
    console.warn(`%c[!] ${message}`, 'color: #f59e0b; font-weight: bold;', data);
  }
};
