// scripts/fetch_producthunt.js
const fetch = require('node-fetch');

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
        posts(order: RANK, first: 20) {
          edges {
            node {
              id
              name
              tagline
              url
              votesCount
              commentsCount
              createdAt
            }
          }
        }
      }`
    })
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  const json = await res.json();
  
  // 调试响应
  console.error('API Response:', JSON.stringify(json, null, 2));
  
  if (!json.data) {
    throw new Error(`API返回了无效数据: ${JSON.stringify(json)}`);
  }
  
  if (!json.data.posts) {
    throw new Error(`API返回了无效的posts数据: ${JSON.stringify(json.data)}`);
  }
  
  return json.data.posts.edges.map(e => e.node);
}

;(async () => {
  try {
    const posts = await fetchPosts();
    console.log(JSON.stringify({
      fetchedAt: new Date().toISOString(),
      posts
    }, null, 2));
  } catch (err) {
    console.error('错误详情:', err);
    process.exit(1);
  }
})();
