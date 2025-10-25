// Vibe Diary App JavaScript

// Data structures
const MOODS = [
    { emoji: '😄', label: 'Slay', value: 'excellent' },
    { emoji: '😊', label: '+ Vibe', value: 'good' },
    { emoji: '😐', label: 'Mid', value: 'okay' },
    { emoji: '😔', label: 'Sad boi hours', value: 'sad' },
    { emoji: '😫', label: 'Burnt out', value: 'tired' },
    { emoji: '😤', label: 'Big mad', value: 'annoyed' },
    { emoji: '😰', label: 'Anxiety era', value: 'anxious' },
    { emoji: '🔥', label: 'Main character energy', value: 'onfire' }
];

// App state (stored in memory)
const appState = {
    vibes: [],
    selectedMood: null,
    currentView: 'home',
    currentPeriod: 'week',
    deleteTarget: null
};

// localStorage keys
const STORAGE_KEYS = {
    VIBES: 'vibe-diary-vibes',
    SETTINGS: 'vibe-diary-settings'
};

// localStorage functions
function saveToStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        console.log(`Data saved to localStorage: ${key}`);
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

function saveVibes() {
    saveToStorage(STORAGE_KEYS.VIBES, appState.vibes);
}

function loadVibes() {
    const savedVibes = loadFromStorage(STORAGE_KEYS.VIBES, []);
    // Convert timestamp strings back to Date objects
    appState.vibes = savedVibes.map(vibe => ({
        ...vibe,
        timestamp: new Date(vibe.timestamp)
    }));
    console.log(`Loaded ${appState.vibes.length} vibes from localStorage`);
}

function saveSettings() {
    const settings = {
        currentView: appState.currentView,
        currentPeriod: appState.currentPeriod
    };
    saveToStorage(STORAGE_KEYS.SETTINGS, settings);
}

function loadSettings() {
    const settings = loadFromStorage(STORAGE_KEYS.SETTINGS, {});
    appState.currentView = settings.currentView || 'home';
    appState.currentPeriod = settings.currentPeriod || 'week';
    console.log('Settings loaded from localStorage:', settings);
}

function restoreActiveFilters() {
    // Restore active filter button
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === appState.currentPeriod) {
            btn.classList.add('active');
        }
    });
}

// DOM elements
const elements = {
    currentDate: document.getElementById('currentDate'),
    moodGrid: document.getElementById('moodGrid'),
    notesInput: document.getElementById('notesInput'),
    saveVibeBtn: document.getElementById('saveVibeBtn'),
    weeklyTimeline: document.getElementById('weeklyTimeline'),
    successMessage: document.getElementById('successMessage'),
    historyContent: document.getElementById('historyContent'),
    noHistoryMessage: document.getElementById('noHistoryMessage'),
    noStatsMessage: document.getElementById('noStatsMessage'),
    totalVibes: document.getElementById('totalVibes'),
    currentStreak: document.getElementById('currentStreak'),
    topMoodEmoji: document.getElementById('topMoodEmoji'),
    moodChart: document.getElementById('moodChart'),
    deleteModal: document.getElementById('deleteModal'),
    confirmDeleteBtn: document.getElementById('confirmDeleteBtn'),
    cancelDeleteBtn: document.getElementById('cancelDeleteBtn'),
    installBtn: document.getElementById('installBtn')
};

// Initialize app
function initApp() {
    // Load data from localStorage first
    loadVibes();
    loadSettings();
    
    updateCurrentDate();
    renderMoodGrid();
    setupEventListeners();
    updateWeeklyTimeline();
    updateStatistics();
    updateHistoryView();
    restoreActiveFilters();
    initPWA();
}

// Update current date display
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    const dateStr = now.toLocaleDateString('ru-RU', options);
    elements.currentDate.textContent = dateStr;
}

// Render mood selection grid
function renderMoodGrid() {
    elements.moodGrid.innerHTML = '';
    
    MOODS.forEach(mood => {
        const moodElement = document.createElement('div');
        moodElement.className = 'mood-option';
        moodElement.dataset.value = mood.value;
        moodElement.innerHTML = `
            <div class="mood-emoji">${mood.emoji}</div>
            <div class="mood-label">${mood.label}</div>
        `;
        
        moodElement.addEventListener('click', () => selectMood(mood));
        elements.moodGrid.appendChild(moodElement);
    });
}

// Select a mood
function selectMood(mood) {
    appState.selectedMood = mood;
    
    // Update UI
    document.querySelectorAll('.mood-option').forEach(el => {
        el.classList.remove('selected');
    });
    
    document.querySelector(`[data-value="${mood.value}"]`).classList.add('selected');
    
    // Enable save button
    elements.saveVibeBtn.disabled = false;
}

// Save vibe entry
function saveVibe() {
    if (!appState.selectedMood) return;
    
    const now = new Date();
    const vibeEntry = {
        id: now.getTime(),
        timestamp: now,
        mood: appState.selectedMood,
        notes: elements.notesInput.value.trim()
    };
    
    appState.vibes.unshift(vibeEntry);
    
    // Save to localStorage
    saveVibes();
    
    // Reset form
    appState.selectedMood = null;
    elements.notesInput.value = '';
    elements.saveVibeBtn.disabled = true;
    
    // Update UI
    document.querySelectorAll('.mood-option').forEach(el => {
        el.classList.remove('selected');
    });
    
    // Show success message
    showSuccessMessage();
    
    // Update other views
    updateWeeklyTimeline();
    updateStatistics();
    updateHistoryView();
}

// Show success message
function showSuccessMessage() {
    elements.successMessage.classList.remove('hidden');
    
    setTimeout(() => {
        elements.successMessage.classList.add('hidden');
    }, 3000);
}

// Update weekly timeline
function updateWeeklyTimeline() {
    elements.weeklyTimeline.innerHTML = '';
    
    const today = new Date();
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        const dayElement = document.createElement('div');
        dayElement.className = 'timeline-day';
        
        // Find vibe for this date
        const vibe = appState.vibes.find(v => 
            v.timestamp.toDateString() === date.toDateString()
        );
        
        const dayName = weekDays[date.getDay() === 0 ? 6 : date.getDay() - 1];
        
        dayElement.innerHTML = `
            <div class="timeline-emoji ${vibe ? '' : 'empty'}">
                ${vibe ? vibe.mood.emoji : '○'}
            </div>
            <div class="timeline-label">${dayName}</div>
        `;
        
        elements.weeklyTimeline.appendChild(dayElement);
    }
}

// Update history view
function updateHistoryView() {
    if (appState.vibes.length === 0) {
        elements.historyContent.innerHTML = '';
        elements.noHistoryMessage.classList.remove('hidden');
        return;
    }
    
    elements.noHistoryMessage.classList.add('hidden');
    elements.historyContent.innerHTML = '';
    
    appState.vibes.forEach(vibe => {
        const entryElement = document.createElement('div');
        entryElement.className = 'history-entry';
        entryElement.dataset.id = vibe.id;
        
        const dateStr = vibe.timestamp.toLocaleDateString('ru-RU');
        const timeStr = vibe.timestamp.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const notesPreview = vibe.notes ? 
            (vibe.notes.length > 50 ? vibe.notes.substring(0, 50) + '...' : vibe.notes) : 
            'Без заметок';
        
        entryElement.innerHTML = `
            <div class="history-header">
                <div class="history-mood">
                    <div class="history-emoji">${vibe.mood.emoji}</div>
                    <div class="history-info">
                        <div class="history-date">${dateStr}</div>
                        <div class="history-time">${timeStr}</div>
                    </div>
                </div>
                <div class="history-actions">
                    <button class="btn btn-secondary details-btn" data-id="${vibe.id}">
                        Подробнее
                    </button>
                    <button class="btn btn-danger delete-btn" data-id="${vibe.id}">
                        Удалить
                    </button>
                </div>
            </div>
            <div class="history-notes preview" data-id="${vibe.id}">
                ${notesPreview}
            </div>
        `;
        
        elements.historyContent.appendChild(entryElement);
    });
    
    // Setup event listeners for buttons
    setupHistoryEventListeners();
}

// Setup event listeners for history view
function setupHistoryEventListeners() {
    document.querySelectorAll('.details-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            toggleVibeDetails(id);
        });
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.target.dataset.id);
            showDeleteConfirmation(id);
        });
    });
}

// Toggle vibe details
function toggleVibeDetails(id) {
    const vibe = appState.vibes.find(v => v.id === id);
    if (!vibe) return;
    
    const notesElement = document.querySelector(`[data-id="${id}"].history-notes`);
    const isPreview = notesElement.classList.contains('preview');
    
    if (isPreview) {
        notesElement.classList.remove('preview');
        notesElement.textContent = vibe.notes || 'Без заметок';
    } else {
        notesElement.classList.add('preview');
        const preview = vibe.notes ? 
            (vibe.notes.length > 50 ? vibe.notes.substring(0, 50) + '...' : vibe.notes) : 
            'Без заметок';
        notesElement.textContent = preview;
    }
}

// Show delete confirmation modal
function showDeleteConfirmation(id) {
    appState.deleteTarget = id;
    elements.deleteModal.classList.remove('hidden');
}

// Hide delete confirmation modal
function hideDeleteConfirmation() {
    appState.deleteTarget = null;
    elements.deleteModal.classList.add('hidden');
}

// Delete vibe entry
function deleteVibe() {
    if (!appState.deleteTarget) return;
    
    appState.vibes = appState.vibes.filter(v => v.id !== appState.deleteTarget);
    
    // Save to localStorage
    saveVibes();
    
    // Update views
    updateHistoryView();
    updateWeeklyTimeline();
    updateStatistics();
    
    hideDeleteConfirmation();
}

// Update statistics view
function updateStatistics() {
    const vibes = getVibesForPeriod(appState.currentPeriod);
    
    if (vibes.length === 0) {
        elements.noStatsMessage.classList.remove('hidden');
        document.querySelector('.stats-content').style.display = 'none';
        return;
    }
    
    elements.noStatsMessage.classList.add('hidden');
    document.querySelector('.stats-content').style.display = 'block';
    
    // Total vibes
    elements.totalVibes.textContent = vibes.length;
    
    // Current streak
    elements.currentStreak.textContent = calculateStreak();
    
    // Most frequent mood
    const moodCounts = {};
    vibes.forEach(vibe => {
        const moodValue = vibe.mood.value;
        moodCounts[moodValue] = (moodCounts[moodValue] || 0) + 1;
    });
    
    const topMood = Object.keys(moodCounts).reduce((a, b) => 
        moodCounts[a] > moodCounts[b] ? a : b
    );
    
    const topMoodData = MOODS.find(m => m.value === topMood);
    elements.topMoodEmoji.textContent = topMoodData ? topMoodData.emoji : '😊';
    
    // Update mood chart
    updateMoodChart(moodCounts);
}

// Get vibes for specific period
function getVibesForPeriod(period) {
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
        case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case 'all':
            return appState.vibes;
        default:
            return appState.vibes;
    }
    
    return appState.vibes.filter(vibe => vibe.timestamp >= startDate);
}

// Calculate current streak
function calculateStreak() {
    const sortedVibes = [...appState.vibes].sort((a, b) => b.timestamp - a.timestamp);
    let streak = 0;
    let currentDate = new Date();
    
    for (let i = 0; i < sortedVibes.length; i++) {
        const vibeDate = new Date(sortedVibes[i].timestamp);
        vibeDate.setHours(0, 0, 0, 0);
        currentDate.setHours(0, 0, 0, 0);
        
        const dayDiff = Math.floor((currentDate - vibeDate) / (1000 * 60 * 60 * 24));
        
        if (dayDiff === streak) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

// Update mood chart
function updateMoodChart(moodCounts) {
    elements.moodChart.innerHTML = '';
    
    const maxCount = Math.max(...Object.values(moodCounts), 1);
    
    MOODS.forEach(mood => {
        const count = moodCounts[mood.value] || 0;
        const percentage = (count / maxCount) * 100;
        
        const chartItem = document.createElement('div');
        chartItem.className = 'chart-item';
        chartItem.innerHTML = `
            <div class="chart-mood">
                <div class="chart-mood-emoji">${mood.emoji}</div>
                <div class="chart-mood-label">${mood.label}</div>
            </div>
            <div class="chart-bar-container">
                <div class="chart-bar" style="width: ${percentage}%"></div>
            </div>
            <div class="chart-count">${count}</div>
        `;
        
        elements.moodChart.appendChild(chartItem);
    });
}

// Switch between views
function switchView(viewName) {
    appState.currentView = viewName;
    
    // Update navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    
    // Update views
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // Save settings to localStorage
    saveSettings();
    
    // Refresh data for current view
    if (viewName === 'statistics') {
        updateStatistics();
    } else if (viewName === 'history') {
        updateHistoryView();
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const viewName = e.target.closest('.nav-btn').dataset.view;
            switchView(viewName);
        });
    });
    
    // Save vibe button
    elements.saveVibeBtn.addEventListener('click', saveVibe);
    
    // Notes input
    elements.notesInput.addEventListener('input', () => {
        // Auto-resize textarea
        elements.notesInput.style.height = 'auto';
        elements.notesInput.style.height = elements.notesInput.scrollHeight + 'px';
    });
    
    // Statistics time filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const period = e.target.dataset.period;
            appState.currentPeriod = period;
            
            // Save settings to localStorage
            saveSettings();
            
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            
            updateStatistics();
        });
    });
    
    // Delete confirmation modal
    elements.confirmDeleteBtn.addEventListener('click', deleteVibe);
    elements.cancelDeleteBtn.addEventListener('click', hideDeleteConfirmation);
    
    // Close modal on background click
    elements.deleteModal.addEventListener('click', (e) => {
        if (e.target === elements.deleteModal) {
            hideDeleteConfirmation();
        }
    });
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            hideDeleteConfirmation();
        }
    });
}

// PWA Installation
let deferredPrompt;

function initPWA() {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then((registration) => {
                console.log('Service Worker registered successfully:', registration);
            })
            .catch((error) => {
                console.log('Service Worker registration failed:', error);
            });
    }
    
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
        // App is running in standalone mode
        console.log('App is running in standalone mode');
        return;
    }
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        // Prevent the mini-infobar from appearing on mobile
        e.preventDefault();
        // Stash the event so it can be triggered later
        deferredPrompt = e;
        // Show the install button
        elements.installBtn.classList.remove('hidden');
    });
    
    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
        console.log('PWA was installed');
        elements.installBtn.classList.add('hidden');
        deferredPrompt = null;
    });
    
    // Handle install button click
    elements.installBtn.addEventListener('click', async () => {
        if (deferredPrompt) {
            // Show the install prompt
            deferredPrompt.prompt();
            // Wait for the user to respond to the prompt
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response to the install prompt: ${outcome}`);
            // Clear the deferredPrompt
            deferredPrompt = null;
            // Hide the install button
            elements.installBtn.classList.add('hidden');
        }
    });
    
    // For iOS Safari - show manual install instructions
    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        showIOSInstallInstructions();
    }
}

function showIOSInstallInstructions() {
    // Check if it's iOS and not already in standalone mode
    if (!window.navigator.standalone) {
        // Show a subtle hint for iOS users
        setTimeout(() => {
            const hint = document.createElement('div');
            hint.className = 'ios-install-hint';
            hint.innerHTML = `
                <div class="hint-content">
                    <span class="hint-emoji">📱</span>
                    <span class="hint-text">Нажмите "Поделиться" → "На экран Домой" для установки</span>
                    <button class="hint-close">×</button>
                </div>
            `;
            
            // Add styles
            hint.style.cssText = `
                position: fixed;
                bottom: 20px;
                left: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px;
                border-radius: 12px;
                font-size: 14px;
                z-index: 1000;
                backdrop-filter: blur(10px);
            `;
            
            document.body.appendChild(hint);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (hint.parentNode) {
                    hint.remove();
                }
            }, 5000);
            
            // Close button
            hint.querySelector('.hint-close').addEventListener('click', () => {
                hint.remove();
            });
        }, 3000);
    }
}

// Data export/import functions
function exportData() {
    const data = {
        vibes: appState.vibes,
        settings: {
            currentView: appState.currentView,
            currentPeriod: appState.currentPeriod
        },
        exportDate: new Date().toISOString(),
        version: '2.0'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `vibe-diary-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log('Data exported successfully');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.vibes && Array.isArray(data.vibes)) {
                // Convert timestamp strings back to Date objects
                appState.vibes = data.vibes.map(vibe => ({
                    ...vibe,
                    timestamp: new Date(vibe.timestamp)
                }));
                
                // Restore settings if available
                if (data.settings) {
                    appState.currentView = data.settings.currentView || 'home';
                    appState.currentPeriod = data.settings.currentPeriod || 'week';
                }
                
                // Save to localStorage
                saveVibes();
                saveSettings();
                
                // Update UI
                updateWeeklyTimeline();
                updateStatistics();
                updateHistoryView();
                restoreActiveFilters();
                
                console.log(`Imported ${appState.vibes.length} vibes successfully`);
                alert(`Успешно импортировано ${appState.vibes.length} записей!`);
            } else {
                throw new Error('Invalid data format');
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Ошибка при импорте данных. Проверьте формат файла.');
        }
    };
    reader.readAsText(file);
}

// Clear all data function
function clearAllData() {
    if (confirm('Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.')) {
        appState.vibes = [];
        appState.currentView = 'home';
        appState.currentPeriod = 'week';
        
        // Clear localStorage
        localStorage.removeItem(STORAGE_KEYS.VIBES);
        localStorage.removeItem(STORAGE_KEYS.SETTINGS);
        
        // Update UI
        updateWeeklyTimeline();
        updateStatistics();
        updateHistoryView();
        restoreActiveFilters();
        
        console.log('All data cleared');
        alert('Все данные удалены');
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}