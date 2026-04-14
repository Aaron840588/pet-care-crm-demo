/**
 * INVOICE IMAGE IMPORTER
 * ─────────────────────────────────────────────────────────────────────────────
 * Reads all PNG invoice images from the Pet-sitting folder, sends them to
 * Gemini Vision to extract invoice data, then imports them into Firestore
 * as paid invoice records — skipping any duplicates.
 *
 * Usage:
 *   1. Fill in FIREBASE_EMAIL and FIREBASE_PASSWORD below
 *   2. Run: node scripts/import-invoices.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, getDocs, query, serverTimestamp
} from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';

// ── CONFIG ───────────────────────────────────────────────────────────────────
const GEMINI_API_KEY  = 'AIzaSyD3c8VRxX5asRzyjsYDTSJiLYnY3zh4LJE';
const IMG_DIR         = 'C:\\Users\\aaron\\Downloads\\Pet-sitting';

// !! FILL THESE IN !!
const FIREBASE_EMAIL    = 'kathleen.gonzales68@gmail.com';
const FIREBASE_PASSWORD = 'ribbon';

const firebaseConfig = {
  apiKey:        'AIzaSyB4EPHJWKzQNrdI6FXkt860d3W0Z3d5nnY',
  authDomain:    'petsit-manager.firebaseapp.com',
  projectId:     'petsit-manager',
};

// ── INIT ─────────────────────────────────────────────────────────────────────
const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_URL   = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
const fbApp  = initializeApp(firebaseConfig);
const db     = getFirestore(fbApp);
const auth   = getAuth(fbApp);

// ── HELPERS ──────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function fileToBase64(filePath) {
  return fs.readFileSync(filePath).toString('base64');
}

function normalizeAmount(val) {
  if (!val) return 0;
  return Math.round(Number(String(val).replace(/[^0-9.]/g, '')) || 0);
}

function normalizeDate(val) {
  if (!val) return '';
  // Try to return YYYY-MM-DD
  const d = new Date(val);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return String(val).trim();
}

// ── EXTRACT INVOICE DATA VIA GEMINI ─────────────────────────────────────────
async function extractInvoiceFromImage(imgPath) {
  const base64 = fileToBase64(imgPath);
  const prompt = `
You are reading a pet sitting invoice image. Extract the following fields as JSON.
Return ONLY valid JSON with no explanation, no markdown, no code blocks.

Fields to extract:
- toName: the client name (e.g. "Ate Jasmine", "Kuya Pao")
- pets: the pet name(s) if visible (string, comma separated)
- total: the total amount (number, Philippine Peso, integers only)
- paid: amount paid (same as total if marked paid, otherwise 0)
- baseServiceName: the main service or description (e.g. "Basic Visit", "Pet Sitting")
- dateSaved: the invoice or visit date (YYYY-MM-DD format if possible, or as written)
- tip: tip amount if any (number, default 0)
- notes: any extra notes (string, can be empty string)

If a field is not visible, use empty string for strings and 0 for numbers.
Return only a single JSON object.
  `.trim();

  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: 'image/png', data: base64 } },
        { text: prompt }
      ]
    }]
  };

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

  // Strip markdown code fences if model includes them
  const cleaned = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    console.warn(`  ⚠️  Could not parse JSON for ${path.basename(imgPath)}:`, cleaned.slice(0, 200));
    return null;
  }
}

// ── DUPLICATE DETECTION ──────────────────────────────────────────────────────
function isDuplicate(extracted, existing) {
  const name  = String(extracted.toName || '').toLowerCase().trim();
  const total = normalizeAmount(extracted.total);
  const date  = normalizeDate(extracted.dateSaved);

  return existing.some(inv => {
    const eName  = String(inv.toName || '').toLowerCase().trim();
    const eTotal = normalizeAmount(inv.total);
    const eDate  = normalizeDate(inv.dateSaved);

    const nameMatch  = eName && name && eName === name;
    const totalMatch = total > 0 && eTotal === total;
    const dateMatch  = date && eDate && eDate === date;

    // Duplicate if name + total match, OR name + date match
    return nameMatch && (totalMatch || dateMatch);
  });
}

// ── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  // Check credentials are filled in
  if (FIREBASE_EMAIL === 'YOUR_EMAIL_HERE' || FIREBASE_PASSWORD === 'YOUR_PASSWORD_HERE') {
    console.error('\n❌  Please fill in FIREBASE_EMAIL and FIREBASE_PASSWORD in the script first!\n');
    process.exit(1);
  }

  // Sign into Firebase
  console.log('\n🔐  Signing in to Firebase...');
  try {
    await signInWithEmailAndPassword(auth, FIREBASE_EMAIL, FIREBASE_PASSWORD);
    console.log('   ✅  Signed in!');
  } catch (err) {
    console.error('   ❌  Login failed:', err.message);
    process.exit(1);
  }

  // Load existing invoices for duplicate check
  console.log('\n📂  Loading existing invoice records...');
  const existingSnap = await getDocs(query(collection(db, 'invoices')));
  const existing = existingSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  console.log(`   Found ${existing.length} existing invoice(s).`);

  // Find all PNG images
  const files = fs.readdirSync(IMG_DIR).filter(f => f.toLowerCase().endsWith('.png'));
  console.log(`\n🖼️   Found ${files.length} image(s) to process.\n`);

  let added = 0, skipped = 0, failed = 0;
  const results = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const imgPath = path.join(IMG_DIR, file);
    process.stdout.write(`[${i + 1}/${files.length}] ${file}... `);

    try {
      const data = await extractInvoiceFromImage(imgPath);

      if (!data || !data.toName) {
        console.log('⚠️  No client name found, skipping.');
        failed++;
        continue;
      }

      // Normalize amounts
      const record = {
        toName:          String(data.toName || '').trim(),
        pets:            String(data.pets || '').trim(),
        baseServiceName: String(data.baseServiceName || 'Pet Sitting').trim(),
        total:           normalizeAmount(data.total),
        paid:            normalizeAmount(data.paid) || normalizeAmount(data.total), // mark paid
        tip:             normalizeAmount(data.tip),
        dateSaved:       normalizeDate(data.dateSaved) || new Date().toISOString().split('T')[0],
        notes:           String(data.notes || '').trim(),
        lineItems:       [],
      };

      // Duplicate check
      if (isDuplicate(record, [...existing, ...results])) {
        console.log('⏩  Duplicate, skipping.');
        skipped++;
        continue;
      }

      // Write to Firestore
      await addDoc(collection(db, 'invoices'), {
        ...record,
        createdAt: serverTimestamp(),
        _importedFrom: file,
      });

      results.push(record);
      added++;
      console.log(`✅  Added (₱${record.total}, paid ₱${record.paid})`);

      // Rate limit: don't hammer the API
      await sleep(600);

    } catch (err) {
      console.log(`❌  Error: ${err.message}`);
      failed++;
      await sleep(1000);
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅  Import complete!
   Added:   ${added} new invoice records
   Skipped: ${skipped} duplicates
   Failed:  ${failed} (unreadable images)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
}

main().catch(err => {
  console.error('\n💥  Unexpected error:', err);
  process.exit(1);
});
