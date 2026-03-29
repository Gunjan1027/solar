/**
 * Alerts Page JavaScript
 */

// Password for emergency actions
const EMERGENCY_PASSWORD = 'solar123';

// Initialize alerts page
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('alertsList')) {
        initAlertsPage();
    }
});

function initAlertsPage() {
    // Subscribe to ESP32 data for monitoring
    window.esp32Manager.subscribe((data, changes) => {
        checkSystemAlerts(data);
        updateAlertSummary();
        updateConnectionStatus();
    });
    
    // Emergency shutdown button
    const emergencyBtn = document.getElementById('emergencyShutdown');
    if (emergencyBtn) {
        emergencyBtn.addEventListener('click', showEmergencyModal);
    }
    
    // System restart button
    const restartBtn = document.getElementById('systemRestart');
    if (restartBtn) {
        restartBtn.addEventListener('click', showRestartModal);
    }
    
    // Modal buttons
    document.getElementById('cancelShutdown')?.addEventListener('click', hideEmergencyModal);
    document.getElementById('confirmShutdown')?.addEventListener('click', performEmergencyShutdown);
    document.getElementById('cancelRestart')?.addEventListener('click', hideRestartModal);
    document.getElementById('confirmRestart')?.addEventListener('click', performSystemRestart);
    
    // Initial update
    updateConnectionStatus();
}

function checkSystemAlerts(data) {
    const alerts = [];
    
    // Check for voltage issues
    if (data.voltage > 30) {
        alerts.push({
            type: 'critical',
            title: 'High Voltage Alert',
            message: `Voltage is ${data.voltage.toFixed(2)}V, exceeding safe limits`,
            time: new Date()
        });
    } else if (data.voltage < 10 && data.voltage > 1) {
        alerts.push({
            type: 'warning',
            title: 'Low Voltage Warning',
            message: `Voltage is ${data.voltage.toFixed(2)}V, below optimal range`,
            time: new Date()
        });
    }
    
    // Check for current issues
    if (data.current > 8) {
        alerts.push({
            type: 'critical',
            title: 'High Current Alert',
            message: `Current is ${data.current.toFixed(2)}A, exceeding safe limits`,
            time: new Date()
        });
    }
    
    // Check for power issues
    if (data.power > 200) {
        alerts.push({
            type: 'warning',
            title: 'High Power Output',
            message: `Power output is ${data.power.toFixed(2)}W`,
            time: new Date()
        });
    }
    
    // Check connection status
    const status = window.esp32Manager.getConnectionStatus();
    if (!status.isConnected) {
        alerts.push({
            type: 'warning',
            title: 'ESP32 Connection Lost',
            message: 'Unable to connect to ESP32. Using simulated data.',
            time: new Date()
        });
    }
    
    // If no issues, show success
    if (alerts.length === 0) {
        alerts.push({
            type: 'success',
            title: 'System Operating Normally',
            message: 'All parameters are within normal range',
            time: new Date()
        });
    }
    
    renderAlerts(alerts);
}

function renderAlerts(alerts) {
    const alertsList = document.getElementById('alertsList');
    if (!alertsList) return;
    
    alertsList.innerHTML = '';
    
    alerts.forEach(alert => {
        const alertEl = document.createElement('div');
        alertEl.className = `alert-item ${alert.type}`;
        
        const icon = getAlertIcon(alert.type);
        
        alertEl.innerHTML = `
            <div class="alert-icon-wrapper">
                ${icon}
            </div>
            <div class="alert-content">
                <h4 class="alert-title">${alert.title}</h4>
                <p class="alert-message">${alert.message}</p>
                <span class="alert-time">${formatTime(alert.time)}</span>
            </div>
        `;
        
        alertsList.appendChild(alertEl);
    });
}

function getAlertIcon(type) {
    const icons = {
        critical: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
        warning: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>',
        info: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>',
        success: '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>'
    };
    return icons[type] || icons.info;
}

function updateAlertSummary() {
    // This would typically count alerts from a store
    // For now, showing placeholder values
    document.getElementById('criticalCount').textContent = '0';
    document.getElementById('warningCount').textContent = '0';
    document.getElementById('infoCount').textContent = '1';
    document.getElementById('successCount').textContent = '1';
}

function updateConnectionStatus() {
    const status = window.esp32Manager.getConnectionStatus();
    const statusText = document.getElementById('esp32Status');
    const badge = document.getElementById('esp32Badge');
    
    if (statusText && badge) {
        if (status.isConnected) {
            statusText.textContent = status.mode === 'real' ? 'Connected (Real)' : 'Connected (Simulated)';
            badge.className = 'connection-badge';
        } else {
            statusText.textContent = 'Disconnected';
            badge.className = 'connection-badge disconnected';
        }
    }
}

function showEmergencyModal() {
    document.getElementById('shutdownModal').classList.add('active');
}

function hideEmergencyModal() {
    document.getElementById('shutdownModal').classList.remove('active');
    document.getElementById('shutdownPassword').value = '';
}

function performEmergencyShutdown() {
    const password = document.getElementById('shutdownPassword').value;
    
    if (password === EMERGENCY_PASSWORD) {
        alert('⚠️ EMERGENCY SHUTDOWN INITIATED\n\nSolar panel system has been safely shut down.\nPlease check hardware before restarting.');
        hideEmergencyModal();
        window.esp32Manager.stop();
    } else {
        alert('❌ Incorrect password!');
    }
}

function showRestartModal() {
    document.getElementById('restartModal').classList.add('active');
}

function hideRestartModal() {
    document.getElementById('restartModal').classList.remove('active');
    document.getElementById('restartPassword').value = '';
}

function performSystemRestart() {
    const password = document.getElementById('restartPassword').value;
    
    if (password === EMERGENCY_PASSWORD) {
        alert('🔄 SYSTEM RESTART INITIATED\n\nRestarting monitoring system...');
        hideRestartModal();
        window.esp32Manager.stop();
        setTimeout(() => {
            window.esp32Manager.start();
            alert('✅ System restarted successfully!');
        }, 2000);
    } else {
        alert('❌ Incorrect password!');
    }
}

function formatTime(date) {
    return date.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
}
