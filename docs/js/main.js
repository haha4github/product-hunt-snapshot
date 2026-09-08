// Main JavaScript file
document.addEventListener('DOMContentLoaded', function() {
  // If data is loaded
  if (typeof phData !== 'undefined') {
    initializePage();
  } else {
    console.error('Data not found');
    document.getElementById('productsContainer').innerHTML = '<div class="col-12 text-center"><p>Failed to load data</p></div>';
  }
});

// Initialize page
function initializePage() {
  // Update last updated time
  updateLastUpdated();
  
  // Render product list
  renderProducts();
  
  // Initialize charts
  initializeCharts();
}

// Update last updated time
function updateLastUpdated() {
  const lastUpdatedElement = document.getElementById('lastUpdated');
  if (lastUpdatedElement && phData.latest && phData.latest.fetchedAt) {
    const date = new Date(phData.latest.fetchedAt);
    lastUpdatedElement.textContent = dayjs(date).format('YYYY-MM-DD HH:mm:ss');
  }
}

// Render products list
function renderProducts() {
  const productsContainer = document.getElementById('productsContainer');
  if (!productsContainer || !phData.latest || !phData.latest.posts) return;
  
  // Clear container
  productsContainer.innerHTML = '';
  
  // Get top 8 products
  const products = phData.latest.posts.slice(0, 8);
  
  // Create card for each product
  products.forEach(product => {
    const thumbnailUrl = product.thumbnail && product.thumbnail.url 
      ? product.thumbnail.url 
      : 'https://via.placeholder.com/300x200?text=Product+Hunt';
    
    // Get topic tags
    const topics = product.topics && product.topics.edges 
      ? product.topics.edges.map(edge => edge.node.name).slice(0, 3)
      : [];
    
    const topicsHtml = topics.length > 0 
      ? topics.map(topic => `<span class="badge bg-light text-dark me-1">${topic}</span>`).join('')
      : '';
    
    const productHtml = `
      <div class="col-md-6 col-lg-3 mb-4">
        <div class="card product-card shadow-sm">
          <div class="product-thumbnail" style="background-image: url('${thumbnailUrl}')">
            <span class="votes-badge">${product.votesCount} upvotes</span>
          </div>
          <div class="card-body">
            <h5 class="card-title">${product.name}</h5>
            <p class="card-text text-muted small">${product.tagline}</p>
            <div class="mb-2">${topicsHtml}</div>
            <a href="${product.url}" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary">View Product</a>
          </div>
        </div>
      </div>
    `;
    
    productsContainer.innerHTML += productHtml;
  });
}

// Initialize all charts
function initializeCharts() {
  renderVotesChart();
  renderHourlyTrendChart();
  renderCategoryChart();
}

// Render votes chart
function renderVotesChart() {
  const ctx = document.getElementById('votesChart');
  if (!ctx || !phData.latest || !phData.latest.posts) return;
  
  const topPosts = phData.latest.posts.slice(0, 5);
  
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: topPosts.map(post => {
        // Truncate long names
        return post.name.length > 15 ? post.name.substring(0, 15) + '...' : post.name;
      }),
      datasets: [{
        label: 'Upvotes',
        data: topPosts.map(post => post.votesCount),
        backgroundColor: 'rgba(255, 72, 88, 0.7)',
        borderColor: 'rgba(255, 72, 88, 1)',
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
              const index = tooltipItems[0].dataIndex;
              return topPosts[index].name; // Show full name
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Upvotes'
          }
        },
        x: {
          ticks: {
            autoSkip: true,
            maxRotation: 45,
            minRotation: 45
          }
        }
      }
    }
  });
}

// Render hourly trend chart
function renderHourlyTrendChart() {
  const ctx = document.getElementById('hourlyTrendChart');
  if (!ctx || !phData.summary || !phData.summary.dataPoints) return;
  
  // Only get the latest 24 data points (if available)
  const dataPoints = phData.summary.dataPoints.slice(-24);
  
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dataPoints.map(point => dayjs(point.timestamp).format('HH:mm')),
      datasets: [{
        label: 'Avg Upvotes',
        data: dataPoints.map(point => {
          if (point.postCount === 0) return 0;
          return Math.round(point.totalVotes / point.postCount);
        }),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.3,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        tooltip: {
          callbacks: {
            label: function(context) {
              return `Avg Upvotes: ${context.raw}`;
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
            maxTicksLimit: 8
          }
        }
      }
    }
  });
}

// Render category chart
function renderCategoryChart() {
  const ctx = document.getElementById('categoryChart');
  if (!ctx || !phData.latest || !phData.latest.posts) return;
  
  // Collect all topics
  const allTopics = [];
  phData.latest.posts.forEach(post => {
    if (post.topics && post.topics.edges) {
      post.topics.edges.forEach(edge => {
        if (edge.node && edge.node.name) {
          allTopics.push(edge.node.name);
        }
      });
    }
  });
  
  // Calculate topic frequency
  const topicCounts = {};
  allTopics.forEach(topic => {
    topicCounts[topic] = (topicCounts[topic] || 0) + 1;
  });
  
  // Convert to sorted array
  const sortedTopics = Object.keys(topicCounts)
    .map(topic => ({ name: topic, count: topicCounts[topic] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6); // Only take top 6 topics
  
  // Other category
  const otherCount = Object.values(topicCounts)
    .reduce((sum, count) => sum + count, 0) - 
    sortedTopics.reduce((sum, topic) => sum + topic.count, 0);
  
  if (otherCount > 0) {
    sortedTopics.push({ name: 'Other', count: otherCount });
  }
  
  // Color list
  const colors = [
    'rgba(255, 72, 88, 0.7)',
    'rgba(54, 162, 235, 0.7)',
    'rgba(255, 206, 86, 0.7)',
    'rgba(75, 192, 192, 0.7)',
    'rgba(153, 102, 255, 0.7)',
    'rgba(255, 159, 64, 0.7)',
    'rgba(199, 199, 199, 0.7)'
  ];
  
  new Chart(ctx, {
    type: 'pie',
    data: {
      labels: sortedTopics.map(topic => topic.name),
      datasets: [{
        data: sortedTopics.map(topic => topic.count),
        backgroundColor: colors.slice(0, sortedTopics.length),
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
} 