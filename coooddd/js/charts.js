/**
 * Charts Management
 * Handles real-time chart visualization
 */

let realtimeChart = null;

function initDashboardCharts() {
    const canvas = document.getElementById('realtimeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Initialize Chart.js
    realtimeChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Voltage (V)',
                    data: [],
                    borderColor: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Current (A)',
                    data: [],
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Power (W)',
                    data: [],
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        color: getComputedStyle(document.body).getPropertyValue('--text-primary')
                    }
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    padding: 12,
                    titleFont: {
                        size: 14,
                        family: 'Poppins'
                    },
                    bodyFont: {
                        size: 13,
                        family: 'Inter'
                    },
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed.y.toFixed(2);
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Time',
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        color: getComputedStyle(document.body).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-secondary'),
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Voltage (V) / Current (A)',
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        color: getComputedStyle(document.body).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.1)'
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-secondary'),
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Power (W)',
                        font: {
                            family: 'Poppins',
                            size: 12
                        },
                        color: getComputedStyle(document.body).getPropertyValue('--text-secondary')
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: getComputedStyle(document.body).getPropertyValue('--text-secondary'),
                        font: {
                            family: 'Inter',
                            size: 11
                        }
                    }
                }
            },
            animation: {
                duration: 750
            }
        }
    });
    
    // Subscribe to ESP32 data updates
    window.esp32Manager.subscribe((data, changes) => {
        updateChart(data);
    });
}

function updateChart(data) {
    if (!realtimeChart) return;
    
    const timeLabel = new Date(data.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    // Add new data point
    realtimeChart.data.labels.push(timeLabel);
    realtimeChart.data.datasets[0].data.push(data.voltage);
    realtimeChart.data.datasets[1].data.push(data.current);
    realtimeChart.data.datasets[2].data.push(data.power);
    
    // Keep only last 60 points (1 minute)
    if (realtimeChart.data.labels.length > 60) {
        realtimeChart.data.labels.shift();
        realtimeChart.data.datasets[0].data.shift();
        realtimeChart.data.datasets[1].data.shift();
        realtimeChart.data.datasets[2].data.shift();
    }
    
    realtimeChart.update('none'); // Update without animation for smooth real-time updates
}

// Initialize charts on page load
if (document.getElementById('realtimeChart')) {
    document.addEventListener('DOMContentLoaded', initDashboardCharts);
}
