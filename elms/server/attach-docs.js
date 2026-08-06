/**
 * attach-docs.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Uploads a demo medical-certificate PDF to Supabase Storage and attaches it
 * to the first 10 leave requests in the database so the manager can preview
 * documents during the interview demo.
 *
 * Run from the server directory:
 *   node attach-docs.js
 */

'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const BUCKET = 'leave-documents';

// ── 1. Pick the local PDF to upload ────────────────────────────────────────
//    We ship a tiny "medical-certificate.pdf" in the server root.
//    If it doesn't exist we create a minimal valid PDF on the fly.
const LOCAL_PDF = path.join(__dirname, 'medical-certificate.pdf');

function ensurePdf() {
  if (fs.existsSync(LOCAL_PDF) && fs.statSync(LOCAL_PDF).size > 100) return;

  // Minimal but valid 1-page PDF
  const pdf = `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 595 842]/Parent 2 0 R/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj
4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj
5 0 obj<</Length 220>>
stream
BT
/F1 18 Tf
80 750 Td
(Medical Certificate) Tj
/F1 12 Tf
0 -40 Td
(This certifies that the employee was medically unfit) Tj
0 -20 Td
(and required leave for recovery. - Dr. A. Sharma) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000348 00000 n 
trailer<</Size 6/Root 1 0 R>>
startxref
618
%%EOF`;
  fs.writeFileSync(LOCAL_PDF, pdf);
  console.log('  ✔ Created minimal medical-certificate.pdf');
}

// ── helpers ─────────────────────────────────────────────────────────────────
const supabaseHeaders = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
};

async function restGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: { ...supabaseHeaders, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function restPatch(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    method: 'PATCH',
    headers: { ...supabaseHeaders, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH ${path} → ${res.status} ${await res.text()}`);
}

async function uploadToStorage(filename, fileBuffer, mimeType) {
  // Try delete first (upsert-style) to avoid 409 conflicts
  await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: 'DELETE',
    headers: supabaseHeaders,
  }).catch(() => {});

  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${filename}`, {
    method: 'POST',
    headers: {
      ...supabaseHeaders,
      'Content-Type': mimeType,
      'x-upsert': 'true',
    },
    body: fileBuffer,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload ${filename} → ${res.status}: ${text}`);
  }
  return filename;
}

// ── Documents to attach ─────────────────────────────────────────────────────
// We'll create different named files so each leave looks like a different doc
const DOC_VARIANTS = [
  { filename: 'medical-certificate-001.pdf', name: 'Medical Certificate.pdf' },
  { filename: 'sick-leave-note-002.pdf',     name: 'Sick Leave Doctor Note.pdf' },
  { filename: 'medical-report-003.pdf',      name: 'Medical Report.pdf' },
  { filename: 'hospital-receipt-004.pdf',    name: 'Hospital Receipt.pdf' },
  { filename: 'prescription-005.pdf',        name: 'Doctor Prescription.pdf' },
  { filename: 'leave-approval-006.pdf',      name: 'Leave Approval Letter.pdf' },
  { filename: 'medical-certificate-007.pdf', name: 'Medical Certificate.pdf' },
  { filename: 'travel-ticket-008.pdf',       name: 'Travel Ticket.pdf' },
  { filename: 'family-docs-009.pdf',         name: 'Family Emergency Notice.pdf' },
  { filename: 'birth-certificate-010.pdf',   name: 'Birth Certificate.pdf' },
];

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n📎 ELMS — Attach Demo Documents\n');

  ensurePdf();
  const pdfBuffer = fs.readFileSync(LOCAL_PDF);

  // 1. Fetch the 10 most recent leave requests
  console.log('📡 Fetching first 10 leave requests...');
  const rows = await restGet(
    '/leave_requests?select=id,reason&order=created_at.desc&limit=10'
  );

  if (!rows.length) {
    console.error('❌ No leave requests found. Run seed-demo.js first.');
    process.exit(1);
  }

  console.log(`  Found ${rows.length} requests.\n`);

  // 2. Upload + attach each one
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const doc = DOC_VARIANTS[i % DOC_VARIANTS.length];

    process.stdout.write(`  [${i + 1}/${rows.length}] Leave #${row.id} — uploading "${doc.name}"... `);

    try {
      await uploadToStorage(doc.filename, pdfBuffer, 'application/pdf');
      await restPatch(
        `/leave_requests?id=eq.${row.id}`,
        { document_url: doc.filename, document_name: doc.name }
      );
      console.log('✅');
    } catch (err) {
      console.log(`❌ ${err.message}`);
    }
  }

  console.log('\n🎉 Done! The first 10 leave requests now have attached documents.');
  console.log('   Open any request in the Manager Dashboard → the document preview will appear.\n');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
