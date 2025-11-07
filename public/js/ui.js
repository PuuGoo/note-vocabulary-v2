// =====================================================
// VocaPro - UI JavaScript Behaviors
// =====================================================

// =====================================================
// 1. Theme Management
// =====================================================

const Theme = {
  get current() {
    return localStorage.getItem('theme') || 'dark';
  },

  set(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  },

  toggle() {
    const newTheme = this.current === 'dark' ? 'light' : 'dark';
    this.set(newTheme);
    Toasts.show('Theme changed', `Switched to ${newTheme} mode`, 'info');
  },

  init() {
    this.set(this.current);
  },
};

// =====================================================
// 2. Toast Notifications
// =====================================================

const Toasts = {
  container: null,
  queue: [],
  maxToasts: 5,

  init() {
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(title, message, type = 'info', duration = 4000) {
    this.init();

    const icons = {
      success: '✓',
      error: '✕',
      warning: '⚠',
      info: 'ℹ',
    };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || icons.info}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        <div class="toast-message">${message}</div>
      </div>
    `;

    this.container.appendChild(toast);
    this.queue.push(toast);

    // Remove oldest if exceeding max
    if (this.queue.length > this.maxToasts) {
      const oldest = this.queue.shift();
      oldest?.remove();
    }

    // Auto dismiss
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => {
        toast.remove();
        this.queue = this.queue.filter((t) => t !== toast);
      }, 300);
    }, duration);
  },
};

// =====================================================
// 3. Modal Management
// =====================================================

const Modal = {
  open(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';

      // Focus trap
      const modal = overlay.querySelector('.modal');
      const focusableElements = modal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      firstFocusable?.focus();

      // Handle Tab key for focus trap
      const handleTab = (e) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            if (document.activeElement === firstFocusable) {
              lastFocusable?.focus();
              e.preventDefault();
            }
          } else {
            if (document.activeElement === lastFocusable) {
              firstFocusable?.focus();
              e.preventDefault();
            }
          }
        }
      };

      modal.addEventListener('keydown', handleTab);
      overlay._handleTab = handleTab;
    }
  },

  close(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';

      // Remove focus trap listener
      const modal = overlay.querySelector('.modal');
      if (overlay._handleTab) {
        modal.removeEventListener('keydown', overlay._handleTab);
      }
    }
  },

  init() {
    // Close modal on overlay click
    document.querySelectorAll('.modal-overlay').forEach((overlay) => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close(overlay.id);
        }
      });
    });

    // Close modal on close button click
    document.querySelectorAll('.modal-close').forEach((btn) => {
      btn.addEventListener('click', () => {
        const overlay = btn.closest('.modal-overlay');
        if (overlay) {
          this.close(overlay.id);
        }
      });
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
          this.close(activeModal.id);
        }
      }
    });
  },
};

// =====================================================
// 4. Tabs Management
// =====================================================

function initTabs() {
  document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      const tabGroup = tab.closest('.tabs');
      const panelContainer = tabGroup.nextElementSibling;

      // Update tabs
      tabGroup.querySelectorAll('[data-tab]').forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      // Update panels
      if (panelContainer) {
        panelContainer.querySelectorAll('.tab-panel').forEach((p) => {
          p.classList.remove('active');
        });
        const targetPanel = document.getElementById(targetId);
        if (targetPanel) {
          targetPanel.classList.add('active');
        }
      }
    });
  });
}

// =====================================================
// 5. Ripple Effect
// =====================================================

function enableRipples() {
  document.querySelectorAll('.btn, .tab').forEach((element) => {
    element.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;

      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.5)';
      ripple.style.transform = 'scale(0)';
      ripple.style.animation = 'ripple 0.6s ease-out';
      ripple.style.pointerEvents = 'none';

      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);

      setTimeout(() => ripple.remove(), 600);
    });
  });
}

// Add ripple animation to CSS dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes ripple {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// =====================================================
// 6. Progress Bar
// =====================================================

function updateProgress(percent, progressBarId = 'progressBar') {
  const progressBar = document.getElementById(progressBarId);
  if (progressBar) {
    progressBar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }
}

// =====================================================
// 7. Drag & Drop
// =====================================================

function initDragDrop(dropZoneId, fileInputId, callback) {
  const dropZone = document.getElementById(dropZoneId);
  const fileInput = document.getElementById(fileInputId);

  if (!dropZone || !fileInput) {
    console.log('initDragDrop: Elements not found', dropZoneId, fileInputId);
    return;
  }

  // Check if already initialized to prevent duplicate listeners
  if (dropZone.dataset.initialized === 'true') {
    console.log('initDragDrop: Already initialized, updating callback only');
    // Update the callback reference
    dropZone._importCallback = callback;
    return;
  }

  console.log('initDragDrop: Setting up listeners');

  // Store callback reference
  dropZone._importCallback = callback;

  // Click to select
  dropZone.addEventListener('click', () => {
    console.log('Drop zone clicked, opening file input');
    fileInput.click();
  });

  // Drag events
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, () => {
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      fileInput.files = files;
      handleFiles(files);
    }
  });

  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  function handleFiles(files) {
    if (files.length > 0) {
      dropZone.classList.add('has-file');
      const fileName = files[0].name;
      const textElement = dropZone.querySelector('.drop-zone-text');
      if (textElement) {
        textElement.textContent = `Selected: ${fileName}`;
      }
      // Use stored callback reference
      if (dropZone._importCallback) {
        console.log('Calling import callback with file:', fileName);
        dropZone._importCallback(files);
      }
    }
  }

  // Mark as initialized
  dropZone.dataset.initialized = 'true';
  console.log('initDragDrop: Initialization complete');
}

// =====================================================
// 8. Keyboard Shortcuts
// =====================================================

function initKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Alt + D: Toggle theme
    if (e.altKey && e.key === 'd') {
      e.preventDefault();
      Theme.toggle();
    }

    // Alt + S: Focus search
    if (e.altKey && e.key === 's') {
      e.preventDefault();
      const searchInput =
        document.getElementById('searchButton') || document.querySelector('input[type="search"]');
      searchInput?.focus();
    }

    // Ctrl + K: Open command palette (placeholder)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      Toasts.show('Command Palette', 'Feature coming soon!', 'info');
    }
  });
}

// =====================================================
// 9. Clock (for dashboard)
// =====================================================

function initClock(clockId = 'clock') {
  const clockElement = document.getElementById(clockId);
  if (!clockElement) return;

  function updateClock() {
    const now = new Date();
    const options = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    clockElement.textContent = now.toLocaleDateString('en-US', options);
  }

  updateClock();
  setInterval(updateClock, 60000); // Update every minute
}

// =====================================================
// 10. API Helper
// =====================================================

const API = {
  async request(url, options = {}) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      Toasts.show('Error', error.message, 'error');
      throw error;
    }
  },

  get(url) {
    return this.request(url, { method: 'GET' });
  },

  post(url, body) {
    return this.request(url, { method: 'POST', body: JSON.stringify(body) });
  },

  put(url, body) {
    return this.request(url, { method: 'PUT', body: JSON.stringify(body) });
  },

  delete(url) {
    return this.request(url, { method: 'DELETE' });
  },
};

// =====================================================
// 11. Form Validation Helper
// =====================================================

function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return false;

  const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
  let isValid = true;

  inputs.forEach((input) => {
    if (!input.value.trim()) {
      isValid = false;
      input.style.borderColor = '#f45c43';
    } else {
      input.style.borderColor = '';
    }
  });

  if (!isValid) {
    Toasts.show('Validation Error', 'Please fill in all required fields', 'error');
  }

  return isValid;
}

// =====================================================
// 12. Debounce Utility
// =====================================================

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

// =====================================================
// 13. Initialize All Components
// =====================================================

function initializeUI() {
  Theme.init();
  Modal.init();
  initTabs();
  enableRipples();
  initKeyboardShortcuts();
  initClock();

  console.log('✨ VocaPro UI initialized');
}

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeUI);
} else {
  initializeUI();
}

// Export for use in other scripts
window.VocaPro = {
  Theme,
  Toasts,
  Modal,
  API,
  initTabs,
  enableRipples,
  updateProgress,
  initDragDrop,
  initKeyboardShortcuts,
  initClock,
  validateForm,
  debounce,
};
