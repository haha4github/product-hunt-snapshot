// scripts/fetch_producthunt.js
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.PH_TOKEN;
if (!TOKEN) {
  console.error('Missing PRODUCT_HUNT_TOKEN');
  process.exit(1);
}

async function fetchPosts() {
  const res = await fetch('https://api.producthunt.com/v2/api/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
      {
        posts(first: 20) {
          edges {
            node {
              id
              name
              tagline
              url
              votesCount
              commentsCount
              createdAt
              thumbnail {
                url
              }
              topics {
                edges {
                  node {
                    name
                  }
                }
              }
            }
          }
        }
      }`
    })
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  
  // Debug response
  console.error('API Response:', JSON.stringify(json, null, 2));
  
  if (!json.data) {
    throw new Error(`API returned invalid data: ${JSON.stringify(json)}`);
  }
  
  if (!json.data.posts) {
    throw new Error(`API returned invalid posts data: ${JSON.stringify(json.data)}`);
  }
  
  return json.data.posts.edges.map(e => e.node);
}

// Ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Save data to file
function saveData(data) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const dataWithMetadata = {
    fetchedAt: now.toISOString(),
    posts: data
  };
  
  // Ensure output directory exists
  const outputDir = path.join(__dirname, '../output');
  ensureDirectoryExists(outputDir);
  
  // Save current data to timestamped file
  const filePath = path.join(outputDir, `posts-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dataWithMetadata, null, 2));
  
  // Also update latest data file
  const latestPath = path.join(outputDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(dataWithMetadata, null, 2));
  
  return filePath;
}

// Update summary data file
function updateSummary() {
  const outputDir = path.join(__dirname, '../output');
  ensureDirectoryExists(outputDir);
  
  // Read all JSON files
  const files = fs.readdirSync(outputDir)
    .filter(f => f.endsWith('.json') && f !== 'latest.json' && f !== 'summary.json')
    .sort()
    .reverse();
  
  // If not enough data, return
  if (files.length === 0) {
    return;
  }
  
  // Read each file and extract data
  const allData = [];
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(outputDir, file), 'utf-8');
      const data = JSON.parse(content);
      allData.push({
        timestamp: data.fetchedAt,
        postCount: data.posts.length,
        totalVotes: data.posts.reduce((sum, post) => sum + post.votesCount, 0),
        topPosts: data.posts.slice(0, 5).map(p => ({
          name: p.name,
          votes: p.votesCount,
          url: p.url
        }))
      });
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
    }
  }
  
  // Save summary data
  const summaryPath = path.join(outputDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify({
    lastUpdated: new Date().toISOString(),
    dataPoints: allData
  }, null, 2));
}

// Main function
;(async () => {
  try {
    const posts = await fetchPosts();
    const savedPath = saveData(posts);
    console.log(`Data saved to: ${savedPath}`);
    
    // Update summary data
    updateSummary();
    console.log('Summary data updated');
  } catch (err) {
    console.error('Error details:', err);
    process.exit(1);
  }
})();
