/* build.js (for Evolve Recovery Center) */
/* This script builds all location pages AND rebuilds the homepage grid */

const fs = require('fs');
const path = require('path');

// Define file paths
const DATA_FILE = path.join(__dirname, 'evolve-data.json');
// UPDATED FILE PATH:
const LOCATION_TEMPLATE_FILE = path.join(__dirname, 'evolve_location-template.html');
const HOME_TEMPLATE_FILE = path.join(__dirname, 'index.html');
const OUTPUT_DIR = path.join(__dirname, 'dist');
const LOCATION_OUTPUT_DIR = path.join(OUTPUT_DIR, 'locations');

// --- Helper Function to Create HTML for a single location card (Evolve specific) ---
function createLocationCard(loc) {
    const slug = loc.url.split('/').pop() || loc.addressLocality.toLowerCase().replace(' ', '');
    const relativeImagePath = loc.image.replace('https://www.evolverecoverycenter.com/', '');

    // This HTML matches your Evolve index.html location card structure
    return `
    <article id="${slug}-card" class="location-card">
        <div class="location-card-image-wrapper">
            <img data-src="${relativeImagePath}" class="lazy-load" alt="${loc.name} Facility" width="100%" height="100%" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">
            <div class="location-card-header">${loc.name.replace('Evolve Recovery Center at ', '')}</div>
        </div>
        <div class="location-card-content">
            <a href="locations/${slug}/" class="btn btn-primary location-card-cta">View Location Page</a>
        </div>
    </article>
    `;
}

// --- Helper Function to build HTML lists ---
function buildHtmlList(items) {
    if (!items || items.length === 0) {
        // Return a default message if the list is empty
        return '<li>Please call for insurance verification.</li>';
    }
    return items.map(item => `<li>${item}</li>`).join('\n');
}

// --- Main Build Function ---
function buildSite() {
    console.log("Starting Evolve build...");

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

        // --- Build dynamic lists ---
        // Handle potentially missing areasServed object
        const citiesListHtml = (loc.areasServed && loc.areasServed.cities) ? buildHtmlList(loc.areasServed.cities) : '';
        const zipsListHtml = (loc.areasServed && loc.areasServed.zips) ? buildHtmlList(loc.areasServed.zips) : '';
        const insuranceListHtml = buildHtmlList(loc.insuranceList);

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
        
        // --- Replace list placeholders ---
        locationHtml = locationHtml.replace(/\[AREAS_SERVED_CITIES_LIST\]/g, citiesListHtml);
        locationHtml = locationHtml.replace(/\[AREAS_SERVED_ZIPS_LIST\]/g, zipsListHtml);
        locationHtml = locationHtml.replace(/\[INSURANCE_LIST_HTML\]/g, insuranceListHtml);

        
        // Fix asset paths (images, css, js) so they work from a subfolder
        locationHtml = locationHtml.replace(/href="style.css"/g, `href="${relativeAssetPath}style.css"`);
        locationHtml = locationHtml.replace(/src="script.js"/g, `src="${relativeAssetPath}script.js"`); 
        locationHtml = locationHtml.replace(/href="images\//g, `href="${relativeAssetPath}images/`);
        locationHtml = locationHtml.replace(/src="images\//g, `src="${relativeAssetPath}images/`);
        locationHtml = locationHtml.replace(/url\('images\//g, `url('${relativeAssetPath}images/`);
        
        // --- UPDATED HOMEPAGE LINK LOGIC (for relative testing) ---
        // This finds the relative links from your template and prepends the asset path
        
        // Handle logo link
        locationHtml = locationHtml.replace(
            /href="#top"/g, 
            `href="${relativeAssetPath}index.html"`
        );

        // Handle nav links
        locationHtml = locationHtml.replace(
            /href="#locations-full"/g, 
            `href="${relativeAssetPath}index.html#locations-full"`
        );
        locationHtml = locationHtml.replace(
            /href="#insurance"/g, 
            `href="${relativeAssetPath}index.html#insurance"`
        );
        locationHtml = locationHtml.replace(
            /href="#treatment-planning"/g, 
            `href="${relativeAssetPath}index.html#treatment-planning"`
        );

        // Handle any other root-relative links
        locationHtml = locationHtml.replace(
            /href="index.html"/g, 
            `href="${relativeAssetPath}index.html"`
        );
        // --- END of link logic update ---

        // Create the folder for the location
        const locationSlug = loc.url.split('/').pop();
        const locationDir = path.join(LOCATION_OUTPUT_DIR, locationSlug);
        if (!fs.existsSync(locationDir)) {
            fs.mkdirSync(locationDir, { recursive: true });
        }

        // Write the final HTML file
        fs.writeFileSync(path.join(locationDir, 'index.html'), locationHtml);
        
        allLocationCards.push(createLocationCard(loc));
    });
    
    console.log(`Generated ${data.locations.length} location pages.`);

    // 4. Process the Homepage (index.html)
    console.log("Processing homepage...");
    let finalHomeHtml = homeTemplate;

    // Replace the location grid
    const gridRegex = /<div class="all-locations-grid">[\s\S]*?<\/article>\s*<\/div>/;
    if (!finalHomeHtml.match(gridRegex)) {
        console.error("ERROR: Could not find the location grid in index.html. Aborting homepage build.");
    } else {
        finalHomeHtml = finalHomeHtml.replace(gridRegex, 
            `<div class="all-locations-grid">\n${allLocationCards.join('\n')}\n</div>`
        );
        console.log("Homepage location grid rebuilt.");
    }
    
    // Replace homepage placeholders
    finalHomeHtml = finalHomeHtml.replace(/\[CANONICAL_URL_FOR_BRAND_PAGE\]/g, data.brand.url);
    
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