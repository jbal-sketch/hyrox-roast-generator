# 🔥 Hyrox Roast Generator

A web application that takes a Hyrox results URL, scrapes the performance data, and generates a humorous roast using Google's Gemini API. Perfect for sharing your (roasted) performance on social media!

## Features

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

4. Add your Gemini API key to `.env`:
```
GEMINI_API_KEY=your_api_key_here
PORT=3000
```

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
4. Click "Get Roasted 🔥"
5. Wait for your personalized roast to be generated
6. Share it on social media or download the image!

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

### POST `/api/roast`
Generates a roast from a Hyrox results URL.

**Request:**
```json
{
  "url": "https://www.hyresult.com/result/YOUR_RESULT_ID"
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
- **Frontend:** Vanilla JavaScript, HTML5 Canvas
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

