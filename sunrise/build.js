/* build.js */
/* This script builds all location pages AND rebuilds the homepage grid */

const fs = require('fs');
const path = require('path');

// Define file paths
const DATA_FILE = path.join(__dirname, 'sunrise-data.json');
const LOCATION_TEMPLATE_FILE = path.join(__dirname, 'location-template.html');
const HOME_TEMPLATE_FILE = path.join(__dirname, 'index.html');
const OUTPUT_DIR = path.join(__dirname, 'dist');
const LOCATION_OUTPUT_DIR = path.join(OUTPUT_DIR, 'locations');

// --- Helper Function to Create HTML for a single location card ---
function createLocationCard(loc) {
    const slug = loc.url.split('/').pop() || loc.addressLocality.toLowerCase().replace(' ', '');
    const relativeImagePath = loc.image.replace('https://www.sunrisedetox.com/', '');

    // This HTML is based on your index.html location card structure
    return `
    <article id="${slug}-card" class="location-card">
        <div class="location-card-image-wrapper">
            <img data-src="${relativeImagePath}" class="lazy-load" alt="${loc.name} Facility" width="100%" height="100%" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">
            <div class="location-card-header">${loc.name.replace('Sunrise Detox at ', '')}</div>
        </div>
        <div class="location-card-content">
            <p>${loc.streetAddress}<br>${loc.addressLocality}, ${loc.addressRegion} ${loc.postalCode}</p>

            <a href="locations/${slug}/" class="btn btn-primary location-card-cta">View Location Page</a>
        
        </div>
    </article>
    `;
}

// --- Main Build Function ---
function buildSite() {
    console.log("Starting build...");

    // 1. Create output directories
    if (!fs.existsSync(LOCATION_OUTPUT_DIR)) {
        fs.mkdirSync(LOCATION_OUTPUT_DIR, { recursive: true });
    }
    
    // 2. Read all data and templates
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const locationTemplate = fs.readFileSync(LOCATION_TEMPLATE_FILE, 'utf8');
    const homeTemplate = fs.readFileSync(HOME_TEMPLATE_FILE, 'utf8');
    
    const allLocationCards = [];

    // 3. Process each location
    data.locations.forEach(loc => {
        console.log(`Processing location: ${loc.name}...`);
        let locationHtml = locationTemplate;
        
        const relativeAssetPath = '../../'; 

        // Find and replace all placeholders
        locationHtml = locationHtml.replace(/\[LOCATION_NAME\]/g, loc.name);
        locationHtml = locationHtml.replace(/\[LOCATION_CITY\]/g, loc.addressLocality);
        locationHtml = locationHtml.replace(/\[LOCATION_STATE\]/g, loc.addressRegion);
        locationHtml = locationHtml.replace(/\[LOCATION_PHONE\]/g, loc.telephone || data.brand.telephone);
        locationHtml = locationHtml.replace(/\[LOCATION_URL\]/g, loc.url);
        locationHtml = locationHtml.replace(/\[LOCATION_IMAGE_URL\]/g, loc.image);
        locationHtml = locationHtml.replace(/\[LOCATION_ADDRESS_STREET\]/g, loc.streetAddress);
        locationHtml = locationHtml.replace(/\[LOCATION_ADDRESS_POSTAL\]/g, loc.postalCode);
        locationHtml = locationHtml.replace(/\[LOCATION_GEO_LAT\]/g, loc.latitude);
        locationHtml = locationHtml.replace(/\[LOCATION_GEO_LONG\]/g, loc.longitude);
        locationHtml = locationHtml.replace(/\[LOCATION_GMB_URL\]/g, loc.gmb_link);
        locationHtml = locationHtml.replace(/\[LOCATION_GMB_EMBED_URL\]/g, loc.gmb_embed_url);
        
        // Fix asset paths (images, css, js) so they work from a subfolder
        locationHtml = locationHtml.replace(/href="style.css"/g, `href="${relativeAssetPath}style.css"`);
        locationHtml = locationHtml.replace(/src="script.js"/g, `src="${relativeAssetPath}script.js"`); 
        locationHtml = locationHtml.replace(/href="images\//g, `href="${relativeAssetPath}images/`);
        locationHtml = locationHtml.replace(/src="images\//g, `src="${relativeAssetPath}images/`);
        locationHtml = locationHtml.replace(/url\('images\//g, `url('${relativeAssetPath}images/`);
        
        // Fix homepage links
        locationHtml = locationHtml.replace(/href="https\:\/\/www.sunrisedetox.com\/"/g, relativeAssetPath);
        locationHtml = locationHtml.replace(/href="https\:\/\/www.sunrisedetox.com\/#locations-full"/g, `${relativeAssetPath}#locations-full`);
        locationHtml = locationHtml.replace(/href="https\:\/\/www.sunrisedetox.com\/#insurance"/g, `${relativeAssetPath}#insurance`);
        locationHtml = locationHtml.replace(/href="https\:\/\/www.sunrisedetox.com\/#treatment-planning"/g, `${relativeAssetPath}#treatment-planning`);

        // Create the folder for the location (e.g., /locations/alpharetta_georgia/)
        const locationSlug = loc.url.split('/').pop();
        const locationDir = path.join(LOCATION_OUTPUT_DIR, locationSlug);
        if (!fs.existsSync(locationDir)) {
            fs.mkdirSync(locationDir, { recursive: true });
        }

        // Write the final HTML file
        fs.writeFileSync(path.join(locationDir, 'index.html'), locationHtml);
        
        // Add this location's card to our array for the homepage
        allLocationCards.push(createLocationCard(loc));
    });
    
    console.log(`Generated ${data.locations.length} location pages.`);

    // 4. Process the Homepage (index.html)
    console.log("Processing homepage...");
    let finalHomeHtml = homeTemplate;

    // *** FIX 2: A more stable regex to replace the grid ***
    // This looks for the grid div and ensures it captures everything down to the last article tag
    const gridRegex = /<div class="all-locations-grid">[\s\S]*?<\/article>\s*<\/div>/;

    if (!finalHomeHtml.match(gridRegex)) {
        console.error("ERROR: Could not find the location grid in index.html. Aborting homepage build.");
    } else {
        finalHomeHtml = finalHomeHtml.replace(gridRegex, 
            `<div class="all-locations-grid">\n${allLocationCards.join('\n')}\n</div>`
        );
        console.log("Homepage location grid rebuilt.");
    }
    
    // Also replace homepage placeholders
    finalHomeHtml = finalHomeHtml.replace(/\[CANONICAL_URL_FOR_BRAND_PAGE\]/g, data.brand.url);
    
    // Write the final index.html to the 'dist' folder
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), finalHomeHtml);
    console.log("Homepage generated.");

    // 5. Copy over static assets
    console.log("Copying assets (css, js, images)...");
    fs.copyFileSync(path.join(__dirname, 'style.css'), path.join(OUTPUT_DIR, 'style.css'));
    fs.copyFileSync(path.join(__dirname, 'script.js'), path.join(OUTPUT_DIR, 'script.js'));
    fs.cpSync(path.join(__dirname, 'images'), path.join(OUTPUT_DIR, 'images'), { recursive: true });

    console.log("Build complete! Your static site is in the 'dist' folder.");
}

// Run the build
buildSite();