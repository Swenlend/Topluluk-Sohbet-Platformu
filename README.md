# 💬 Topluluk Sohbet Platformu

Modern, tarayıcı tabanlı ve kurulumsuz çalışan gelişmiş bir topluluk sohbet uygulaması.  
Tamamen **HTML + CSS + JavaScript** ile geliştirilmiştir. Backend olmadan demo amacıyla çalışır.

> ⚠️ **Not:** Bu proje bir *frontend demo* çalışmasıdır. Gerçek üretim ortamı için sunucu altyapısı gereklidir.

---

## 🚀 Öne Çıkan Özellikler

### 👤 Kullanıcı Sistemi
- E‑posta + şifre ile kayıt ve giriş
- İstemci tarafı parola hashleme (SHA‑256)
- Oturum token sistemi (sessionStorage)
- Profil fotoğrafı yükleme
- Kullanıcı seviyesi ve XP sistemi
- Arkadaş ekleme ve takipçi yapısı
- Admin kullanıcı rolü

### 💬 Sohbet Özellikleri
- Kategori bazlı sohbet odaları
- Özel mesajlaşma (DM)
- Gerçek zamanlı his (BroadcastChannel sekme senkronizasyonu)
- Mesaj düzenleme & silme
- Emoji seçici
- Enter ile hızlı gönderim

### 🖼️ Medya Özellikleri
- Görsel ve video gönderme
- Hikaye (Story) paylaşma
- 24 saat sonra kaybolan hikayeler

### 🔔 Bildirimler
- Tarayıcı bildirim sistemi
- Yeni oda mesajı bildirimi
- Yeni DM bildirimi
- Seviye atlama bildirimi

### 🎙️ Sesli & Görüntülü Sohbet (Demo)
- Basit grup video odası
- Sesli sohbet başlatma
- Görüntülü sohbet başlatma

### 🎨 Arayüz & Deneyim
- Modern ve profesyonel UI tasarım
- Responsive (mobil uyumlu) yapı
- Koyu / Açık tema desteği
- Tema renklerini özelleştirme
- Kart tabanlı düzen

### 🛠️ Yönetim Özellikleri
- Admin paneli
- Tüm mesajları silme
- Tüm kullanıcıları silme

### 💾 Veri Saklama
- localStorage tabanlı veri saklama
- Mesaj geçmişi korunur
- DM kayıtları korunur
- Hikayeler saklanır

### 📱 PWA Desteği
- Service Worker ile mobil uygulama benzeri kullanım

---

## 🧱 Kullanılan Teknolojiler

| Teknoloji            | Amaç                                |
| -------------------- | ----------------------------------- |
| HTML5                | Uygulama iskeleti                   |
| CSS3                 | Modern ve responsive tasarım        |
| Vanilla JavaScript   | Tüm uygulama mantığı                |
| Web Crypto API       | Şifre hashleme                      |
| BroadcastChannel API | Sekmeler arası canlı senkronizasyon |
| WebRTC               | Sesli & görüntülü iletişim (demo)   |
| Notifications API    | Tarayıcı bildirimleri               |
| MediaDevices API     | Kamera & mikrofon erişimi           |
| localStorage         | İstemci tarafı veri tabanı          |
| Service Worker       | PWA desteği                         |

🧪 Demo Hesap

İlk kayıt olan kullanıcı otomatik olarak admin olur.

🔐 Güvenlik Notları (Demo Seviyesi)

Bu proje eğitim ve demo amaçlıdır. Gerçek güvenlik sağlamaz.

Eksikler

Sunucu tarafı kimlik doğrulama yok

JWT doğrulama yok

Veritabanı yok

Socket tabanlı gerçek zamanlı altyapı yok

Uçtan uca şifreleme yok

Üretim İçin Önerilen Stack

Node.js

Express.js

Socket.io

MongoDB / PostgreSQL

JWT

bcrypt

HTTPS

🎯 Yol Haritası (Roadmap)

Gerçek zamanlı socket altyapısı

Mesajlaşma performans optimizasyonu

Grup sohbet odaları

Mesajlara emoji reaksiyonları

Çevrimiçi / çevrimdışı durumu

Push notification (mobil)

Dosya yükleme limiti ve optimizasyon

Kullanıcı engelleme sistemi

İçerik moderasyon araçları

🤝 Katkıda Bulunma

Katkılar memnuniyetle karşılanır.

Fork oluştur

Feature branch aç

Commit at

Pull Request gönder

📄 Lisans

MIT License

👨‍💻 Geliştirici Notu

Kaynak: ChatGPT


