const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Scrape Hyrox results page
async function scrapeHyroxResults(url) {
  try {
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
    
    // Extract overall position - look for position/rank indicators
    let overallPosition = 'Unknown';
    const positionText = $('*:contains("Position")').first().text() || 
                        $('*:contains("Overall")').first().text() ||
                        $('*:contains("Rank")').first().text();
    const positionMatch = positionText.match(/#?\s*(\d+)/i) || 
                         positionText.match(/position\s*:?\s*(\d+)/i) ||
                         positionText.match(/rank\s*:?\s*(\d+)/i);
    if (positionMatch) {
      overallPosition = positionMatch[1];
    } else {
      // Try data attributes
      overallPosition = $('[data-position], [data-rank], .position, .rank').first().text().trim().replace(/\D/g, '') || 'Unknown';
    }
    
    // Extract category position
    let categoryPosition = 'Unknown';
    const categoryText = $('*:contains("Category")').first().text();
    const categoryMatch = categoryText.match(/#?\s*(\d+)/i) || 
                         categoryText.match(/category\s*:?\s*(\d+)/i);
    if (categoryMatch) {
      categoryPosition = categoryMatch[1];
    } else {
      categoryPosition = $('[data-category-position], .category-position').first().text().trim().replace(/\D/g, '') || 'Unknown';
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
        return current.time > slowest.time ? current : slowest;
      }, data.splits[0])
    : null;
  
  const slowestText = slowestSplit ? `Their slowest split was ${slowestSplit.workout} at ${slowestSplit.time}.` : '';
  
  return `You are a witty, playful fitness commentator roasting a Hyrox athlete's performance. Your job is to create a humorous, entertaining roast that's funny but not mean-spirited.

ATHLETE PERFORMANCE DATA:
- Name: ${data.athleteName}
- Total Time: ${data.totalTime}
- Overall Position: #${data.overallPosition} (out of all competitors)
- Category Position: #${data.categoryPosition} (in their category)

WORKOUT SPLITS:
${splitsText}
${slowestText}

INSTRUCTIONS:
1. Create a humorous, playful roast (2-3 short paragraphs)
2. Be witty and funny, but keep it light-hearted and constructive
3. Point out interesting aspects like slowest splits, position relative to field size
4. Make playful jokes about their performance - like a friendly banter between training partners
5. Keep it shareable and entertaining for social media
6. Don't be mean-spirited or overly harsh - this should be fun and motivating
7. Use emojis sparingly (1-2 max) if it adds to the humor
8. Make it feel like a friendly roast from a fellow athlete who's been there

Generate the roast now:`;
}

// Generate roast using Gemini
async function generateRoast(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    throw new Error(`Failed to generate roast: ${error.message}`);
  }
}

// Vercel serverless function handler
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
    
    // Generate roast
    const roast = await generateRoast(prompt);
    
    // Return data
    res.json({
      success: true,
      data: resultsData,
      roast,
      prompt
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate roast'
    });
  }
};

