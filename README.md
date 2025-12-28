# 🔥 Hyrox Roast Generator

A web application that takes a Hyrox results URL, scrapes the performance data, and generates a humorous roast using Google's Gemini API. Perfect for sharing your (roasted) performance on social media!

## Features

- 💳 Secure payment processing via Stripe (£0.50 GBP / $0.50 USD per roast)
- 🎯 Scrapes Hyrox results from hyresult.com
- 🤖 Generates witty, playful roasts using Gemini AI
- 📊 Displays performance stats (time, positions, splits)
- 🖼️ Generates shareable image cards
- 📱 Social media sharing (Twitter, Facebook)
- 📋 Copy-to-clipboard functionality

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))
- Stripe account ([Sign up here](https://stripe.com)) for payment processing

### Installation

1. Clone or download this repository

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```bash
cp .env.example .env
```

4. Add your API keys to `.env`:
```
GEMINI_API_KEY=your_api_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
PORT=3000
```

**Getting Stripe Keys:**
1. Sign up for a Stripe account at [stripe.com](https://stripe.com)
2. Go to the [Stripe Dashboard](https://dashboard.stripe.com)
3. Navigate to Developers > API keys
4. Copy your **Publishable key** (starts with `pk_test_` or `pk_live_`)
5. Copy your **Secret key** (starts with `sk_test_` or `sk_live_`)
6. Add both to your `.env` file

5. Start the server:
```bash
npm start
```

6. Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. Go to [hyresult.com](https://www.hyresult.com) and find your race results
2. Copy the results URL (e.g., `https://www.hyresult.com/result/LR3MS4JI2BA7B6`)
3. Paste the URL into the input field on the homepage
4. Select your preferred currency (GBP or USD)
5. Click "Continue to Payment"
6. Enter your payment details (Stripe secure payment form)
7. Complete payment (£0.50 / $0.50)
8. Wait for your personalized roast to be generated
9. Share it on social media or download the image!

## Project Structure

```
/
├── server.js              # Express backend server
├── package.json           # Dependencies
├── .env                   # Environment variables (create this)
├── .env.example           # Environment variables template
├── public/
│   ├── index.html         # Main frontend page
│   ├── style.css          # Styling
│   ├── app.js             # Frontend JavaScript
│   └── share-card.js      # Image generation for shareable cards
└── README.md              # This file
```

## API Endpoints

### GET `/api/config`
Returns Stripe publishable key for frontend initialization.

**Response:**
```json
{
  "stripePublishableKey": "pk_test_..."
}
```

### POST `/api/create-payment-intent`
Creates a Stripe payment intent for roast generation.

**Request:**
```json
{
  "currency": "gbp" // or "usd"
}
```

**Response:**
```json
{
  "clientSecret": "pi_..._secret_...",
  "paymentIntentId": "pi_..."
}
```

### POST `/api/verify-payment`
Verifies that a payment intent has been completed.

**Request:**
```json
{
  "paymentIntentId": "pi_..."
}
```

**Response:**
```json
{
  "verified": true,
  "paymentIntentId": "pi_..."
}
```

### POST `/api/roast`
Generates a roast from a Hyrox results URL. Requires valid payment.

**Request:**
```json
{
  "url": "https://www.hyresult.com/result/YOUR_RESULT_ID",
  "paymentIntentId": "pi_..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "athleteName": "John Doe",
    "overallPosition": "123",
    "categoryPosition": "45",
    "totalTime": "1:23:45",
    "splits": [
      { "workout": "SkiErg", "time": "5:30" },
      ...
    ]
  },
  "roast": "Your roast text here...",
  "prompt": "The prompt used..."
}
```

### GET `/api/health`
Health check endpoint.

## Technologies Used

- **Backend:** Node.js, Express
- **Scraping:** Cheerio, Axios
- **AI:** Google Gemini API
- **Payments:** Stripe
- **Frontend:** Vanilla JavaScript, HTML5 Canvas, Stripe Elements
- **Styling:** CSS3 with modern gradients

## Error Handling

The application includes comprehensive error handling for:
- Invalid URLs
- Scraping failures
- API errors
- Network issues
- Missing data

## Notes

- The scraper attempts to extract data from various HTML structures on hyresult.com
- If certain data isn't found, it will use fallback values
- The Gemini API requires an active API key with sufficient quota
- Rate limiting may apply depending on your Gemini API plan

## License

MIT

## Contributing

Feel free to submit issues or pull requests!

