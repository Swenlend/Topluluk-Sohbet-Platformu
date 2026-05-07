// Dosya upload ve drag-drop işlemleri
let dropArea = null;

window.addEventListener('load', () => {
  // DOM tamamen yüklendikten sonra setup yap
  setTimeout(() => {
    dropArea = document.getElementById('messages');
    if (dropArea) {
      setupDragDrop();
    }
  }, 100);
});

function setupDragDrop() {
  if (!dropArea) return;

  dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.style.background = 'rgba(34, 211, 238, 0.1)';
    dropArea.style.borderColor = '#22d3ee';
  });

  dropArea.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropArea.style.background = '';
    dropArea.style.borderColor = '';
  });

  dropArea.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropArea.style.background = '';
    dropArea.style.borderColor = '';

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  });
}

function handleFiles(files) {
  const file = files[0];

  if (!file) return;

  // Dosya boyutu kontrolü (10MB)
  if (file.size > 10 * 1024 * 1024) {
    showNotification('Dosya çok büyük (Max 10MB)', 'error');
    return;
  }

  // Dosya türü kontrolü
  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'application/pdf'];
  if (!validTypes.includes(file.type)) {
    showNotification('Bu dosya türü desteklenmiyor', 'error');
    return;
  }

  // Yerel olarak göster (Socket.io olmadan)
  const reader = new FileReader();

  reader.onload = (e) => {
    const fileData = e.target.result;
    const fileName = file.name;
    const fileType = file.type;

    if (fileType.startsWith('image/')) {
      messageInput.value += `\n📸 [Resim: ${fileName}]`;
    } else if (fileType.startsWith('video/')) {
      messageInput.value += `\n🎬 [Video: ${fileName}]`;
    } else if (fileType === 'application/pdf') {
      messageInput.value += `\n📄 [PDF: ${fileName}]`;
    }

    showNotification(`📎 "${fileName}" dosyası eklendi!`, 'success');
  };

  reader.onerror = () => {
    showNotification('Dosya okuma hatası', 'error');
  };

  reader.readAsDataURL(file);
}

// File input event listener
document.addEventListener('change', (e) => {
  if (e.target.id === 'fileInput') {
    handleFiles(e.target.files);
  }
});
