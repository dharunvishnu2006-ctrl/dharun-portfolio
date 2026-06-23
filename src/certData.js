// ============================================================
// COURSE CERTIFICATE SOURCE OF TRUTH
// ============================================================
// This file is committed to git so certificates appear on ALL
// devices (mobile, desktop, any browser) without requiring
// localStorage to be populated first.
//
// HOW TO UPDATE after adding new certificates via admin UI:
//   1. Open the Certificates page on DESKTOP in admin mode
//   2. Click "Export Certificate Data" at the bottom
//   3. Copy the generated code block
//   4. Replace the array below with the copied code
//   5. Run: git add . && git commit -m "Update cert data" && git push
//
// The image field accepts either:
//   - A base64 data URL (from the Export tool — large but self-contained)
//   - A path like "/certs/cert-1.jpg" (if you place the file in public/certs/)
// ============================================================

const COURSE_CERTS_DEFAULTS = [
  {
    id: "cc-1",
    name: "Programming for Everybody",
    link: "https://coursera.org/verify/OTM65Y5Z7Z9M",
    image: ""
  },
  // Paste exported cert entries below this line.
  // Run the Export tool on the Certificates admin page to get the full data.
];

export default COURSE_CERTS_DEFAULTS;
