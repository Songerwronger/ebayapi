import { NextResponse } from 'next/server';

const EBAY_API_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

// Helper function to format the date
function formatDate(dateString) {
  if (!dateString) return null;
  try {
    // Log the incoming date string for debugging
    console.log('Formatting date:', dateString);
    
    // Parse the date - eBay uses ISO format
    const date = new Date(dateString);
    
    // Validate the date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date:', dateString);
      return null;
    }
    
    // Format the date in UK format
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    console.warn('Error formatting date:', dateString, e);
    return null;
  }
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get('query');
    const timeRange = url.searchParams.get('timeRange') || 'week';
    const condition = url.searchParams.get('conditions');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    const token = process.env.EBAY_ACCESS_TOKEN?.trim();
    
    if (!token) {
      console.error('No eBay access token found in environment variables');
      return NextResponse.json({ 
        error: 'eBay API configuration error',
        details: 'Access token is missing. Please check your .env.local file.'
      }, { status: 500 });
    }

    // Clean up token - remove quotes if present
    const cleanToken = token.replace(/^["']|["']$/g, '');

    // Calculate date range
    const now = new Date();
    let daysAgo;
    switch (timeRange) {
      case 'week':
        daysAgo = 7;
        break;
      case 'month':
        daysAgo = 30;
        break;
      case 'year':
        daysAgo = 365;
        break;
      default:
        daysAgo = 7;
    }

    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Build filter string
    let filterArray = [
      'buyingOptions:{FIXED_PRICE|AUCTION}',
      'deliveryCountry:GB',
      'itemLocationCountry:GB'
    ];

    // Add date filter for items ending within our time range
    filterArray.push(`itemEndDate:[${startDate.toISOString()}]`);

    // Add condition filter if specified
    if (condition) {
      const conditionMap = {
        new: 'NEW',
        openBox: 'OPEN_BOX',
        refurbished: 'CERTIFIED_REFURBISHED|SELLER_REFURBISHED',
        used: 'USED_EXCELLENT|USED_VERY_GOOD|USED_GOOD|USED_ACCEPTABLE'
      };

      if (conditionMap[condition]) {
        filterArray.push(`itemCondition:{${conditionMap[condition]}}`);
      }
    }

    const filterString = filterArray.join(',');

    const ebaySearchParams = new URLSearchParams({
      q: query,
      filter: filterString,
      sort: '-itemEndDate',
      limit: '100'
    });

    const apiUrl = `${EBAY_API_URL}?${ebaySearchParams}`;
    console.log('Making eBay API request to:', apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${cleanToken}`,
        'X-EBAY-C-MARKETPLACE-ID': 'EBAY_GB',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('eBay API error response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });

      try {
        const errorJson = JSON.parse(errorText);
        return NextResponse.json({
          error: 'Failed to fetch data from eBay API',
          details: errorJson.errors?.[0]?.longMessage || errorText
        }, { status: response.status });
      } catch (e) {
        return NextResponse.json({
          error: 'Failed to fetch data from eBay API',
          details: errorText
        }, { status: response.status });
      }
    }

    const data = await response.json();
    
    // Debug log the first item to see its structure
    if (data.itemSummaries?.[0]) {
      console.log('Sample item data:', {
        title: data.itemSummaries[0].title,
        itemEndDate: data.itemSummaries[0].itemEndDate,
        legacyItemId: data.itemSummaries[0].legacyItemId,
        price: data.itemSummaries[0].price
      });
    }

    const items = data.itemSummaries || [];

    // Safely map items with price validation
    const processedItems = items.map(item => {
      if (!item.price?.value) {
        console.warn('Item missing price:', item);
        return null;
      }

      // Log each item's date for debugging
      console.log('Processing item date:', {
        itemId: item.legacyItemId,
        rawDate: item.itemEndDate,
        formattedDate: formatDate(item.itemEndDate)
      });

      return {
        title: item.title || 'No Title',
        price: item.price.value,
        currency: item.price.currency || 'GBP',
        condition: item.condition || 'Not Specified',
        link: item.itemWebUrl || '#',
        soldDate: formatDate(item.itemEndDate)
      };
    }).filter(Boolean); // Remove null items

    // Calculate average price safely
    const validPrices = processedItems
      .map(item => parseFloat(item.price))
      .filter(price => !isNaN(price));

    const averagePrice = validPrices.length > 0
      ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
      : 0;

    return NextResponse.json({
      items: processedItems,
      averagePrice,
      totalItems: processedItems.length
    });

  } catch (error) {
    console.error('Error in eBay API route:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 