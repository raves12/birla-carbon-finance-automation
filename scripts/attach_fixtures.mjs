// Phase 4 fixture loader: creates one x_695068_bcfa_finance_intake record per
// synthetic document under test/fixtures/ and attaches the corresponding PDF
// to it, ready for Content Understanding / Finance Document Intake testing.
//
// Idempotent: safe to rerun — skips any fixture that already has a matching
// finance_intake record (matched by source_reference) with an attachment.
//
// Credentials are read from the environment, never hardcoded here. Run with:
//   node --env-file=../servicenow-mcp-server/.env scripts/attach_fixtures.mjs
// (or point --env-file at any .env containing SN_INSTANCE, SN_USERNAME,
// SN_PASSWORD, SN_CLIENT_ID, SN_CLIENT_SECRET for this instance's OAuth
// Application Registry — see docs/INSTANCE_READINESS.md).

import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.resolve(__dirname, "../test/fixtures");

const { SN_INSTANCE, SN_USERNAME, SN_PASSWORD, SN_CLIENT_ID, SN_CLIENT_SECRET } = process.env;
if (!SN_INSTANCE || !SN_USERNAME || !SN_PASSWORD || !SN_CLIENT_ID || !SN_CLIENT_SECRET) {
  console.error("Missing SN_INSTANCE / SN_USERNAME / SN_PASSWORD / SN_CLIENT_ID / SN_CLIENT_SECRET.");
  console.error("Run with: node --env-file=<path-to-.env> scripts/attach_fixtures.mjs");
  process.exit(1);
}
const instance = SN_INSTANCE.replace(/\/$/, "");

// Maps each fixture file to the finance_intake record it should seed.
// document_type mirrors what Content Understanding classification
// would eventually assign — set here since these are pre-classified fixtures
// meant to demonstrate the extraction/matching step, not the classification
// step itself.
const FIXTURES = [
  { file: "AP_INV_001_CLEAN.pdf", documentType: "ap_invoice", note: "Clean 3-way match" },
  { file: "AP_INV_002_QTY_VARIANCE.pdf", documentType: "ap_invoice", note: "Quantity tolerance failure" },
  { file: "AP_INV_003_PRICE_VARIANCE.pdf", documentType: "ap_invoice", note: "Price tolerance failure" },
  { file: "AP_INV_004_DUPLICATE.pdf", documentType: "ap_invoice", note: "Duplicate invoice" },
  { file: "AP_INV_005_TAX_EXCEPTION.pdf", documentType: "ap_invoice", note: "Tax validation failure" },
  { file: "AP_INV_006_LOW_CONFIDENCE.pdf", documentType: "ap_invoice", note: "Low extraction confidence" },
  { file: "AR_REMIT_001_EXACT.pdf", documentType: "ar_remittance", note: "Exact match" },
  { file: "AR_REMIT_002_MULTI_INVOICE.pdf", documentType: "ar_remittance", note: "Multi-invoice allocation" },
  { file: "AR_REMIT_003_SHORT_PAY.pdf", documentType: "ar_remittance", note: "Short pay" },
  { file: "AR_REMIT_004_BANK_CHARGE.pdf", documentType: "ar_remittance", note: "Bank charge deduction" },
  { file: "AR_REMIT_005_ALIAS_CUSTOMER.pdf", documentType: "ar_remittance", note: "Customer alias resolution" },
];

let cachedToken = null;
async function getAccessToken() {
  if (cachedToken) return cachedToken;
  const body = new URLSearchParams({
    grant_type: "password",
    client_id: SN_CLIENT_ID,
    client_secret: SN_CLIENT_SECRET,
    username: SN_USERNAME,
    password: SN_PASSWORD,
  });
  const res = await fetch(`${instance}/oauth_token.do`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const data = await res.json();
  if (!data.access_token) throw new Error("OAuth token request failed: " + JSON.stringify(data));
  cachedToken = data.access_token;
  return cachedToken;
}

async function api(method, urlPath, { params, json, headers, body } = {}) {
  const token = await getAccessToken();
  const url = new URL(`${instance}${urlPath}`);
  if (params) Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, ...(json ? { "Content-Type": "application/json" } : {}), ...headers },
    body: json ? JSON.stringify(json) : body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${urlPath} -> ${res.status}: ${JSON.stringify(data)}`);
  return data.result;
}

async function findExistingIntake(sourceReference) {
  const results = await api("GET", "/api/now/table/x_695068_bcfa_finance_intake", {
    params: { sysparm_query: `source_reference=${sourceReference}`, sysparm_limit: "1" },
  });
  return results && results[0] ? results[0] : null;
}

async function hasAttachment(tableSysId) {
  const results = await api("GET", "/api/now/table/sys_attachment", {
    params: {
      sysparm_query: `table_name=x_695068_bcfa_finance_intake^table_sys_id=${tableSysId}`,
      sysparm_limit: "1",
    },
  });
  return results && results.length > 0;
}

async function createIntake(fixture) {
  return api("POST", "/api/now/table/x_695068_bcfa_finance_intake", {
    json: {
      source: "workspace_upload",
      source_reference: fixture.file,
      document_type: fixture.documentType,
      processing_status: "new",
    },
  });
}

async function uploadAttachment(tableSysId, filePath, fileName) {
  const token = await getAccessToken();
  const fileBuffer = await readFile(filePath);
  const url = new URL(`${instance}/api/now/attachment/file`);
  url.searchParams.set("table_name", "x_695068_bcfa_finance_intake");
  url.searchParams.set("table_sys_id", tableSysId);
  url.searchParams.set("file_name", fileName);
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/pdf" },
    body: fileBuffer,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Attachment upload failed for ${fileName}: ${res.status} ${JSON.stringify(data)}`);
  return data.result;
}

async function main() {
  for (const fixture of FIXTURES) {
    const filePath = path.join(FIXTURES_DIR, fixture.file);
    let intake = await findExistingIntake(fixture.file);
    if (!intake) {
      intake = await createIntake(fixture);
      console.log(`Created finance_intake for ${fixture.file} (${intake.number || intake.sys_id})`);
    } else {
      console.log(`finance_intake already exists for ${fixture.file} (${intake.number || intake.sys_id})`);
    }

    if (await hasAttachment(intake.sys_id)) {
      console.log(`  attachment already present — skipping upload`);
      continue;
    }

    await uploadAttachment(intake.sys_id, filePath, fixture.file);
    console.log(`  attached ${fixture.file}`);
  }
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
