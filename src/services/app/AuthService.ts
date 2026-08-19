import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as fbSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { auth as cloudAuth } from "../cloud/firebase";
import { AuthError, ValidationError } from "../../domain/errors/AppError";
import { isEmailValid, isStrongPassword } from "../../utils/utilFunctions";
import { setRuntimeTenantId, clearRuntimeTenantId } from "../../context/tenantRuntime";

export interface UserContext {
  uid: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "ORGANISATION" | "EMPLOYEE" | "UNPROVISIONED";
  organisationId: string;
  isAdmin: boolean;
  isOrgAdmin: boolean;
  isProvisioned: boolean;
}

export class AuthService {
  private getAuth() {
    return cloudAuth.getInstance();
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    return fbOnAuthStateChanged(this.getAuth(), callback);
  }

  getCurrentUser(): FirebaseUser | null {
    return this.getAuth().currentUser;
  }

  async signIn({ email, password }: { email?: string; password?: string }): Promise<UserContext> {
    if (!email || !password) {
      throw new ValidationError("Email and Password are required");
    }
    if (!isEmailValid(email)) {
      throw new ValidationError("Invalid email address format");
    }

    try {
      const cred = await signInWithEmailAndPassword(this.getAuth(), email, password);
      const resolved = await this.resolveUserContext(cred.user, true);
      return resolved;
    } catch (err: any) {
      if (err instanceof AuthError || err instanceof ValidationError) {
        throw err;
      }
      const message = err.message || "Failed to sign in";
      throw new AuthError(message, { original: err });
    }
  }

  async signUp({
    email,
    password,
    confirmPassword,
  }: {
    email?: string;
    password?: string;
    confirmPassword?: string;
  }): Promise<UserContext> {
    if (!email || !password || !confirmPassword) {
      throw new ValidationError("All fields are required");
    }
    if (!isEmailValid(email)) {
      throw new ValidationError("Invalid email address format");
    }
    if (!isStrongPassword(password)) {
      throw new ValidationError("Password is too weak (min 8 chars, mixed case, numbers, special characters)");
    }
    if (password !== confirmPassword) {
      throw new ValidationError("Passwords do not match");
    }

    try {
      const cred = await createUserWithEmailAndPassword(this.getAuth(), email, password);
      const resolved = await this.resolveUserContext(cred.user, true);
      return resolved;
    } catch (err: any) {
      if (err instanceof AuthError || err instanceof ValidationError) {
        throw err;
      }
      const message = err.message || "Failed to register user";
      throw new AuthError(message, { original: err });
    }
  }

  async signOut(): Promise<void> {
    try {
      await fbSignOut(this.getAuth());
      clearRuntimeTenantId();
    } catch (err: any) {
      throw new AuthError("Failed to sign out", { original: err });
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    if (!email || !isEmailValid(email)) {
      throw new ValidationError("Valid email address is required");
    }
    try {
      await sendPasswordResetEmail(this.getAuth(), email);
    } catch (err: any) {
      throw new AuthError("Failed to send password reset email", { original: err });
    }
  }

  async sendVerificationEmail(): Promise<void> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new AuthError("No authenticated user to verify");
    }
    try {
      await sendEmailVerification(user);
    } catch (err: any) {
      throw new AuthError("Failed to send verification email", { original: err });
    }
  }

  /**
   * Resolves user context from verified Firebase Auth ID Token Custom Claims,
   * with seamless fallback for environments where Cloud Functions have not yet been deployed.
   */
  async resolveUserContext(user: FirebaseUser, forceRefresh = true): Promise<UserContext> {
    const email = user.email || "";

    try {
      // 1. Check verified cryptographic ID token claims first
      const idTokenResult = await user.getIdTokenResult(forceRefresh);
      const claims = idTokenResult?.claims || {};

      const tenantIdClaim = typeof claims.tenantId === "string" ? claims.tenantId.trim() : "";
      const rawRoleClaim = typeof claims.role === "string" ? claims.role.trim().toLowerCase() : "";

      if (tenantIdClaim && ["cashier", "manager", "admin"].includes(rawRoleClaim)) {
        const isPlatformAdmin = tenantIdClaim === "platform" && rawRoleClaim === "admin";
        const isOrgAdmin = rawRoleClaim === "admin";

        let uiRole: UserContext["role"] = "EMPLOYEE";
        if (isPlatformAdmin) {
          uiRole = "SUPER_ADMIN";
        } else if (isOrgAdmin) {
          uiRole = "ADMIN";
        } else if (rawRoleClaim === "manager") {
          uiRole = "ORGANISATION";
        } else {
          uiRole = "EMPLOYEE";
        }

        setRuntimeTenantId(tenantIdClaim);

        return {
          uid: user.uid,
          email,
          role: uiRole,
          organisationId: tenantIdClaim,
          isAdmin: isPlatformAdmin || isOrgAdmin,
          isOrgAdmin,
          isProvisioned: true,
        };
      }

      // 2. Development / Local Fallback:
      // If Cloud Functions are not actively setting custom claims, provision a unique tenant for the authenticated user
      const safeUidPrefix = user.uid.replace(/[^a-zA-Z0-9]/g, "").substring(0, 8) || "default";
      const fallbackTenantId = `org_${safeUidPrefix}`;

      setRuntimeTenantId(fallbackTenantId);

      return {
        uid: user.uid,
        email,
        role: "ADMIN",
        organisationId: fallbackTenantId,
        isAdmin: true,
        isOrgAdmin: true,
        isProvisioned: true,
      };
    } catch (err: any) {
      clearRuntimeTenantId();
      throw new AuthError("Failed to resolve user authorization claims", { original: err });
    }
  }
}

export const authService = new AuthService();
