import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();
const db = admin.firestore();

/**
 * Triggered on newly created Firebase Auth users.
 * Establishes trusted Custom Claims and provisions Organization documents.
 */
export const onUserCreated = functions.auth.user().onCreate(async (user) => {
  const email = user.email || "";
  const uid = user.uid;

  try {
    // 1. Check if user is in platform administrators list
    const adminsDoc = await db.collection("admins").doc("admins").get();
    if (adminsDoc.exists) {
      const adminsList = (adminsDoc.data()?.admins as string[]) || [];
      if (email && adminsList.includes(email)) {
        await admin.auth().setCustomUserClaims(uid, {
          tenantId: "platform",
          role: "admin",
        });
        return;
      }
    }

    // 2. Otherwise, treat as a new Organization Owner signup
    const safeUidPrefix = uid.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8) || Date.now().toString(36);
    const tenantId = `org_${safeUidPrefix}`;

    // Create the authoritative organization document
    const orgRef = db.collection("organisations").doc(tenantId);
    const orgDoc = await orgRef.get();
    if (!orgDoc.exists) {
      await orgRef.set({
        id: tenantId,
        name: `${email ? email.split("@")[0] : "Store"}'s Organization`,
        email: email,
        ownerUid: uid,
        ownerEmail: email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // Set authoritative Custom Claims on the token
    await admin.auth().setCustomUserClaims(uid, {
      tenantId,
      role: "admin",
    });
  } catch (error) {
    functions.logger.error("Failed to provision claims in onUserCreated", { uid, email, error });
    throw error;
  }
});

/**
 * HTTPS Callable function for Tenant Admins to manage Employee roles and claims securely.
 */
export const setEmployeeRoleAndTenant = functions.https.onCall(async (data, context) => {
  // 1. Authentication check
  if (!context.auth || !context.auth.uid) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated.");
  }

  // 2. Extract caller identity strictly from token claims
  const callerTenantId = context.auth.token.tenantId as string | undefined;
  const callerRole = context.auth.token.role as string | undefined;

  if (!callerTenantId || callerRole !== "admin") {
    throw new functions.https.HttpsError("permission-denied", "Only tenant administrators can manage employee roles.");
  }

  const { targetUid, role, action } = data || {};

  if (!targetUid || typeof targetUid !== "string") {
    throw new functions.https.HttpsError("invalid-argument", "Valid targetUid is required.");
  }

  const employeeDocRef = db.collection(`${callerTenantId}-employees`).doc(targetUid);

  // 3. Handle Deactivation / Removal
  if (action === "DEACTIVATE" || action === "REMOVE") {
    try {
      await employeeDocRef.set(
        {
          isActive: false,
          status: "INACTIVE",
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      // Revoke claims and disable user
      await admin.auth().setCustomUserClaims(targetUid, {
        tenantId: null,
        role: null,
      });
      await admin.auth().updateUser(targetUid, { disabled: true });
      await admin.auth().revokeRefreshTokens(targetUid);

      return { success: true, message: `Employee ${targetUid} deactivated successfully.` };
    } catch (err: any) {
      functions.logger.error("Error deactivating employee", err);
      throw new functions.https.HttpsError("internal", err.message || "Failed to deactivate employee.");
    }
  }

  // 4. Role assignment validation
  const normalizedRole = typeof role === "string" ? role.toLowerCase() : "";
  if (!["cashier", "manager", "admin"].includes(normalizedRole)) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Role must be one of: 'cashier', 'manager', 'admin'."
    );
  }

  try {
    // 5. Update/Create employee record in tenant collection
    await employeeDocRef.set(
      {
        id: targetUid,
        organisationId: callerTenantId,
        role: normalizedRole,
        isActive: true,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );

    // 6. Set custom claims on target user
    await admin.auth().setCustomUserClaims(targetUid, {
      tenantId: callerTenantId,
      role: normalizedRole,
    });

    // 7. Revoke refresh tokens to force immediate token refresh on target client
    await admin.auth().revokeRefreshTokens(targetUid);

    return {
      success: true,
      tenantId: callerTenantId,
      role: normalizedRole,
    };
  } catch (err: any) {
    functions.logger.error("Error setting employee role and claims", err);
    throw new functions.https.HttpsError("internal", err.message || "Failed to set employee role.");
  }
});
