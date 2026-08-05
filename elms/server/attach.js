const fs = require('fs');
require('dotenv').config();

async function attach() {
  const url = process.env.SUPABASE_URL + '/rest/v1/leave_requests?reason=ilike.*medical*';
  const url2 = process.env.SUPABASE_URL + '/rest/v1/leave_requests?reason=ilike.*unwell*';
  
  const headers = {
    'apikey': process.env.SUPABASE_KEY,
    'Authorization': 'Bearer ' + process.env.SUPABASE_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=minimal'
  };

  const payload = {
    document_url: 'medical-certificate.pdf',
    document_name: 'Medical Certificate.pdf'
  };

  try {
    const res1 = await fetch(url, { method: 'PATCH', headers, body: JSON.stringify(payload) });
    const res2 = await fetch(url2, { method: 'PATCH', headers, body: JSON.stringify(payload) });
    
    console.log("Status 1:", res1.status);
    console.log("Status 2:", res2.status);
  } catch (err) {
    console.error("Error:", err);
  }
}

attach();
