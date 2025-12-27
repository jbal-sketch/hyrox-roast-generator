require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Test URL - you can change this to test with different results
const TEST_URL = process.argv[2] || 'https://www.hyresult.com/result/LR3MS4JI2BA7B6?tab=splits';

console.log('🔥 Hyrox Roast Generator - Test Harness\n');
console.log(`Testing with URL: ${TEST_URL}\n`);

// Scrape Hyrox results page (same function as in api/roast.js)
async function scrapeHyroxResults(url) {
  try {
    console.log('📡 Fetching results page...');
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Extract athlete name
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
    
    // Extract overall position
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
    
    // Extract splits
    const splits = [];
    $('table').each((i, table) => {
      const $table = $(table);
      const tableText = $table.text().toLowerCase();
      
      if (tableText.includes('ski') || tableText.includes('sled') || tableText.includes('row') || 
          tableText.includes('burpee') || tableText.includes('farmers') || tableText.includes('wall')) {
        
        $table.find('tr').each((j, row) => {
          const $row = $(row);
          const cells = $row.find('td, th');
          
          if (cells.length >= 2) {
            const workout = $(cells[0]).text().trim();
            const time = $(cells[1]).text().trim();
            
            const workoutNames = ['ski', 'sled', 'row', 'burpee', 'farmers', 'sandbag', 'wall', 'lunges'];
            const isWorkout = workoutNames.some(name => workout.toLowerCase().includes(name));
            
            if (isWorkout && time && time.match(/\d/)) {
              splits.push({ workout, time });
            }
          }
        });
      }
    });
    
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
            const $parent = $elem.parent();
            const parentText = $parent.text();
            const timeMatch = parentText.match(/(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})/);
            
            if (timeMatch) {
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
    throw new Error(`Failed to scrape results: ${error.message}`);
  }
}

// Generate prompt (same as in api/roast.js)
function generatePrompt(data) {
  const splitsText = data.splits.length > 0 
    ? data.splits.map(s => `- ${s.workout}: ${s.time}`).join('\n')
    : 'Splits data not available';
  
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
    console.log('🤖 Generating roast with Gemini 2.5 Flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    throw new Error(`Failed to generate roast: ${error.message}`);
  }
}

// Main test function
async function runTest() {
  try {
    // Check API key
    if (!process.env.GEMINI_API_KEY) {
      console.error('❌ Error: GEMINI_API_KEY not found in environment variables');
      console.log('Make sure you have a .env file with GEMINI_API_KEY=your_key');
      process.exit(1);
    }
    
    // Test 1: Scrape results
    console.log('='.repeat(60));
    console.log('TEST 1: Scraping Results');
    console.log('='.repeat(60));
    const resultsData = await scrapeHyroxResults(TEST_URL);
    
    console.log('\n✅ Scraping successful!');
    console.log('\nExtracted Data:');
    console.log(`  Athlete: ${resultsData.athleteName}`);
    console.log(`  Total Time: ${resultsData.totalTime}`);
    console.log(`  Overall Position: #${resultsData.overallPosition}`);
    console.log(`  Category Position: #${resultsData.categoryPosition}`);
    console.log(`  Splits found: ${resultsData.splits.length}`);
    if (resultsData.splits.length > 0) {
      console.log('\n  Splits:');
      resultsData.splits.forEach(split => {
        console.log(`    - ${split.workout}: ${split.time}`);
      });
    }
    
    // Test 2: Generate prompt
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Generating Prompt');
    console.log('='.repeat(60));
    const prompt = generatePrompt(resultsData);
    console.log('\n✅ Prompt generated!');
    console.log('\nPrompt preview (first 200 chars):');
    console.log(prompt.substring(0, 200) + '...\n');
    
    // Test 3: Generate roast
    console.log('='.repeat(60));
    console.log('TEST 3: Generating Roast');
    console.log('='.repeat(60));
    const roast = await generateRoast(prompt);
    
    console.log('\n✅ Roast generated successfully!\n');
    console.log('='.repeat(60));
    console.log('FINAL ROAST:');
    console.log('='.repeat(60));
    console.log(roast);
    console.log('='.repeat(60));
    
    // Summary
    console.log('\n✅ All tests passed!');
    console.log('\nSummary:');
    console.log(`  - Scraping: ✅ Success`);
    console.log(`  - Prompt Generation: ✅ Success`);
    console.log(`  - Roast Generation: ✅ Success`);
    
  } catch (error) {
    console.error('\n❌ Test failed!');
    console.error(`Error: ${error.message}`);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run the test
runTest();

