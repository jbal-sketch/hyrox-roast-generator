require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Scrape Hyrox results page
async function scrapeHyroxResults(url) {
  try {
    // Ensure URL has ?tab=splits parameter
    const urlObj = new URL(url);
    if (!urlObj.searchParams.has('tab')) {
      urlObj.searchParams.set('tab', 'splits');
      url = urlObj.toString();
    } else if (urlObj.searchParams.get('tab') !== 'splits') {
      urlObj.searchParams.set('tab', 'splits');
      url = urlObj.toString();
    }
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract athlete name - try multiple selectors
    let athleteName = $('h1').first().text().trim();
    if (!athleteName) {
      athleteName = $('.athlete-name, [data-athlete-name], .name').first().text().trim();
    }
    if (!athleteName) {
      const titleText = $('title').text();
      athleteName = titleText.split('-')[0].trim() || titleText.split('|')[0].trim();
    }
    if (!athleteName) {
      athleteName = 'Unknown Athlete';
    }
    
    // Extract overall position - look for pattern like "#1032 of 1481"
    let overallPosition = 'Unknown';
    // Try to find text with pattern "#number of number" or "#number"
    const allText = $('body').text();
    // Look for pattern: #number of number (e.g., #1032 of 1481)
    const overallMatch = allText.match(/#(\d+)\s+of\s+\d+/i) || 
                        allText.match(/#(\d+)\s*$/m) ||
                        allText.match(/position[:\s]*#?(\d+)/i);
    if (overallMatch) {
      overallPosition = overallMatch[1];
    } else {
      // Try looking for h2 or large text elements that might contain position
      $('h2, h3, .position, [class*="position"], [class*="rank"]').each((i, el) => {
        const text = $(el).text();
        const match = text.match(/#(\d+)\s+of\s+\d+/i) || text.match(/#(\d+)/);
        if (match && overallPosition === 'Unknown') {
          overallPosition = match[1];
          return false; // break
        }
      });
    }
    
    // Extract category/age group position - look for pattern like "#81 in AG 45-49"
    let categoryPosition = 'Unknown';
    // Look for pattern: #number in AG or #number in category
    const categoryMatch = allText.match(/#(\d+)\s+in\s+AG/i) ||
                         allText.match(/#(\d+)\s+in\s+[A-Z]{2}\s+\d+/i) ||
                         allText.match(/age\s+group[:\s]*#?(\d+)/i);
    if (categoryMatch) {
      categoryPosition = categoryMatch[1];
    } else {
      // Try looking in specific elements
      $('h2, h3, .category, [class*="category"], [class*="age"]').each((i, el) => {
        const text = $(el).text();
        const match = text.match(/#(\d+)\s+in\s+AG/i) || text.match(/#(\d+)\s+in/i);
        if (match && categoryPosition === 'Unknown') {
          categoryPosition = match[1];
          return false; // break
        }
      });
    }
    
    // Extract total time
    let totalTime = 'Unknown';
    const timeText = $('*:contains("Time")').first().text() || 
                    $('*:contains("Finish")').first().text();
    const timeMatch = timeText.match(/(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})/);
    if (timeMatch) {
      totalTime = timeMatch[1];
    } else {
      totalTime = $('.total-time, .finish-time, [data-total-time], .time').first().text().trim() || 'Unknown';
    }
    
    // Extract splits - look for table structure
    const splits = [];
    
    // Try to find splits table
    $('table').each((i, table) => {
      const $table = $(table);
      const tableText = $table.text().toLowerCase();
      
      // Check if this looks like a splits table
      if (tableText.includes('ski') || tableText.includes('sled') || tableText.includes('row') || 
          tableText.includes('burpee') || tableText.includes('farmers') || tableText.includes('wall')) {
        
        $table.find('tr').each((j, row) => {
          const $row = $(row);
          const cells = $row.find('td, th');
          
          if (cells.length >= 2) {
            const workout = $(cells[0]).text().trim();
            const time = $(cells[1]).text().trim();
            
            // Validate it's a workout name
            const workoutNames = ['ski', 'sled', 'row', 'burpee', 'farmers', 'sandbag', 'wall', 'lunges'];
            const isWorkout = workoutNames.some(name => workout.toLowerCase().includes(name));
            
            if (isWorkout && time && time.match(/\d/)) {
              splits.push({ workout, time });
            }
          }
        });
      }
    });
    
    // If no splits found, try to find them by text patterns
    if (splits.length === 0) {
      const workoutPatterns = [
        { name: 'SkiErg', patterns: ['ski', 'skierg'] },
        { name: 'Sled Push', patterns: ['sled push', 'push'] },
        { name: 'Sled Pull', patterns: ['sled pull', 'pull'] },
        { name: 'Burpee Broad Jump', patterns: ['burpee', 'broad jump'] },
        { name: 'Rowing', patterns: ['row', 'rowing'] },
        { name: 'Farmers Carry', patterns: ['farmers', 'farmer'] },
        { name: 'Sandbag Lunges', patterns: ['sandbag', 'lunges'] },
        { name: 'Wall Balls', patterns: ['wall ball', 'wallball'] }
      ];
      
      workoutPatterns.forEach(({ name, patterns }) => {
        patterns.forEach(pattern => {
          const $elem = $(`*:contains("${pattern}")`).filter((i, el) => {
            const text = $(el).text().toLowerCase();
            return text.includes(pattern) && !$(el).parent().is('script, style');
          }).first();
          
          if ($elem.length) {
            // Try to find time nearby
            const $parent = $elem.parent();
            const parentText = $parent.text();
            const timeMatch = parentText.match(/(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})/);
            
            if (timeMatch) {
              // Check if we already have this workout
              if (!splits.find(s => s.workout === name)) {
                splits.push({ workout: name, time: timeMatch[1] });
              }
            }
          }
        });
      });
    }
    
    return {
      athleteName,
      overallPosition,
      categoryPosition,
      totalTime,
      splits
    };
  } catch (error) {
    if (error.response) {
      throw new Error(`Failed to fetch results page: ${error.response.status} ${error.response.statusText}`);
    } else if (error.request) {
      throw new Error('Failed to connect to results page. Please check the URL.');
    } else {
      throw new Error(`Failed to scrape results: ${error.message}`);
    }
  }
}

// Generate roast prompt
function generatePrompt(data) {
  const splitsText = data.splits.length > 0 
    ? data.splits.map(s => `- ${s.workout}: ${s.time}`).join('\n')
    : 'Splits data not available';
  
  // Find slowest split if available
  const slowestSplit = data.splits.length > 0 
    ? data.splits.reduce((slowest, current) => {
        // Simple comparison - could be improved with proper time parsing
        return current.time > slowest.time ? current : slowest;
      }, data.splits[0])
    : null;
  
  const slowestText = slowestSplit ? `Their slowest split was ${slowestSplit.workout} at ${slowestSplit.time}.` : '';
  
  return `You are a witty, playful fitness commentator roasting a Hyrox athlete's performance. Your job is to create a humorous, entertaining roast that's funny but not mean-spirited.

ATHLETE PERFORMANCE DATA:
- Name: ${data.athleteName}
- Total Time: ${data.totalTime}
- Overall Position: #${data.overallPosition}
- Category Position: #${data.categoryPosition}

WORKOUT SPLITS:
${splitsText}
${slowestText}

INSTRUCTIONS FOR ROAST:
1. Create a humorous, playful roast that is SHORT and punchy (100-120 words MAX, 2-3 sentences)
2. Focus on quick one-liners and snappy humor - perfect for Instagram Stories
3. Point out interesting aspects like slowest splits, finish time, or position
4. Make playful jokes - like friendly banter between training partners
5. Keep it shareable and entertaining for social media - mobile-friendly and quick to read
6. Don't be mean-spirited or overly harsh - this should be fun and motivating
7. Use emojis naturally (2-3 emojis total) - sprinkle them for personality
8. Make it feel like a friendly roast from a fellow athlete who's been there
9. Be punchy and get to the point quickly - Instagram users scroll fast!

INSTRUCTIONS FOR TITLE:
Create a short, catchy title (3-5 words) that matches the roast tone. Examples: "WELL, WELL, WELL!", "SPEED DEMON ALERT", "FINISHER VIBES", "RESPECT THE GRIND", "YOU DID IT!". Make it playful and attention-grabbing.

INSTRUCTIONS FOR HASHTAGS:
Generate 8-12 relevant hashtags. Include a mix of:
- Hyrox-specific: #hyrox #hyroxrace #hyroxathlete #hyroxfinisher
- Fitness: #functionalfitness #fitness #crossfit #endurance
- Humor: #roast #roastme #fitnesshumor
- Engagement: #motivation #fitspo #workout #training

Format your response as JSON with three fields:
{
  "title": "YOUR TITLE HERE",
  "roast": "YOUR ROAST TEXT HERE",
  "hashtags": "#hashtag1 #hashtag2 #hashtag3 ..."
}

Generate the response now:`;
}

// Generate roast using Gemini
async function generateRoast(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON response
    try {
      // Extract JSON from response (might have markdown code blocks)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: parsed.title || 'HYROX ROAST',
          roast: parsed.roast || text,
          hashtags: parsed.hashtags || '#hyrox #hyroxrace #fitness #roast'
        };
      }
    } catch (parseError) {
      // If JSON parsing fails, return default structure
      console.warn('Failed to parse JSON response, using fallback');
    }
    
    // Fallback: return text as roast with default title and hashtags
    return {
      title: 'HYROX ROAST',
      roast: text,
      hashtags: '#hyrox #hyroxrace #functionalfitness #fitness #roast #roastme #motivation #fitspo #workout #training'
    };
  } catch (error) {
    throw new Error(`Failed to generate roast: ${error.message}`);
  }
}

// API endpoint
app.post('/api/roast', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    if (!url.includes('hyresult.com')) {
      return res.status(400).json({ error: 'Invalid Hyrox results URL' });
    }
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }
    
    // Scrape results
    const resultsData = await scrapeHyroxResults(url);
    
    // Generate prompt
    const prompt = generatePrompt(resultsData);
    
    // Generate roast (now returns object with title, roast, hashtags)
    const roastData = await generateRoast(prompt);
    
    // Return data
    res.json({
      success: true,
      data: resultsData,
      title: roastData.title,
      roast: roastData.roast,
      hashtags: roastData.hashtags,
      prompt
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate roast',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Export for Vercel serverless
module.exports = app;

// Only listen if not in Vercel environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

