# eBay Price Research Tool

A Next.js application that helps you research average sold prices for items on eBay. This tool is particularly useful for businesses managing their online sales on eBay, as it provides quick access to historical price data.

## Features

- Search for any product on eBay
- View average sold prices for different time periods (last week, month, or year)
- See recent sales data with individual prices
- Clean, modern user interface
- Real-time data from eBay's API

## Prerequisites

- Node.js 18.x or later
- eBay Developer Account with API access
- eBay API credentials (App ID, Cert ID, Dev ID, and Access Token)

## Setup

1. Clone the repository:
   ```bash
   git clone [your-repo-url]
   cd ebayidea
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory and add your eBay API credentials:
   ```
   EBAY_APP_ID=your_app_id_here
   EBAY_CERT_ID=your_cert_id_here
   EBAY_DEV_ID=your_dev_id_here
   EBAY_ACCESS_TOKEN=your_access_token_here
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Getting eBay API Credentials

1. Go to the [eBay Developer Program](https://developer.ebay.com/)
2. Create an account or sign in
3. Create a new application to get your credentials
4. Generate an OAuth token for the Browse API
5. Add the credentials to your `.env.local` file

## Usage

1. Enter a product name in the search box
2. Select a time range (last week, month, or year)
3. Click "Search" to see the average price and recent sales data

## Technologies Used

- Next.js 14
- React 19
- TailwindCSS
- eBay Browse API

## License

MIT
