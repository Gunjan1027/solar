/**
 * Settings Page JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('exportData')) {
        initSettingsPage();
    }
});

function initSettingsPage() {
    // Load saved settings
    loadSettings();
    
    // Export data button
    document.getElementById('exportData')?.addEventListener('click', exportData);
    
    // Import data button
    document.getElementById('importData')?.addEventListener('click', () => {
        document.getElementById('importFile').click();
    });
    
    document.getElementById('importFile')?.addEventListener('change', handleImportFile);
    
    // Reset data button
    document.getElementById('resetData')?.addEventListener('click', resetData);
    
    // Save ESP32 settings
    document.getElementById('saveESP32')?.addEventListener('click', saveESP32Settings);
    
    // Update connection status
    updateConnectionInfo();
    setInterval(updateConnectionInfo, 1000);
}

function loadSettings() {
    // Load ESP32 settings
    const esp32IP = localStorage.getItem('esp32IP') || '';
    const updateInterval = localStorage.getItem('updateInterval') || '1';
    
    if (document.getElementById('esp32IP')) {
        document.getElementById('esp32IP').value = esp32IP;
    }
    
    if (document.getElementById('updateInterval')) {
        document.getElementById('updateInterval').value = updateInterval;
    }
}

function exportData() {
    window.esp32Manager.exportData();
    showNotification('Data exported successfully!', 'success');
}

function handleImportFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            window.esp32Manager.importData(e.target.result);
            showNotification('Data imported successfully!', 'success');
        } catch (error) {
            showNotification('Error importing data: ' + error.message, 'error');
        }
    };
    reader.readAsText(file);
}

function resetData() {
    if (confirm('⚠️ Are you sure you want to reset all data?\n\nThis action cannot be undone!')) {
        if (confirm('⚠️ FINAL WARNING: This will delete all your solar monitoring data permanently!')) {
            window.esp32Manager.resetData();
            showNotification('All data has been reset!', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    }
}

function saveESP32Settings() {
    const esp32IP = document.getElementById('esp32IP').value.trim();
    const updateInterval = parseInt(document.getElementById('updateInterval').value);
    
    // Validate inputs
    if (esp32IP && !isValidIP(esp32IP)) {
        showNotification('Please enter a valid IP address', 'error');
        return;
    }
    
    if (updateInterval < 1 || updateInterval > 60) {
        showNotification('Update interval must be between 1 and 60 seconds', 'error');
        return;
    }
    
    // Save settings
    localStorage.setItem('esp32IP', esp32IP);
    localStorage.setItem('updateInterval', updateInterval.toString());
    
    // Apply settings
    window.esp32Manager.setESP32IP(esp32IP);
    window.esp32Manager.setUpdateInterval(updateInterval);
    
    showNotification('ESP32 settings saved successfully!', 'success');
}

function isValidIP(ip) {
    if (!ip) return true; // Empty is valid (will use simulated data)
    
    const pattern = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
    const match = ip.match(pattern);
    
    if (!match) return false;
    
    return match.slice(1).every(octet => {
        const num = parseInt(octet);
        return num >= 0 && num <= 255;
    });
}

function updateConnectionInfo() {
    const status = window.esp32Manager.getConnectionStatus();
    const stats = window.esp32Manager.getStats();
    
    // Update connection mode
    const modeText = status.mode === 'real' ? 'Real ESP32' : 'Simulated';
    updateElement('connectionMode', modeText);
    
    // Update connection status
    const statusEl = document.getElementById('esp32Status');
    const badgeEl = document.getElementById('esp32Badge');
    
    if (statusEl && badgeEl) {
        if (status.isConnected) {
            statusEl.textContent = status.mode === 'real' ? 'Connected' : 'Simulated';
            badgeEl.querySelector('.badge-dot').style.background = '#10b981';
        } else {
            statusEl.textContent = 'Disconnected';
            badgeEl.querySelector('.badge-dot').style.background = '#ef4444';
        }
    }
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}

function showNotification(message, type = 'info') {
    alert(message);
}
