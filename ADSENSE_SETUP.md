# Google AdSense Setup Guide

This guide will walk you through setting up Google AdSense for the Hyrox Roast Generator website.

## Prerequisites

- Your website must be live and accessible (deployed on Vercel)
- Your website must have original content (you have this!)
- Your website must have a privacy policy (already created at `/privacy.html`)

## Step 1: Create Google AdSense Account

1. Go to [https://www.google.com/adsense/](https://www.google.com/adsense/)
2. Click **"Get Started"** or **"Sign In"** if you already have a Google account
3. Enter your website URL: `https://your-vercel-domain.vercel.app`
   - Replace `your-vercel-domain` with your actual Vercel domain
4. Select your country
5. Read and accept the AdSense program policies
6. Click **"Create Account"**

## Step 2: Complete Your AdSense Application

1. **Add Payment Information**
   - Go to "Payments" in the AdSense dashboard
   - Add your payment method (bank account or address for checks)
   - This is required even though you won't receive payments until approved

2. **Verify Your Website**
   - Google will review your site (usually takes 1-7 days, sometimes up to 2 weeks)
   - Make sure your site is:
     - Live and accessible
     - Has original content (your roast generator qualifies!)
     - Has a privacy policy (already at `/privacy.html`)
     - Has sufficient content (you have this)

3. **Wait for Approval**
   - You'll receive an email when your site is approved
   - Check your AdSense dashboard for status updates

## Step 3: Get Your Publisher ID

Once approved:

1. Log into your AdSense dashboard
2. Go to **"Account"** → **"Account information"**
3. Find your **Publisher ID** (format: `ca-pub-XXXXXXXXXX`)
4. Copy this ID - you'll need it in the next step

## Step 4: Create an Ad Unit

1. In AdSense dashboard, go to **"Ads"** → **"By ad unit"**
2. Click **"Create ad unit"**
3. Choose **"Display ads"**
4. Name your ad unit (e.g., "Hyrox Roast Sidebar")
5. Choose ad size:
   - **Recommended**: Select "Responsive" (automatically adjusts to container)
   - **Alternative**: Choose "300x250" (Medium Rectangle) for fixed size
6. Click **"Create"**
7. You'll see your ad unit code - copy the following:
   - Your **Publisher ID** (already have this)
   - Your **Ad Slot ID** (format: `XXXXXXXXXX`)

## Step 5: Add Your AdSense Code to the Website

1. Open `public/index.html` in your code editor

2. **Update the AdSense script in the `<head>` section:**
   ```html
   <!-- Replace ca-pub-XXXXXXXXXX with your actual Publisher ID -->
   <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX"
    crossorigin="anonymous"></script>
   ```

3. **Update the ad unit code in the sidebar:**
   Find this section in the sidebar:
   ```html
   <ins class="adsbygoogle"
        style="display:block"
        data-ad-client="ca-pub-XXXXXXXXXX"
        data-ad-slot="XXXXXXXXXX"
        data-ad-format="auto"
        data-full-width-responsive="true"></ins>
   ```
   
   Replace:
   - `ca-pub-XXXXXXXXXX` with your Publisher ID
   - `data-ad-slot="XXXXXXXXXX"` with your Ad Slot ID

4. **Save the file and commit:**
   ```bash
   git add public/index.html
   git commit -m "Add AdSense Publisher ID and Ad Slot ID"
   git push
   ```

5. **Wait for Vercel to redeploy** (usually takes 1-2 minutes)

## Step 6: Verify Ads Are Displaying

1. Visit your live website
2. Check the sidebar - you should see ads displayed
3. If you don't see ads immediately:
   - Wait a few minutes (ads can take time to load)
   - Clear your browser cache
   - Try an incognito/private window
   - Check AdSense dashboard for any errors

## Step 7: Test Mode (Optional)

If you want to test ad placement before approval:

1. In AdSense dashboard, go to **"Ads"** → **"By ad unit"**
2. Find your ad unit and click on it
3. Enable **"Test mode"** if available
4. This will show placeholder ads so you can verify placement

## Troubleshooting

### Ads Not Showing

- **Not approved yet**: Ads only show after AdSense approval
- **Wrong Publisher ID**: Double-check you replaced all instances of `ca-pub-XXXXXXXXXX`
- **Wrong Ad Slot ID**: Verify your `data-ad-slot` value is correct
- **Ad blockers**: Disable ad blockers to see ads
- **Cache**: Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

### Layout Issues

- **Sidebar too wide/narrow**: Adjust the `.sidebar` width in `style.css` (currently 300px)
- **Ads breaking layout**: Ensure `data-full-width-responsive="true"` is set
- **Mobile issues**: Check responsive CSS in `style.css` media queries

### AdSense Dashboard Issues

- **No earnings**: Normal until you get traffic and clicks
- **Policy violations**: Review AdSense policies and fix any issues
- **Payment issues**: Ensure payment information is complete

## Best Practices

1. **Don't click your own ads** - This violates AdSense policies
2. **Don't ask others to click ads** - Also violates policies
3. **Follow AdSense policies** - Read and understand the program policies
4. **Optimize placement** - Sidebar placement is good, but you can add more ad units later
5. **Monitor performance** - Check AdSense dashboard regularly for performance metrics

## Adding More Ad Units (Optional)

You can add additional ad units in other locations:

1. Create new ad units in AdSense dashboard
2. Add the ad code to desired locations in `index.html`
3. Follow the same pattern as the sidebar ad

## Support

- **AdSense Help**: [https://support.google.com/adsense](https://support.google.com/adsense)
- **AdSense Policies**: [https://support.google.com/adsense/answer/48182](https://support.google.com/adsense/answer/48182)
- **Community Forum**: [https://support.google.com/adsense/community](https://support.google.com/adsense/community)

## Summary Checklist

- [ ] Created AdSense account
- [ ] Added payment information
- [ ] Website is live and accessible
- [ ] Privacy policy is published
- [ ] Received AdSense approval email
- [ ] Got Publisher ID from AdSense dashboard
- [ ] Created ad unit and got Ad Slot ID
- [ ] Updated `public/index.html` with Publisher ID
- [ ] Updated `public/index.html` with Ad Slot ID
- [ ] Committed and pushed changes
- [ ] Verified ads are displaying on live site

Once all steps are complete, your AdSense ads should be displaying in the sidebar!

