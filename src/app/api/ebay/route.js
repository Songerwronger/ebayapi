import { NextResponse } from 'next/server';

const EBAY_API_URL = 'https://api.ebay.com/buy/browse/v1/item_summary/search';

// eBay category IDs for better filtering
const EBAY_CATEGORIES = {
  // Electronics categories
  PHONES: '9355', // Cell Phones & Smartphones
  PHONE_ACCESSORIES: '9394', // Cell Phone Accessories
  LAPTOPS: '175672', // Laptops & Netbooks
  TABLETS: '171485', // Tablets & eReaders
  CAMERAS: '31388', // Digital Cameras
  GAMING_CONSOLES: '139971', // Video Game Consoles

  // Tools categories
  POWER_TOOLS: '631', // Power Tools
  HAND_TOOLS: '42265', // Hand Tools

  // Bikes categories
  BIKES: '177831', // Bicycles
  BIKE_ACCESSORIES: '177832', // Bicycle Accessories
};

// Category maps for inclusion/exclusion based on search type
const CATEGORY_MAPS = {
  phones: {
    include: [EBAY_CATEGORIES.PHONES],
    exclude: [EBAY_CATEGORIES.PHONE_ACCESSORIES]
  },
  laptops: {
    include: [EBAY_CATEGORIES.LAPTOPS],
    exclude: []
  },
  tablets: {
    include: [EBAY_CATEGORIES.TABLETS],
    exclude: []
  },
  cameras: {
    include: [EBAY_CATEGORIES.CAMERAS],
    exclude: []
  },
  gaming: {
    include: [EBAY_CATEGORIES.GAMING_CONSOLES],
    exclude: []
  },
  tools: {
    include: [EBAY_CATEGORIES.POWER_TOOLS, EBAY_CATEGORIES.HAND_TOOLS],
    exclude: []
  },
  bikes: {
    include: [EBAY_CATEGORIES.BIKES],
    exclude: [EBAY_CATEGORIES.BIKE_ACCESSORIES]
  }
};

// Helper function to format the date
function formatDate(dateString) {
  if (!dateString) return null;
  try {
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

// Helper function to determine which categories to include/exclude based on search
function getCategoryFilters(searchTerm) {
  const term = searchTerm.toLowerCase();
  
  // Check for phone searches
  if (term.includes('iphone') || term.includes('samsung') || term.includes('pixel') || 
      term.includes('smartphone') || term.includes('mobile phone')) {
    return CATEGORY_MAPS.phones;
  }
  
  // Check for laptop searches
  if (term.includes('laptop') || term.includes('macbook') || term.includes('notebook')) {
    return CATEGORY_MAPS.laptops;
  }
  
  // Check for tablet searches
  if (term.includes('tablet') || term.includes('ipad') || term.includes('e-reader') || 
      term.includes('kindle')) {
    return CATEGORY_MAPS.tablets;
  }
  
  // Check for camera searches
  if (term.includes('camera') || term.includes('dslr') || term.includes('mirrorless')) {
    return CATEGORY_MAPS.cameras;
  }
  
  // Check for gaming console searches
  if (term.includes('xbox') || term.includes('playstation') || term.includes('nintendo') || 
      term.includes('switch') || term.includes('console')) {
    return CATEGORY_MAPS.gaming;
  }
  
  // Check for tool searches
  if (term.includes('drill') || term.includes('saw') || term.includes('tool') || 
      term.includes('screwdriver') || term.includes('hammer')) {
    return CATEGORY_MAPS.tools;
  }
  
  // Check for bike searches
  if (term.includes('bike') || term.includes('bicycle') || term.includes('mountain bike') || 
      term.includes('road bike') || term.includes('cycle')) {
    return CATEGORY_MAPS.bikes;
  }
  
  // Default - no category filtering
  return { include: [], exclude: [] };
}

// Helper function to filter items by exact title match
function filterItemsByTitle(items, searchTerm, strictMode = false) {
  if (!items || !items.length) return [];
  
  // Clean up search term - remove category text that gets added by the UI
  const cleanSearchTerm = searchTerm
    .replace(/electronics/i, '')
    .replace(/phones\s*&\s*smartphones/i, '')
    .trim();
  
  console.log(`Cleaned up search term: "${searchTerm}" -> "${cleanSearchTerm}"`);
  
  // Special handling for iPhone searches
  const isIphoneSearch = cleanSearchTerm.toLowerCase().includes('iphone');
  
  if (isIphoneSearch) {
    // Extract the iPhone model number from the search
    const modelMatch = cleanSearchTerm.match(/iphone\s*(\d+)(\s*(?:pro|plus|max|mini))?/i);
    
    if (modelMatch) {
      const modelNumber = modelMatch[1]; // e.g., "15" from "iPhone 15"
      const modelVariant = modelMatch[2] ? modelMatch[2].trim().toLowerCase() : ''; // e.g., "pro" from "iPhone 15 Pro"
      
      console.log(`iPhone search detected: Model ${modelNumber}, Variant: ${modelVariant || 'standard'}`);
      
      // Filter based on iPhone model - extremely permissive
      return items.filter(item => {
        if (!item.title) return false;
        const itemTitle = item.title.toLowerCase();
        
        // Look for iPhone model in title - very basic check
        return itemTitle.includes(`iphone`) && itemTitle.includes(modelNumber);
      });
    }
  }
  
  // Special handling for Samsung searches - EXTREMELY permissive approach
  const isSamsungSearch = cleanSearchTerm.toLowerCase().includes('samsung');
  
  if (isSamsungSearch) {
    // Extract the Samsung model from the search
    const modelMatch = cleanSearchTerm.match(/samsung\s*(\w+)(\s*(?:plus|ultra|fe|edge))?/i);
    
    if (modelMatch) {
      const modelSeries = modelMatch[1]; // e.g., "S22" from "Samsung S22"
      
      console.log(`Samsung search detected: Model ${modelSeries}`);
      
      // Filter based on Samsung model - extremely permissive approach
      return items.filter(item => {
        if (!item.title) return false;
        const itemTitle = item.title.toLowerCase();
        
        // Super permissive Samsung check - just make sure it has the model number somewhere
        // For S22, accept any mention of s22, galaxy s22, etc.
        return itemTitle.includes(modelSeries.toLowerCase());
      });
    }
  }
  
  // Check for Samsung without explicit "Samsung" keyword - extremely permissive
  const samsungModelMatch = cleanSearchTerm.match(/^s(\d+)(\s*(?:plus|ultra|fe|edge))?$/i);
  if (samsungModelMatch) {
    const modelNumber = samsungModelMatch[1]; // "22" from "S22"
    
    console.log(`Samsung model detected: S${modelNumber}`);
    
    // Extremely permissive matching for S22 format
    return items.filter(item => {
      if (!item.title) return false;
      const itemTitle = item.title.toLowerCase();
      
      // Super permissive check - just look for s22 anywhere in the title
      return itemTitle.includes(`s${modelNumber}`);
    });
  }
  
  // Default handling for non-iPhone/Samsung searches - extremely permissive
  const essentialTerms = cleanSearchTerm.toLowerCase().trim().split(/\s+/);
  
  return items.filter(item => {
    if (!item.title) return false;
    const itemTitle = item.title.toLowerCase();
    
    // Only require any single term to match
    return essentialTerms.some(term => itemTitle.includes(term));
  });
}

// Helper function to normalize condition display text and match to our condition filters
function normalizeCondition(ebayCondition) {
  if (!ebayCondition) return 'Not Specified';
  
  const conditionLower = ebayCondition.toLowerCase();
  
  // Map raw eBay condition strings to our normalized categories
  if (conditionLower.includes('new') && !conditionLower.includes('open') && !conditionLower.includes('refurbished')) {
    return 'New';
  } else if (conditionLower.includes('brand new') || conditionLower.includes('sealed') || conditionLower.includes('unopened')) {
    return 'New';
  } else if (conditionLower.includes('open box') || conditionLower.includes('opened')) {
    return 'Open Box';
  } else if (conditionLower.includes('refurbished') || conditionLower.includes('certified')) {
    return 'Refurbished';
  } else if (
    conditionLower.includes('used') || 
    conditionLower.includes('pre-owned') || 
    conditionLower.includes('good') || 
    conditionLower.includes('excellent') ||
    conditionLower.includes('acceptable')
  ) {
    return 'Used';
  }
  
  // Default fallback - more lenient approach
  if (conditionLower.includes('sealed') || conditionLower.includes('boxed')) {
    return 'New';
  } else if (conditionLower.includes('preowned') || conditionLower.includes('pre owned')) {
    return 'Used';
  }
  
  // If still no match, use a reasonable default
  return 'Not Specified';
}

// Helper function to filter out obvious accessories based on search type
function filterOutAccessories(items, searchTerm) {
  if (!items || !items.length) return [];
  
  const cleanSearchTerm = searchTerm.toLowerCase().trim();
  
  // Different filtering strategies based on search type
  const isPhoneSearch = cleanSearchTerm.includes('iphone') || 
                       cleanSearchTerm.includes('samsung') || 
                       cleanSearchTerm.includes('pixel') ||
                       (cleanSearchTerm.match(/^s\d+/i) !== null); // S22, etc.
  
  const isElectronicsSearch = isPhoneSearch || 
                             cleanSearchTerm.includes('laptop') || 
                             cleanSearchTerm.includes('tablet') ||
                             cleanSearchTerm.includes('camera');
  
  // Check for specific models to customize filtering
  const isSamsungS22 = cleanSearchTerm.includes('samsung s22') || 
                      cleanSearchTerm === 's22' ||
                      cleanSearchTerm.match(/^s22(\s|$)/i) !== null ||
                      cleanSearchTerm.match(/samsung\s+s22/i) !== null;
  
  console.log(`Search type: ${isPhoneSearch ? 'Phone' : isElectronicsSearch ? 'Electronics' : 'Other'}`);
  if (isSamsungS22) console.log('Samsung S22 specific search detected');
  
  // Track filtering stats
  let accessoryCount = 0;
  let lowPriceCount = 0;
  let keptItems = 0;
  
  const filteredItems = items.filter(item => {
    if (!item.title) return true; // Keep items with no title
    
    const itemTitle = item.title.toLowerCase();
    const price = parseFloat(item.price?.value || '0');
    
    // Common accessory terms that apply to most products
    const commonAccessoryTerms = [
      'case', 'cover', 'protector', 'screen protector', 'tempered glass',
      'skin', 'sticker', 'decal', 'wrap', 'pouch'
    ];
    
    // For electronics searches, also filter out these terms
    const electronicsAccessoryTerms = [
      'charger', 'charging', 'cable', 'adapter', 'stand', 'dock',
      'holder', 'mount', 'car', 'armband', 'stylus', 'pen'
    ];
    
    // Audio accessory terms - separated to allow flexibility
    const audioAccessoryTerms = [
      'earphone', 'headphone', 'earbud', 'headset', 'speaker', 'audio'
    ];
    
    // For phone searches, also filter out these phone-specific accessory terms
    const phoneAccessoryTerms = [
      'unlock', 'code', 'replacement', 'repair', 'kit',
      'back cover', 'battery', 'sim tray', 'camera lens',
      'lens protector', 'housing'
    ];
    
    // Special case - screen items can be legitimate products for non-phone searches
    const screenTerms = ['screen', 'display', 'lcd', 'digitizer', 'back glass'];
    
    // Special handling for Samsung S22 - we want to keep actual phones
    if (isSamsungS22) {
      // Specifically match the screen protector we saw in results
      if (itemTitle.includes('for samsung galaxy s24 s22 5g s21') && 
          itemTitle.includes('tempered glass screen protector')) {
        console.log('Filtered specifically matched screen protector');
        accessoryCount++;
        return false;
      }
      
      // If the title contains specific terms related to screen protectors for S22
      if (itemTitle.includes('tempered glass') || 
          (itemTitle.includes('screen') && itemTitle.includes('protector')) ||
          (itemTitle.includes('glass') && (price < 20 || itemTitle.includes('protect')))) {
        accessoryCount++;
        return false; // Filter out screen protectors
      }
      
      // If it's clearly about S22, but price is very low, it's likely an accessory
      if (itemTitle.includes('s22') && price < 30 && 
          !itemTitle.includes('phone') && !itemTitle.includes('smartphone')) {
        lowPriceCount++;
        return false;
      }
      
      // Check for audio accessories
      if (audioAccessoryTerms.some(term => itemTitle.includes(term))) {
        accessoryCount++;
        return false;
      }
      
      // Check for standard accessories
      if ((itemTitle.includes('s22') || itemTitle.includes('samsung')) && 
          commonAccessoryTerms.some(term => itemTitle.includes(term))) {
        accessoryCount++;
        return false;
      }
      
      // Otherwise, likely a phone - keep it
      keptItems++;
      return true;
    }
    
    // Check based on search type
    if (isPhoneSearch) {
      // For phones, check title against all accessory types
      const isAccessory = [...commonAccessoryTerms, ...electronicsAccessoryTerms, ...phoneAccessoryTerms, ...audioAccessoryTerms]
        .some(term => itemTitle.includes(term));
      
      // Special check for screen accessories that may not include the word "protector"
      const isScreenAccessory = 
        ((itemTitle.includes('screen') || itemTitle.includes('glass')) && 
        !itemTitle.includes('smartphone') && !itemTitle.includes('phone'));
      
      // Check for price - genuine phones are usually over a certain price
      const isTooLow = !isNaN(price) && price < 30; // too cheap to be a phone
      
      if (isAccessory || isScreenAccessory || isTooLow) {
        if (isAccessory) accessoryCount++;
        if (isTooLow) lowPriceCount++;
        return false;
      }
      
      keptItems++;
      return true;
    }
    else if (isElectronicsSearch) {
      // For general electronics, check against common and electronics accessory terms
      // Be more lenient - only filter obvious accessories
      const isAccessory = commonAccessoryTerms.some(term => itemTitle.includes(term)) &&
                        // If the search is for an accessory, don't filter it out
                        !commonAccessoryTerms.some(term => cleanSearchTerm.includes(term));
      
      // Only filter audio accessories if they're not part of the search
      const isAudioAccessory = audioAccessoryTerms.some(term => itemTitle.includes(term)) &&
                              !audioAccessoryTerms.some(term => cleanSearchTerm.includes(term));
      
      if (isAccessory || isAudioAccessory) {
        accessoryCount++;
        return false;
      }
      
      keptItems++;
      return true;
    }
    else {
      // For non-electronics items, be very lenient - just filter out the most obvious accessories
      // For general items, many "accessory terms" might be part of the actual product
      const isAccessory = commonAccessoryTerms.some(term => 
        // Make sure the term is not part of the search before filtering
        !cleanSearchTerm.includes(term) && itemTitle.includes(term)
      );
      
      if (isAccessory) {
        accessoryCount++;
        return false;
      }
      
      keptItems++;
      return true;
    }
  });
  
  console.log(`Filtering stats: ${accessoryCount} accessories, ${lowPriceCount} low-price items filtered. Kept ${keptItems} items.`);
  
  return filteredItems;
}

export async function GET(request) {
  try {
    // Define headers at the start of the function so it's available everywhere
    const headers = {
      'Cache-Control': 'no-store, max-age=0, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    };

    const url = new URL(request.url);
    let query = url.searchParams.get('query');
    const timeRange = url.searchParams.get('timeRange') || 'week';
    const condition = url.searchParams.get('conditions');
    const exactMatch = url.searchParams.get('exactMatch') !== 'false'; // Default to true
    const cacheKey = url.searchParams.get('_t') || Date.now(); // Cache busting parameter

    console.log(`API request with cache key: ${cacheKey}`, { 
      query, 
      timeRange, 
      condition,
      exactMatch
    });

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400, headers });
    }

    // Store original query for post-filtering
    const originalQuery = query;

    const token = process.env.EBAY_ACCESS_TOKEN?.trim();
    
    if (!token) {
      console.error('No eBay access token found in environment variables');
      return NextResponse.json({ 
        error: 'eBay API configuration error',
        details: 'Access token is missing. Please check your .env.local file.'
      }, { status: 500, headers });
    }

    // Clean up token - remove quotes if present
    const cleanToken = token.replace(/^["']|["']$/g, '');

    // Calculate date range - use MUCH broader ranges
    const now = new Date();
    let daysAgo;
    
    switch (timeRange) {
      case 'week':
        daysAgo = 14;  // Two weeks instead of one
        break;
      case 'month':
        daysAgo = 45;  // 45 days instead of 30
        break;
      case 'year':
        daysAgo = 500; // Significantly broader than a year
        break;
      default:
        daysAgo = 14;
    }

    const startDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));

    // Build minimal filter array - only include essential filters
    let filterArray = [
      'buyingOptions:{FIXED_PRICE|AUCTION}',
      'soldItemsOnly:true'
    ];

    // Add date filter for items ending within our time range
    filterArray.push(`itemEndDate:[${startDate.toISOString()}]`);

    // Move condition filtering to post-processing for more precise control
    // We'll fetch all items and filter by condition later
    
    console.log('Final filter array:', filterArray);

    const filterString = filterArray.join(',');

    const ebaySearchParams = new URLSearchParams({
      q: query,
      filter: filterString,
      sort: '-itemEndDate',
      limit: '200' // Maximum limit for more results
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
        }, { status: response.status, headers });
      } catch (e) {
        return NextResponse.json({
          error: 'Failed to fetch data from eBay API',
          details: errorText
        }, { status: response.status, headers });
      }
    }

    const data = await response.json();
    let items = data.itemSummaries || [];
    
    // Apply simple term filtering first to keep items related to the search
    if (exactMatch) {
      items = filterBySimpleTerms(items, originalQuery);
    }

    // Now filter out accessories based on search type
    items = filterOutAccessories(items, originalQuery);

    console.log(`After filtering out accessories: ${items.length} items remain`);

    // Process items and apply condition filtering
    let processedItems = items.map(item => {
      if (!item.price?.value) {
        return null;
      }

      // Get normalized condition
      const normalizedCondition = normalizeCondition(item.condition);
      
      return {
        title: item.title || 'No Title',
        price: item.price.value,
        currency: item.price.currency || 'GBP',
        condition: normalizedCondition,
        link: item.itemWebUrl || '#',
        soldDate: formatDate(item.itemEndDate),
        rawCondition: item.condition || 'Not Specified'
      };
    }).filter(Boolean); // Remove null items

    // Apply strict condition filtering if a condition is specified
    if (condition) {
      console.log(`Filtering by condition: ${condition}`);
      const before = processedItems.length;
      
      // Map condition parameter to expected normalized condition values
      const conditionMap = {
        'new': ['New'],
        'openBox': ['Open Box'],
        'refurbished': ['Refurbished'],
        'used': ['Used']
      };
      
      // Get the expected condition values
      const expectedConditions = conditionMap[condition] || [];
      if (expectedConditions.length === 0) {
        console.warn(`Unknown condition filter: ${condition}`);
      } else {
        console.log(`Expected conditions: ${expectedConditions.join(', ')}`);
        
        // Filter items strictly by the normalized condition
        processedItems = processedItems.filter(item => {
          const matches = expectedConditions.includes(item.condition);
          if (!matches) {
            console.log(`Filtered out item with condition '${item.condition}' (expected ${expectedConditions.join(' or ')}): ${item.title.substring(0, 50)}...`);
          }
          return matches;
        });
        
        console.log(`Condition filtering removed ${before - processedItems.length} items`);
      }
    }

    // Calculate average price safely
    const validPrices = processedItems
      .map(item => parseFloat(item.price))
      .filter(price => !isNaN(price));

    const averagePrice = validPrices.length > 0
      ? validPrices.reduce((a, b) => a + b, 0) / validPrices.length
      : 0;

    console.log(`Found ${processedItems.length} items after filtering for ${timeRange} period (original: ${data.itemSummaries?.length || 0})`);

    return NextResponse.json({
      items: processedItems,
      averagePrice,
      totalItems: processedItems.length
    }, { headers });

  } catch (error) {
    console.error('Error in eBay API route:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500, headers });
  }
}

// Extremely simple filtering that just looks for any matching term
function filterBySimpleTerms(items, searchTerm) {
  if (!items || !items.length) return [];
  
  const terms = searchTerm.toLowerCase().trim().split(/\s+/);
  
  return items.filter(item => {
    if (!item.title) return false;
    const itemTitle = item.title.toLowerCase();
    
    // Match if ANY of the search terms appear in the title
    return terms.some(term => itemTitle.includes(term));
  });
}