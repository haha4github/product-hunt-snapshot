// 文件：scripts/fetch_producthunt.js
import fetch from 'node-fetch';

const TOKEN = process.env.PH_TOKEN;
if (!TOKEN) {
  console.error('Missing PRODUCT_HUNT_TOKEN');
  process.exit(1);
}

async function fetchPosts(page = 1) {
  const res = await fetch(`https://api.producthunt.com/v2/api/graphql`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: `
      {
        posts(order: RANK, first: 20, after: null) {
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

  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.data.posts.edges.map(e => e.node);
}

(async () => {
  try {
    const posts = await fetchPosts();
    console.log(JSON.stringify({
      fetchedAt: new Date().toISOString(),
      posts
    }, null, 2));
    const files = fs.readdirSync('./output')
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
    
    const links = files.map(f => `<li><a href="./${f}">${f}</a></li>`).join('\n');
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8"><title>Product Hunt Snapshots</title></head>
    <body>
      <h1>Hourly Product Hunt Snapshots</h1>
      <ul>${links}</ul>
    </body>
    </html>`;
    fs.writeFileSync(path.join('output', 'index.html'), html);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
