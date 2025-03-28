const axios = require('axios');
const qs = require('qs');

async function getEbayToken() {
  const clientId = 'CashItIn-1-PRD-bc201f31e-bd863578';
  const clientSecret = 'PRD-afd69601e89f-4d86-4f33-8089-b00b';
  const ruName = 'Jake_Cawthray-CashItIn-1-PRD-bc201f31e-bd863578';
  
  try {
    const response = await axios({
      method: 'post',
      url: 'https://api.ebay.com/identity/v1/oauth2/token',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      data: qs.stringify({
        grant_type: 'client_credentials',
        scope: 'https://api.ebay.com/oauth/api_scope/buy.item.feed https://api.ebay.com/oauth/api_scope/buy.marketing https://api.ebay.com/oauth/api_scope/buy.item.bulk https://api.ebay.com/oauth/api_scope/buy.item'
      }),
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting eBay token:', error.response?.data || error.message);
    throw error;
  }
}

// Run the token generation
getEbayToken()
  .then(token => {
    console.log('Your eBay Access Token:');
    console.log(token);
    console.log('\nAdd this token to your .env.local file as EBAY_ACCESS_TOKEN');
  })
  .catch(error => {
    console.error('Failed to get token:', error);
  }); 