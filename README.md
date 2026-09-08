# Product Hunt Trend Analysis

An automated tool for hourly collection and analysis of trending products on Product Hunt, with visualization through GitHub Pages.

## Features

- 🕒 Hourly automatic data collection from Product Hunt
- 📊 Multiple data visualization charts showing trends
- 🔄 Automatic GitHub Pages website updates
- 📱 Responsive design for all devices
- 🔍 SEO optimized for search engines

## Local Development

To run this project locally, follow these steps:

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/product-hunt-snapshot.git
   cd product-hunt-snapshot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create environment variables:
   - Create a `.env` file in the project root
   - Add your Product Hunt API token: `PH_TOKEN=your_token_here`

4. Run data fetch:
   ```
   npm run fetch
   ```

5. Build the website:
   ```
   npm run build
   ```

6. Check the output:
   - Data files are stored in the `output/` directory
   - Website files are generated in the `docs/` directory

## Deployment Guide

1. Fork this repository
2. Add `PH_TOKEN` as a repository secret
3. Enable GitHub Pages using the `docs/` directory as the source
4. Trigger the workflow or wait for the scheduled task to run automatically

## Tech Stack

- Node.js - Backend runtime
- Chart.js - Data visualization
- Bootstrap 5 - Frontend UI framework
- EJS - Template engine
- GitHub Actions - Automated workflow

## Contributing

Contributions and improvement suggestions are welcome! Please fork the repository and submit a pull request.

## License

ISC