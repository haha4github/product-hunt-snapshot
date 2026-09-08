// Trends page script
document.addEventListener('DOMContentLoaded', function() {
  // If data is loaded
  if (typeof phData !== 'undefined') {
    initializeTrendsPage();
  } else {
    console.error('Data not found');
    document.querySelector('main').innerHTML = '<div class="alert alert-danger">Failed to load data</div>';
  }
});

// Initialize trends page
function initializeTrendsPage() {
  // Update last updated time
  updateLastUpdated();
  
  // Initialize charts
  renderDailyTrendChart();
  renderPostCountChart();
  
  // Render top products table
  renderTopProductsTable();
}

// Update last updated time
function updateLastUpdated() {
  const lastUpdatedElement = document.getElementById('lastUpdated');
  if (lastUpdatedElement && phData.latest && phData.latest.fetchedAt) {
    const date = new Date(phData.latest.fetchedAt);
    lastUpdatedElement.textContent = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
  }
}

// Render daily trend chart
function renderDailyTrendChart() {
  const ctx = document.getElementById('dailyTrendChart');
  if (!ctx || !phData.summary || !phData.summary.dataPoints) return;
  
  // Get data points and group by day
  const dataByDay = groupDataByDay(phData.summary.dataPoints);
  
  // Date labels
  const labels = Object.keys(dataByDay).sort();
  
  // Calculate daily average upvotes
  const averageVotesData = labels.map(date => {
    const dayData = dataByDay[date];
    const totalVotes = dayData.reduce((sum, point) => sum + point.totalVotes, 0);
    const totalPosts = dayData.reduce((sum, point) => sum + point.postCount, 0);
    return totalPosts > 0 ? Math.round(totalVotes / totalPosts) : 0;
  });
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.map(date => dayjs(date).format('MM-DD')),
      datasets: [{
        label: 'Daily Average Upvotes',
        data: averageVotesData,
        borderColor: 'rgba(255, 72, 88, 1)',
        backgroundColor: 'rgba(255, 72, 88, 0.1)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function(tooltipItems) {
              return dayjs(labels[tooltipItems[0].dataIndex]).format('YYYY-MM-DD');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Average Upvotes'
          }
        },
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 7
          }
        }
      }
    }
  });
}

// Render post count trend chart
function renderPostCountChart() {
  const ctx = document.getElementById('postCountChart');
  if (!ctx || !phData.summary || !phData.summary.dataPoints) return;
  
  // Get data points and group by day
  const dataByDay = groupDataByDay(phData.summary.dataPoints);
  
  // Date labels
  const labels = Object.keys(dataByDay).sort();
  
  // Calculate daily product count
  const postCountData = labels.map(date => {
    const dayData = dataByDay[date];
    return dayData.reduce((sum, point) => sum + point.postCount, 0);
  });
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels.map(date => dayjs(date).format('MM-DD')),
      datasets: [{
        label: 'Product Release Count',
        data: postCountData,
        backgroundColor: 'rgba(54, 162, 235, 0.7)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: function(tooltipItems) {
              return dayjs(labels[tooltipItems[0].dataIndex]).format('YYYY-MM-DD');
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Product Count'
          }
        },
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: 7
          }
        }
      }
    }
  });
}

// Render top products table
function renderTopProductsTable() {
  const tableBody = document.querySelector('#topProductsTable tbody');
  if (!tableBody || !phData.summary || !phData.summary.dataPoints) return;
  
  // Clear table
  tableBody.innerHTML = '';
  
  // Get all data points and sort by date (newest first)
  const sortedDataPoints = [...phData.summary.dataPoints].sort((a, b) => 
    new Date(b.timestamp) - new Date(a.timestamp)
  );
  
  // Limit to the latest 10 records
  const recentDataPoints = sortedDataPoints.slice(0, 10);
  
  // Add row for each data point
  recentDataPoints.forEach(dataPoint => {
    const date = dayjs(dataPoint.timestamp).format('YYYY-MM-DD HH:mm');
    
    // Get current data point's top products
    if (!dataPoint.topPosts || dataPoint.topPosts.length === 0) {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${date}</td>
        <td colspan="3" class="text-center">No data</td>
      `;
      tableBody.appendChild(row);
      return;
    }
    
    // Get top ranked product
    const topProduct = dataPoint.topPosts[0];
    
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${date}</td>
      <td>${topProduct.name}</td>
      <td>${topProduct.votes || 0}</td>
      <td><a href="${topProduct.url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary">View</a></td>
    `;
    tableBody.appendChild(row);
  });
}

// Group data by day
function groupDataByDay(dataPoints) {
  const groupedData = {};
  
  dataPoints.forEach(point => {
    // Get date part (without time)
    const date = dayjs(point.timestamp).format('YYYY-MM-DD');
    
    // If date doesn't exist, create a new array
    if (!groupedData[date]) {
      groupedData[date] = [];
    }
    
    // Add data point to appropriate date
    groupedData[date].push(point);
  });
  
  return groupedData;
} 