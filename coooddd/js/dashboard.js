/**
 * Dashboard Page JavaScript
 * Updates all dashboard metrics in real-time
 */

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('voltageValue')) {
        initDashboard();
    }
});

function initDashboard() {
    // Start ESP32 data manager
    window.esp32Manager.start();
    
    // Subscribe to data updates
    window.esp32Manager.subscribe((data, changes) => {
        updateDashboardMetrics(data, changes);
        updateSystemInfo(data);
    });
}

function updateDashboardMetrics(data, changes) {
    // Update voltage
    updateMetric('voltage', data.voltage, changes.voltage);
    
    // Update current
    updateMetric('current', data.current, changes.current);
    
    // Update power
    updateMetric('power', data.power, changes.power);
    
    // Update intensity
    updateMetric('intensity', Math.round(data.intensity), changes.intensity);
}

function updateMetric(type, value, change) {
    const valueEl = document.getElementById(`${type}Value`);
    const changeEl = document.getElementById(`${type}Change`);
    
    if (valueEl) {
        if (type === 'intensity') {
            valueEl.textContent = value;
        } else {
            valueEl.textContent = value.toFixed(2);
        }
    }
    
    if (changeEl) {
        const formattedChange = change >= 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
        changeEl.textContent = formattedChange;
        
        // Update parent element class
        const parent = changeEl.closest('.metric-change');
        if (parent) {
            parent.className = 'metric-change ' + (change >= 0 ? 'positive' : 'negative');
        }
    }
}

function updateSystemInfo(data) {
    const stats = window.esp32Manager.getStats();
    
    // Update health score
    const healthScore = stats.healthScore;
    updateElement('healthScore', `${healthScore}%`);
    updateElement('healthProgress', healthScore + '%', 'style.width');
    
    // Update today's energy
    const todayEnergy = getTodayEnergy();
    updateElement('todayEnergy', todayEnergy.toFixed(2));
    
    // Update peak power
    updateElement('peakPower', Math.round(stats.peakPower) + ' W');
    
    // Update efficiency
    const efficiency = calculateEfficiency(data);
    updateElement('efficiency', efficiency.toFixed(1) + '%');
    
    // Update connection status
    updateConnectionStatus();
    
    // Update data points
    updateElement('dataPoints', stats.dataPoints.toString());
}

function getTodayEnergy() {
    const stats = window.esp32Manager.getStats();
    return Math.min(stats.totalEnergy, stats.totalEnergy * 0.05);
}

function calculateEfficiency(data) {
    if (data.intensity === 0) return 0;
    
    const theoreticalPower = (data.intensity / 1000) * 100; // Assuming 100W panel at 1000 W/m²
    if (theoreticalPower === 0) return 0;
    
    return Math.min(100, (data.power / theoreticalPower) * 100);
}

function updateConnectionStatus() {
    const status = window.esp32Manager.getConnectionStatus();
    const statusEl = document.getElementById('connectionStatus');
    const indicatorEl = document.getElementById('statusIndicator');
    
    if (statusEl) {
        if (status.isConnected) {
            statusEl.textContent = status.mode === 'real' ? 'Connected to ESP32' : 'Simulated Data';
            statusEl.style.color = '#10b981';
        } else {
            statusEl.textContent = 'Disconnected';
            statusEl.style.color = '#ef4444';
        }
    }
    
    if (indicatorEl) {
        indicatorEl.className = 'status-indicator' + (status.isConnected ? '' : ' disconnected');
    }
}

function updateElement(id, value, property = 'textContent') {
    const element = document.getElementById(id);
    if (!element) return;
    
    if (property.includes('.')) {
        const props = property.split('.');
        let obj = element;
        for (let i = 0; i < props.length - 1; i++) {
            obj = obj[props[i]];
        }
        obj[props[props.length - 1]] = value;
    } else {
        element[property] = value;
    }
}

// Start the dashboard
// This is called automatically by DOMContentLoaded above
