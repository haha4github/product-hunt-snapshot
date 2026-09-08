// scripts/fetch_producthunt.js
const fs = require('fs');
const path = require('path');

const TOKEN = process.env.PH_TOKEN;
if (!TOKEN) {
  console.error('Missing PH_TOKEN environment variable');
  process.exit(1);
}

// summary.json 只保留最近 ~90 天的小时级数据点
const MAX_SUMMARY_POINTS = 2200;

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

  if (!json.data || !json.data.posts) {
    throw new Error(`API returned invalid data: ${JSON.stringify(json).slice(0, 500)}`);
  }

  return json.data.posts.edges.map(e => e.node);
}

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 保存当次快照:posts-<timestamp>.json + latest.json
function saveData(data) {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const dataWithMetadata = {
    fetchedAt: now.toISOString(),
    posts: data
  };

  const outputDir = path.join(__dirname, '../output');
  ensureDirectoryExists(outputDir);

  const filePath = path.join(outputDir, `posts-${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(dataWithMetadata, null, 2));

  const latestPath = path.join(outputDir, 'latest.json');
  fs.writeFileSync(latestPath, JSON.stringify(dataWithMetadata, null, 2));

  return { filePath, dataWithMetadata };
}

// 累积式更新 summary.json:读取已有历史,追加本次数据点,按时间排序并封顶。
// CI 中已有历史由 workflow 从 data-archive 分支恢复到 output/summary.json。
function updateSummary(snapshot) {
  const outputDir = path.join(__dirname, '../output');
  ensureDirectoryExists(outputDir);
  const summaryPath = path.join(outputDir, 'summary.json');

  let dataPoints = [];
  if (fs.existsSync(summaryPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      if (Array.isArray(existing.dataPoints)) {
        dataPoints = existing.dataPoints;
      }
    } catch (err) {
      console.error('Could not parse existing summary.json, starting fresh:', err.message);
    }
  }

  const point = {
    timestamp: snapshot.fetchedAt,
    postCount: snapshot.posts.length,
    totalVotes: snapshot.posts.reduce((sum, post) => sum + (post.votesCount || 0), 0),
    topPosts: snapshot.posts.slice(0, 5).map(p => ({
      name: p.name || 'Unknown',
      votes: p.votesCount || 0,
      url: p.url || '#'
    }))
  };

  dataPoints = dataPoints
    .filter(p => p.timestamp !== point.timestamp)
    .concat(point)
    .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    .slice(-MAX_SUMMARY_POINTS);

  fs.writeFileSync(summaryPath, JSON.stringify({
    lastUpdated: new Date().toISOString(),
    dataPoints
  }, null, 2));

  return dataPoints.length;
}

;(async () => {
  try {
    const posts = await fetchPosts();
    const { filePath, dataWithMetadata } = saveData(posts);
    console.log(`Fetched ${posts.length} posts, saved to: ${filePath}`);

    const pointCount = updateSummary(dataWithMetadata);
    console.log(`Summary updated: ${pointCount} data points`);
  } catch (err) {
    console.error('Error details:', err);
    process.exit(1);
  }
})();
