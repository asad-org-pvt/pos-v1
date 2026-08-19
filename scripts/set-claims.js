/**
 * Utility script to assign tenantId and role custom claims to an existing Firebase Auth user.
 * 
 * Usage:
 *   node scripts/set-claims.js <email> [tenantId] [role]
 * 
 * Example:
 *   node scripts/set-claims.js admin@example.com org_main admin
 */

const admin = require("../functions/node_modules/firebase-admin");

// Initialize Firebase Admin using default credentials or project ID
const projectId = process.env.FIREBASE_PROJECT_ID || "hms-v1-33bbc";

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: projectId,
  });
}

const args = process.argv.slice(2);
const email = args[0];
const tenantId = args[1] || "org_demo";
const role = (args[2] || "admin").toLowerCase();

if (!email) {
  console.error("Usage: node scripts/set-claims.js <user-email> [tenantId] [role]");
  process.exit(1);
}

if (!["cashier", "manager", "admin"].includes(role)) {
  console.error("Role must be one of: 'cashier', 'manager', 'admin'");
  process.exit(1);
}

async function setClaims() {
  try {
    const user = await admin.auth().getUserByEmail(email);
    console.log(`Found user: ${user.email} (UID: ${user.uid})`);

    // Set custom claims
    await admin.auth().setCustomUserClaims(user.uid, {
      tenantId: tenantId,
      role: role,
    });

    console.log(`Successfully assigned custom claims to ${email}:`);
    console.log(`  tenantId: "${tenantId}"`);
    console.log(`  role: "${role}"`);
    console.log(`User can now log in immediately!`);
    process.exit(0);
  } catch (error) {
    console.error("Error setting custom claims:", error.message);
    process.exit(1);
  }
}

setClaims();
