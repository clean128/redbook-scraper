# Redbook Scraper

A high-performance web scraper for extracting car listing data from Redbook.com.au. This tool uses Playwright with stealth plugins, proxy rotation, and CAPTCHA solving to efficiently scrape vehicle information at scale.

## Features

- 🚗 **Comprehensive Data Extraction**: Scrapes vehicle details including title, price, year, make, model, odometer, engine, transmission, fuel type, and VIN
- 🎭 **Stealth Browsing**: Uses Playwright with stealth plugins to avoid bot detection
- 🔄 **Proxy Rotation**: Integrates with BrightData residential proxies for IP rotation
- 🤖 **CAPTCHA Handling**: Automatic detection and solving of DataDome challenges
- ⚡ **Concurrent Scraping**: Parallel processing with configurable concurrency limits
- 📊 **CSV Export**: Saves all scraped data to CSV format for easy analysis
- 🔁 **Resume Capability**: Tracks seen URLs to avoid duplicates and enable resuming
- 📝 **Logging**: Comprehensive logging with Winston for monitoring and debugging

## Prerequisites

- **Node.js** 16+ (ES modules support required)
- **npm** or **yarn**
- **BrightData Account** (for residential proxy access)
- **2Captcha API Key** (optional, for CAPTCHA solving)

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd redbook-scraper
```

2. Install dependencies:

```bash
npm install
```

3. Install Playwright browsers:

```bash
npx playwright install chromium
```

## Configuration

Edit `config.js` to customize scraping parameters:

```javascript
export const CONFIG = {
  TARGET_LISTINGS: 125000,        // Target number of listings to scrape
  CONCURRENCY: 8,                  // Number of concurrent requests
  DELAY_MIN: 3000,                 // Minimum delay between requests (ms)
  DELAY_MAX: 7000,                 // Maximum delay between requests (ms)
  MAX_RETRIES: 3,                  // Maximum retry attempts
  OUTPUT_FILE: "data/cars.csv",    // Output CSV file path
  LOG_FILE: "logs/scraper.log",    // Log file path
  PROXY_PROVIDER: "brightdata",    // Proxy provider
  BRIGHTDATA_ZONE: "your-proxy-url",
  BRIGHTDATA_USER: "your-username",
  BRIGHTDATA_PASS: "your-password",
  CAPTCHA_KEY: "",                 // 2Captcha API key (optional)
  MAKES: ["Toyota", "Ford", ...],  // Car makes to scrape
  YEARS_START: [2010, 2015, 2020], // Year range start points
  YEARS_END: [2014, 2019, 2025],   // Year range end points
};
```

### BrightData Setup

1. Sign up for a BrightData account
2. Create a residential proxy zone
3. Update `BRIGHTDATA_ZONE`, `BRIGHTDATA_USER`, and `BRIGHTDATA_PASS` in `config.js`

### Optional: 2Captcha Setup

For automatic CAPTCHA solving:

1. Sign up at [2Captcha.com](https://2captcha.com)
2. Add your API key to `CAPTCHA_KEY` in `config.js`

## Usage

### Basic Usage

Start the scraper:

```bash
npm start
```

Or directly:

```bash
node scrape.js
```

### Testing

Test a single query before running the full scraper:

```bash
node test.js
```

This will:

- Test the query building logic
- Check DataDome detection
- Verify proxy connectivity
- Save a screenshot for debugging

## Project Structure

```
redbook-scraper/
├── scrape.js          # Main scraping logic
├── test.js            # Testing script
├── config.js          # Configuration file
├── package.json       # Dependencies and scripts
├── Dockerfile         # Docker configuration
├── utils/
│   ├── browser.js     # Stealth browser setup
│   ├── proxy.js       # Proxy rotation logic
│   ├── solver.js      # CAPTCHA solving
│   └── logger.js      # Logging configuration
├── data/              # Output directory (auto-created)
│   ├── cars.csv       # Scraped data
│   └── seen.txt       # Tracked URLs
└── logs/              # Log files (auto-created)
    └── scraper.log    # Application logs
```

## How It Works

1. **Query Generation**: Builds Lucene queries for different make/year combinations
2. **Results Page Scraping**: Navigates through paginated results pages
3. **Detail Extraction**: Visits each listing URL and extracts vehicle details
4. **Data Storage**: Writes extracted data to CSV and tracks seen URLs
5. **Rate Limiting**: Implements random delays to avoid detection
6. **Error Handling**: Retries failed requests and logs errors

## Docker Support

Build and run with Docker:

```bash
docker build -t redbook-scraper .
docker run redbook-scraper
```

## Output Format

The scraper generates a CSV file (`data/cars.csv`) with the following columns:

- **Title**: Vehicle title
- **Price**: Listing price
- **Year**: Model year
- **Make**: Car manufacturer
- **Model**: Car model
- **Odometer**: Mileage/kilometers
- **Engine**: Engine size/type
- **Transmission**: Transmission type
- **Fuel Type**: Fuel type (petrol, diesel, etc.)
- **VIN**: Vehicle Identification Number
- **URL**: Source listing URL

## Troubleshooting

### Installation Issues

If you encounter `csv-writer` version errors:

- The project uses `csv-writer@^1.6.0`
- Delete `package-lock.json` and `node_modules`, then run `npm install` again

### Proxy Issues

- Verify BrightData credentials are correct
- Check proxy zone is active and has available IPs
- Test proxy connectivity with `test.js`

### CAPTCHA Issues

- If DataDome blocks persist, add a 2Captcha API key
- Increase delays in `config.js` to reduce detection
- Check logs for specific error messages

### Browser Issues

- Ensure Playwright browsers are installed: `npx playwright install chromium`
- For Docker, browsers are installed automatically

## Performance

- **Concurrency**: Default 8 concurrent requests (adjustable in config)
- **Rate Limiting**: 3-7 second delays between requests
- **Target**: Designed to scrape ~125,000 listings
- **Resume**: Automatically resumes from last position using `seen.txt`

## Legal & Ethical Considerations

⚠️ **Important**:

- Ensure you comply with Redbook.com.au's Terms of Service
- Respect rate limits and robots.txt
- Use scraped data responsibly
- Consider reaching out to Redbook for official API access
