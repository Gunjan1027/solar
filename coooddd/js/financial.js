/**
 * Financial & Environmental Impact Page JavaScript
 */

// MGVCL Electricity Rates (INR per kWh)
const ELECTRICITY_RATES = {
    tier1: { min: 0, max: 50, rate: 3.60 },
    tier2: { min: 51, max: 100, rate: 4.10 },
    tier3: { min: 101, max: 200, rate: 5.00 },
    tier4: { min: 201, max: Infinity, rate: 6.20 }
};

const DEFAULT_RATE = 5.00; // Average rate

// Environmental constants
const CO2_PER_KWH = 0.82; // kg CO2 per kWh (India average)
const TREES_PER_KG_CO2 = 0.06; // Trees needed to offset 1 kg CO2 per year

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('totalSavings')) {
        initFinancialPage();
    }
});

function initFinancialPage() {
    // Subscribe to ESP32 data updates
    window.esp32Manager.subscribe((data, changes) => {
        updateFinancialData();
    });
    
    // Initial update
    updateFinancialData();
    
    // Update every second
    setInterval(updateFinancialData, 1000);
}

function updateFinancialData() {
    const stats = window.esp32Manager.getStats();
    const totalKwh = stats.totalEnergy;
    
    // Calculate savings
    const totalSavings = calculateSavings(totalKwh);
    const todaySavings = calculateSavings(getTodayEnergy());
    const weekSavings = calculateSavings(totalKwh * 0.15); // Rough estimate
    const monthSavings = calculateSavings(totalKwh * 0.5); // Rough estimate
    const yearSavings = calculateSavings(totalKwh);
    
    // Calculate environmental impact
    const co2Saved = totalKwh * CO2_PER_KWH;
    const treesEquiv = Math.floor(co2Saved * TREES_PER_KG_CO2);
    
    // Update main cards
    updateElement('totalSavings', formatCurrency(totalSavings));
    updateElement('totalEnergy', `${totalKwh.toFixed(2)} kWh`);
    updateElement('co2Saved', `${co2Saved.toFixed(2)} kg`);
    updateElement('treesEquiv', treesEquiv.toString());
    
    // Update period breakdown
    updateElement('todaySavings', formatCurrency(todaySavings));
    updateElement('weekSavings', formatCurrency(weekSavings));
    updateElement('monthSavings', formatCurrency(monthSavings));
    updateElement('yearSavings', formatCurrency(yearSavings));
    
    updateElement('todayKwh', getTodayEnergy().toFixed(2));
    updateElement('weekKwh', (totalKwh * 0.15).toFixed(2));
    updateElement('monthKwh', (totalKwh * 0.5).toFixed(2));
    updateElement('yearKwh', totalKwh.toFixed(2));
    
    // Update current rate
    updateElement('currentRate', DEFAULT_RATE.toFixed(2));
    
    // Update impact details
    updateElement('climateImpact', `${co2Saved.toFixed(2)} kg`);
    updateElement('kmEquiv', `${(co2Saved / 0.12).toFixed(0)} km`); // ~0.12 kg CO2 per km
    updateElement('cleanEnergy', `${totalKwh.toFixed(2)} kWh`);
    updateElement('financialBenefit', formatCurrency(totalSavings));
}

function calculateSavings(kWh) {
    return kWh * DEFAULT_RATE;
}

function getTodayEnergy() {
    // This would ideally track today's energy separately
    // For now, returning a fraction of total energy
    const stats = window.esp32Manager.getStats();
    return Math.min(stats.totalEnergy, stats.totalEnergy * 0.05);
}

function formatCurrency(amount) {
    return '₹' + amount.toFixed(2);
}

function updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = value;
    }
}
