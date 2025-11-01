/* build.js (for The Counseling Center) */
/* This script builds all location pages AND rebuilds the homepage grid */

const fs = require('fs');
const path = require('path');

// Define file paths
const DATA_FILE = path.join(__dirname, 'tcc-data.json');
const LOCATION_TEMPLATE_FILE = path.join(__dirname, 'location-template.html');
const HOME_TEMPLATE_FILE = path.join(__dirname, 'index.html');
const OUTPUT_DIR = path.join(__dirname, 'dist');
const LOCATION_OUTPUT_DIR = path.join(OUTPUT_DIR, 'locations');

// --- Helper Function to Create HTML for a single location card (TCC specific) ---
function createLocationCard(loc) {
    const slug = loc.url.split('/').pop() || loc.addressLocality.toLowerCase().replace(' ', '');
    const relativeImagePath = loc.image.replace('https://www.thecounselingcenter.com/', '');
    const phoneLink = loc.telephone ? loc.telephone : '866-850-5001';
    const phoneText = loc.telephone ? loc.telephone : 'Call Admissions';

    // This HTML matches your TCC index.html location card structure
    return `
    <article class="location-card">
        <div class="location-card-image-wrapper">
            <img data-src="${relativeImagePath}" class="lazy-load" alt="${loc.name}" src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==">
            <div class="location-card-header">${loc.name.replace('The Counseling Center at ', '')}</div>
        </div>
        <div class="location-card-content">
            <p class="location-address">
                <span>${loc.streetAddress}</span>
                <span>${loc.addressLocality}, ${loc.addressRegion} ${loc.postalCode}</span>
            </p>
            <p class="location-phone"><strong>Phone:</strong> <a href="tel:${phoneLink}">${phoneText}</a></p>
            <a href="locations/${slug}/" class="btn btn-primary location-card-cta">View Location Page</a>
            
            <p class="ride-title">Request a Ride</p>
            <div class="ride-links">
                <a href="https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[formatted_address]=${encodeURIComponent(loc.streetAddress + ' ' + loc.addressLocality + ' ' + loc.addressRegion + ' ' + loc.postalCode)}" target="_blank" class="ride-link" aria-label="Request a ride with Uber">
                    <svg viewBox="0 0 256 256" fill="#000000"><path d="M211.314 133.028c-2.42-3.13-5.26-5.83-8.42-7.98-29.04-19.74-63.63-31.54-100.99-31.54-37.37 0-71.95 11.8-100.99 31.54-3.17 2.15-5.99 4.85-8.42 7.98C-3.1 169.328-3.1 213.6 1.8 231.18c.06.21.14.42.21.63 2.22 6.57 28.97 24.19 123.9 24.19s121.68-17.62 123.9-24.19c.07-.21.15-.42.21-.63 4.9-17.58 4.9-61.85-10.71-98.15zM89.3 171.13c-7.83 0-14.17-6.34-14.17-14.17s6.34-14.17 14.17-14.17 14.17 6.34 14.17 14.17-6.34 14.17-14.17 14.17zm77.4 0c-7.83 0-14.17-6.34-14.17-14.17s6.34-14.17 14.17-14.17 14.17 6.34 14.17 14.17-6.34 14.17-14.17 14.17zM245.82 24.18C226.79 8.01 200.7 0 172.9 0h-89.8C55.3 0 29.2 8.01 10.18 24.18-5.32 39.09-5.32 65.59 10.18 80.5c15.5 14.9 41.6 23.01 69.4 23.01h89.8c27.8 0 53.9-8.11 69.4-23.01 15.5-14.91 15.5-41.41-10.16-56.32z"></svg>
                </a>
                <a href="https://www.lyft.com/ride-with-lyft?destination=${encodeURIComponent(loc.streetAddress + ' ' + loc.addressLocality + ' ' + loc.addressRegion + ' ' + loc.postalCode)}" target="_blank" class="ride-link" aria-label="Request a ride with Lyft">
                    <svg viewBox="0 0 24 24" fill="#FF00BF"><path d="M21.1 12.6C19 11.5 17.4 9.2 17.4 6.7C17.4 3 14.4 0 10.8 0C7.1 0 4.1 3 4.1 6.7C4.1 9.2 2.5 11.5 0.4 12.6C0.2 12.7 0 13 0 13.4V16.9C0 17.3 0.2 17.6 0.5 17.7C1.4 18.2 2.8 18.6 4.4 18.6C4.8 18.6 5.1 18.3 5.1 17.9V14.8C5.1 14.4 5.4 14.1 5.8 14.1H15.6C16 14.1 16.3 14.4 16.3 14.8V17.9C16.3 18.3 16.6 18.6 17 18.6C18.6 18.6 20 18.2 20.9 17.7C21.2 17.6 21.4 17.3 21.4 16.9V13.4C21.4 13 21.2 12.7 21.1 12.6ZM8 7.3C8 6.6 8.5 6 9.3 6C10 6 10.6 6.6 10.6 7.3C10.6 8.1 10.1 8.7 9.3 8.7C8.5 8.7 8 8.1 8 7.3ZM12.2 8.7C11.4 8.7 10.8 8.1 10.8 7.3C10.8 6.6 11.4 6 12.2 6C12.9 6 13.5 6.6 13.5 7.3C13.5 8.1 12.9 8.7 12.2 8.7Z M24 12.2C22.6 11.6 21.4 10.3 21.4 8.7C21.4 6.1 19.3 4 16.7 4C14.1 4 12 6.1 12 8.7C12 10.3 10.8 11.6 9.4 12.2C9.2 12.3 9 12.6 9 12.9V16.9C9 17.3 9.2 17.6 9.5 17.7C10.4 18.2 11.8 18.6 13.4 18.6C13.8 18.6 14.1 18.3 14.1 17.9V14.8C14.1 14.4 14.4 14.1 14.8 14.1H18.6C19 14.1 19.3 14.4 19.3 14.8V17.9C19.3 18.3 19.6 18.6 20 18.6C21.6 18.6 23 18.2 23.9 17.7C24.2 17.6 24.4 17.3 24.4 16.9V12.9C24.4 12.6 24.2 12.3 24 12.2Z"/></svg>
                </a>
            </div>
            <p class="visually-hidden">
                Outpatient counseling services for ${loc.addressLocality}, ${loc.addressRegion} and surrounding towns including ${loc.areasServed.cities.join(', ')}. We serve zip codes ${loc.areasServed.zips.join(', ')}.
            </p>
        </div>
    </article>
    `;
}

// --- Helper Function to build HTML lists ---
function buildHtmlList(items) {
    return items.map(item => `<li>${item}</li>`).join('\n');
}

// --- Main Build Function ---
function buildSite() {
    console.log("Starting TCC build...");

    // 1. Create output directories
    if (!fs.existsSync(LOCATION_OUTPUT_DIR)) {
        fs.mkdirSync(LOCATION_OUTPUT_DIR, { recursive: true });
    }
    
    // 2. Read all data and templates
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const locationTemplate = fs.readFileSync(LOCATION_TEMPLATE_FILE, 'utf8');
    const homeTemplate = fs.readFileSync(HOME_TEMPLATE_FILE, 'utf8');
    
    const allLocationCards = [];

    // --- Static lists from TCC index.html ---
    const counselingServicesListHtml = `
        <li>Mental Health Services</li>
        <li>Individual Counseling</li>
        <li>Group Counseling</li>
        <li>Family Counseling</li>
        <li>Psychiatric Care</li>
        <li>Medication Management</li>
        <li>Telehealth</li>
    `;
    const treatmentProgramsListHtml = `
        <li>Spravato Treatment</li>
        <li>Medication-Assisted Treatment</li>
        <li>Substance Abuse IOP</li>
        <li>Mental Health IOP</li>
        <li>Outpatient Substance Abuse Treatment</li>
        <li>Adolescent Treatment</li>
        <li>Partial Hospitalization Program</li>
        <li>Veterans Program</li>
    `;

    // 3. Process each location
    data.locations.forEach(loc => {
        console.log(`Processing location: ${loc.name}...`);
        let locationHtml = locationTemplate;
        
        const relativeAssetPath = '../../'; 

        // Build dynamic lists for this location
        const citiesListHtml = buildHtmlList(loc.areasServed.cities);
        const zipsListHtml = buildHtmlList(loc.areasServed.zips);

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
        
        // Replace list placeholders
        locationHtml = locationHtml.replace(/\[AREAS_SERVED_CITIES_LIST\]/g, citiesListHtml);
        locationHtml = locationHtml.replace(/\[AREAS_SERVED_ZIPS_LIST\]/g, zipsListHtml);
        locationHtml = locationHtml.replace(/\[COUNSELING_SERVICES_LIST\]/g, counselingServicesListHtml);
        locationHtml = locationHtml.replace(/\[TREATMENT_PROGRAMS_LIST\]/g, treatmentProgramsListHtml);
        
        // Fix asset paths (images, css, js)
        locationHtml = locationHtml.replace(/href="style.css"/g, `href="${relativeAssetPath}style.css"`);
        locationHtml = locationHtml.replace(/src="script.js"/g, `src="${relativeAssetPath}script.js"`); 
        locationHtml = locationHtml.replace(/href="images\//g, `href="${relativeAssetPath}images/`);
        locationHtml = locationHtml.replace(/src="images\//g, `src="${relativeAssetPath}images/`);
        locationHtml = locationHtml.replace(/url\('images\//g, `url('${relativeAssetPath}images/`);
        
        // Fix homepage links
        locationHtml = locationHtml.replace(/href="https\:\/\/www.thecounselingcenter.com\/"/g, relativeAssetPath);
        locationHtml = locationHtml.replace(/href="https\:\/\/www.thecounselingcenter.com\/#admissions"/g, `${relativeAssetPath}#admissions`);
        locationHtml = locationHtml.replace(/href="https.../g, `${relativeAssetPath}#services`);
        locationHtml = locationHtml.replace(/href="https\:\/\/www.thecounselingcenter.com\/#locations-full"/g, `${relativeAssetPath}#locations-full`);
        locationHtml = locationHtml.replace(/href="https.../g, `${relativeAssetPath}#contact`);

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
