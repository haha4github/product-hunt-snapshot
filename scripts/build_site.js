// scripts/build_site.js
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');

// 确保目录存在
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// 读取数据
function readData() {
  const outputDir = path.join(__dirname, '../output');
  
  // 读取最新数据
  let latestData = { posts: [] };
  try {
    const latestPath = path.join(outputDir, 'latest.json');
    if (fs.existsSync(latestPath)) {
      latestData = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
    }
  } catch (err) {
    console.error('读取最新数据失败:', err);
  }
  
  // 读取汇总数据
  let summaryData = { dataPoints: [] };
  try {
    const summaryPath = path.join(outputDir, 'summary.json');
    if (fs.existsSync(summaryPath)) {
      summaryData = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
    }
  } catch (err) {
    console.error('读取汇总数据失败:', err);
  }
  
  return {
    latest: latestData,
    summary: summaryData
  };
}

// 构建网站
async function buildSite() {
  const data = readData();
  const docsDir = path.join(__dirname, '../docs');
  ensureDirectoryExists(docsDir);
  
  // 复制静态资源
  ensureDirectoryExists(path.join(docsDir, 'js'));
  ensureDirectoryExists(path.join(docsDir, 'css'));
  
  // 创建数据JS文件
  fs.writeFileSync(
    path.join(docsDir, 'js/data.js'),
    `const phData = ${JSON.stringify(data)};`
  );
  
  // 当前年份
  const currentYear = new Date().getFullYear();
  
  // 渲染主页
  const templatePath = path.join(__dirname, '../templates/index.ejs');
  const html = await ejs.renderFile(templatePath, {
    title: 'Product Hunt Trend Analysis',
    description: 'Real-time tracking of trending products and changes on Product Hunt',
    lastUpdated: data.latest.fetchedAt || new Date().toISOString(),
    currentYear
  });
  
  fs.writeFileSync(path.join(docsDir, 'index.html'), html);
  
  // 渲染趋势页面
  const trendsTemplatePath = path.join(__dirname, '../templates/trends.ejs');
  const trendsHtml = await ejs.renderFile(trendsTemplatePath, {
    currentYear
  });
  
  fs.writeFileSync(path.join(docsDir, 'trends.html'), trendsHtml);
  
  // 创建关于页面
  const aboutHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>About Us - Product Hunt Trend Analysis</title>
  <meta name="description" content="Learn more about the Product Hunt Trend Analysis tool">
  <meta name="keywords" content="Product Hunt, Trend Analysis, About Us">
  
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css">
  <link rel="stylesheet" href="css/styles.css">
  <link rel="icon" href="favicon.ico">
</head>
<body>
  <header class="bg-dark text-white py-3">
    <div class="container">
      <div class="d-flex justify-content-between align-items-center">
        <h1 class="h3 mb-0">Product Hunt Trend Analysis</h1>
        <nav>
          <ul class="nav">
            <li class="nav-item"><a href="index.html" class="nav-link text-white">Home</a></li>
            <li class="nav-item"><a href="trends.html" class="nav-link text-white">Trends</a></li>
            <li class="nav-item"><a href="about.html" class="nav-link text-white active">About</a></li>
          </ul>
        </nav>
      </div>
    </div>
  </header>

  <main class="container py-4">
    <section class="mb-5">
      <h2>About This Project</h2>
      <p class="lead">Product Hunt Trend Analysis is an automated tool for tracking and analyzing product dynamics on the Product Hunt platform.</p>
      
      <div class="row mt-4">
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-body">
              <h3 class="h5">Project Goals</h3>
              <p>Our goal is to help entrepreneurs, product managers, and tech enthusiasts understand current market trends and discover common characteristics of successful products through data analysis.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-body">
              <h3 class="h5">Data Source</h3>
              <p>All data comes from the official Product Hunt API, updated hourly to ensure real-time accuracy.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-body">
              <h3 class="h5">Technology</h3>
              <p>This project uses Node.js for data collection, GitHub Actions for automated deployment, and Chart.js for data visualization.</p>
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card mb-4">
            <div class="card-body">
              <h3 class="h5">Contact Us</h3>
              <p>For questions or suggestions, please submit an issue on GitHub or contact us via email.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>

  <footer class="bg-light py-4 mt-5">
    <div class="container">
      <div class="row">
        <div class="col-md-6">
          <p>© ${currentYear} Product Hunt Trend Analysis</p>
        </div>
        <div class="col-md-6 text-md-end">
          <p>Data Source: <a href="https://www.producthunt.com/" target="_blank" rel="noopener">Product Hunt</a></p>
        </div>
      </div>
    </div>
  </footer>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
  
  fs.writeFileSync(path.join(docsDir, 'about.html'), aboutHtml);
  
  // 创建sitemap.xml
  const sitemapContent = generateSitemap();
  fs.writeFileSync(path.join(docsDir, 'sitemap.xml'), sitemapContent);
  
  // 创建robots.txt
  const robotsContent = `User-agent: *\nAllow: /\nSitemap: https://yourdomain.github.io/product-hunt-snapshot/sitemap.xml`;
  fs.writeFileSync(path.join(docsDir, 'robots.txt'), robotsContent);
  
  console.log('Website build complete!');
}

// 生成sitemap
function generateSitemap() {
  const domain = 'https://yourdomain.github.io/product-hunt-snapshot';
  const now = new Date().toISOString();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${domain}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/trends.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${domain}/about.html</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
}

// 运行构建
buildSite().catch(err => {
  console.error('构建失败:', err);
  process.exit(1);
}); 