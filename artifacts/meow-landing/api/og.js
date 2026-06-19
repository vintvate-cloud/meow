export default async function handler(req, res) {
  const { id } = req.query;

  if (!id) {
    return res.status(400).send('Missing event ID');
  }

  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || 'meow-4a019';
    // Fetch event from Firestore REST API
    const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events/${id}`);
    
    if (!response.ok) {
      // Fallback to default index.html essentially
      return res.redirect(`/`);
    }

    const data = await response.json();
    const fields = data.fields || {};
    
    // Extract fields with fallbacks
    const title = fields.title?.stringValue || "Meow Event";
    const description = fields.description?.stringValue || "Join this event on Meow.";
    const creativeUrl = fields.creativeUrl?.stringValue || "https://meow-landing.vercel.app/opengraph.jpg";
    const location = fields.location?.stringValue ? `📍 ${fields.location.stringValue}` : "";
    
    // Construct description for OG tags
    const displayDescription = location ? `${location} | ${description}` : description;

    // We serve a bare HTML file with just the meta tags. 
    // Social bots only parse the head.
    const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${displayDescription}" />
    
    <!-- Open Graph / Facebook / WhatsApp -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${displayDescription}" />
    <meta property="og:image" content="${creativeUrl}" />
    <meta property="og:url" content="https://meow-landing.vercel.app/e/${id}" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${displayDescription}" />
    <meta name="twitter:image" content="${creativeUrl}" />
  </head>
  <body>
    <!-- Just in case a real browser hits this directly -->
    <script>
      window.location.replace('/e/${id}');
    </script>
    <p>Redirecting to event...</p>
  </body>
</html>
`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.send(html);
  } catch (error) {
    console.error('Error generating OG tags:', error);
    return res.redirect(`/e/${id}`);
  }
}
