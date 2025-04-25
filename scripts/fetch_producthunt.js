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
  
  // Log response for debugging but don't include in saved data
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
      const filePath = path.join(outputDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Check if the file contains valid JSON before parsing
      if (!content.trim().startsWith('{')) {
        console.error(`File ${file} does not contain valid JSON. Content starts with: ${content.substring(0, 20)}`);
        continue;
      }
      
      const data = JSON.parse(content);
      
      // Validate the data structure
      if (!data.posts || !Array.isArray(data.posts)) {
        console.error(`File ${file} has invalid data structure`);
        continue;
      }
      
      allData.push({
        timestamp: data.fetchedAt,
        postCount: data.posts.length,
        totalVotes: data.posts.reduce((sum, post) => sum + (post.votesCount || 0), 0),
        topPosts: data.posts.slice(0, 5).map(p => ({
          name: p.name || 'Unknown',
          votes: p.votesCount || 0,
          url: p.url || '#'
        }))
      });
    } catch (err) {
      console.error(`Error processing file ${file}:`, err);
      // Try to read the file content for debugging
      try {
        const rawContent = fs.readFileSync(path.join(outputDir, file), 'utf-8');
        console.error(`First 100 chars of file ${file}:`, rawContent.substring(0, 100));
      } catch (readErr) {
        console.error(`Cannot read file ${file} for debugging:`, readErr);
      }
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
