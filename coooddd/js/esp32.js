/**
 * ESP32 Data Management
 * Handles real-time data fetching and simulation
 */

class ESP32DataManager {
    constructor() {
        this.data = {
            voltage: 0,
            current: 0,
            power: 0,
            intensity: 0,
            timestamp: new Date()
        };
        
        this.history = [];
        this.maxHistoryPoints = 60; // Keep last 60 data points (1 minute at 1s interval)
        this.updateInterval = 1000; // 1 second
        this.isConnected = false;
        this.esp32IP = localStorage.getItem('esp32IP') || '';
        this.connectionMode = 'simulated'; // 'simulated' or 'real'
        
        this.totalEnergy = parseFloat(localStorage.getItem('totalEnergy')) || 0;
        this.peakPower = parseFloat(localStorage.getItem('peakPower')) || 0;
        this.dataPointsCount = parseInt(localStorage.getItem('dataPointsCount')) || 0;
        
        this.listeners = [];
    }
    
    // Start data collection
    start() {
        this.stop();
        
        if (this.esp32IP && this.esp32IP.trim() !== '') {
            this.connectionMode = 'real';
            this.fetchRealData();
        } else {
            this.connectionMode = 'simulated';
            this.generateSimulatedData();
        }
        
        this.interval = setInterval(() => {
            if (this.connectionMode === 'real') {
                this.fetchRealData();
            } else {
                this.generateSimulatedData();
            }
        }, this.updateInterval);
    }
    
    // Stop data collection
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
    
    // Fetch real data from ESP32
    async fetchRealData() {
        try {
            const response = await fetch(`http://${this.esp32IP}/data`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                signal: AbortSignal.timeout(5000)
            });
            
            if (response.ok) {
                const data = await response.json();
                this.updateData({
                    voltage: parseFloat(data.voltage) || 0,
                    current: parseFloat(data.current) || 0,
                    power: parseFloat(data.power) || (parseFloat(data.voltage) * parseFloat(data.current)),
                    intensity: parseInt(data.intensity) || 0,
                    timestamp: new Date()
                });
                this.isConnected = true;
            } else {
                this.handleConnectionError();
            }
        } catch (error) {
            this.handleConnectionError();
        }
    }
    
    // Handle connection errors
    handleConnectionError() {
        this.isConnected = false;
        // Fallback to simulated data
        this.generateSimulatedData();
    }
    
    // Generate simulated data
    generateSimulatedData() {
        const hour = new Date().getHours();
        const timeOfDay = hour >= 6 && hour < 18 ? 'day' : 'night';
        
        let baseIntensity, baseVoltage, baseCurrent;
        
        if (timeOfDay === 'day') {
            // Peak solar hours: 11 AM - 3 PM
            if (hour >= 11 && hour < 15) {
                baseIntensity = 800 + Math.random() * 200; // 800-1000 W/m²
                baseVoltage = 22 + Math.random() * 3; // 22-25V
                baseCurrent = 4 + Math.random() * 1.5; // 4-5.5A
            }
            // Morning/Evening
            else {
                const morningFactor = hour < 12 ? (hour - 6) / 6 : (18 - hour) / 6;
                baseIntensity = morningFactor * (600 + Math.random() * 200);
                baseVoltage = 18 + morningFactor * 5 + Math.random() * 2;
                baseCurrent = morningFactor * (3 + Math.random() * 1.5);
            }
        } else {
            // Night time
            baseIntensity = Math.random() * 10;
            baseVoltage = Math.random() * 2;
            baseCurrent = Math.random() * 0.1;
        }
        
        // Add some randomness for realism
        const voltage = Math.max(0, baseVoltage + (Math.random() - 0.5) * 0.5);
        const current = Math.max(0, baseCurrent + (Math.random() - 0.5) * 0.2);
        const power = voltage * current;
        const intensity = Math.max(0, Math.round(baseIntensity + (Math.random() - 0.5) * 50));
        
        this.updateData({
            voltage,
            current,
            power,
            intensity,
            timestamp: new Date()
        });
        
        this.isConnected = true;
    }
    
    // Update data and notify listeners
    updateData(newData) {
        const prevData = {...this.data};
        this.data = newData;
        
        // Add to history
        this.history.push({...newData});
        if (this.history.length > this.maxHistoryPoints) {
            this.history.shift();
        }
        
        // Update statistics
        this.dataPointsCount++;
        const energyIncrement = (newData.power / 1000) * (this.updateInterval / 3600000); // kWh
        this.totalEnergy += energyIncrement;
        
        if (newData.power > this.peakPower) {
            this.peakPower = newData.power;
        }
        
        // Save to localStorage
        localStorage.setItem('totalEnergy', this.totalEnergy.toString());
        localStorage.setItem('peakPower', this.peakPower.toString());
        localStorage.setItem('dataPointsCount', this.dataPointsCount.toString());
        
        // Calculate changes
        const changes = {
            voltage: prevData.voltage !== 0 ? ((newData.voltage - prevData.voltage) / prevData.voltage) * 100 : 0,
            current: prevData.current !== 0 ? ((newData.current - prevData.current) / prevData.current) * 100 : 0,
            power: prevData.power !== 0 ? ((newData.power - prevData.power) / prevData.power) * 100 : 0,
            intensity: prevData.intensity !== 0 ? ((newData.intensity - prevData.intensity) / prevData.intensity) * 100 : 0
        };
        
        // Notify all listeners
        this.listeners.forEach(listener => {
            listener(this.data, changes);
        });
    }
    
    // Subscribe to data updates
    subscribe(callback) {
        this.listeners.push(callback);
        // Immediately call with current data
        callback(this.data, { voltage: 0, current: 0, power: 0, intensity: 0 });
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    
    // Get connection status
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            mode: this.connectionMode,
            esp32IP: this.esp32IP
        };
    }
    
    // Set ESP32 IP address
    setESP32IP(ip) {
        this.esp32IP = ip;
        localStorage.setItem('esp32IP', ip);
        this.start(); // Restart with new settings
    }
    
    // Set update interval
    setUpdateInterval(interval) {
        this.updateInterval = interval * 1000; // Convert to milliseconds
        this.start(); // Restart with new interval
    }
    
    // Get statistics
    getStats() {
        return {
            totalEnergy: this.totalEnergy,
            peakPower: this.peakPower,
            dataPoints: this.dataPointsCount,
            healthScore: this.calculateHealthScore()
        };
    }
    
    // Calculate health score based on current performance
    calculateHealthScore() {
        if (this.data.intensity === 0 || this.data.power === 0) return 95;
        
        const expectedPower = (this.data.intensity / 1000) * 100; // Rough estimate
        const efficiency = Math.min(100, (this.data.power / expectedPower) * 100);
        
        return Math.round(Math.max(70, Math.min(100, efficiency)));
    }
    
    // Export data
    exportData() {
        const exportData = {
            currentData: this.data,
            history: this.history,
            stats: this.getStats(),
            exportDate: new Date().toISOString()
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `solar-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    // Import data
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.stats) {
                this.totalEnergy = data.stats.totalEnergy || 0;
                this.peakPower = data.stats.peakPower || 0;
                this.dataPointsCount = data.stats.dataPoints || 0;
                
                localStorage.setItem('totalEnergy', this.totalEnergy.toString());
                localStorage.setItem('peakPower', this.peakPower.toString());
                localStorage.setItem('dataPointsCount', this.dataPointsCount.toString());
            }
            alert('Data imported successfully!');
        } catch (error) {
            alert('Error importing data: ' + error.message);
        }
    }
    
    // Reset all data
    resetData() {
        this.totalEnergy = 0;
        this.peakPower = 0;
        this.dataPointsCount = 0;
        this.history = [];
        
        localStorage.removeItem('totalEnergy');
        localStorage.removeItem('peakPower');
        localStorage.removeItem('dataPointsCount');
        
        alert('All data has been reset!');
    }
}

// Create global instance
window.esp32Manager = new ESP32DataManager();
