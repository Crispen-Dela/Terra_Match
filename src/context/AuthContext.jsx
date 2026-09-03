import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from "../services/firebase";
import { authApi } from "../services/authApi";
import { authEvents, getStoredToken, setStoredToken } from "../services/api";

const AuthContext = createContext(null);

const FRONTEND_TO_BACKEND_ROLE = {
  "land-owner": "LAND_OWNER",
  contractor: "CONTRACTOR",
  "general-user": "CLIENT",
  admin: "ADMIN",
};

const BACKEND_TO_FRONTEND_ROLE = {
  CLIENT: "general-user",
  LAND_OWNER: "land-owner",
  CONTRACTOR: "contractor",
  ADMIN: "admin",
};

export function toBackendRole(frontendRoleId) {
  return FRONTEND_TO_BACKEND_ROLE[frontendRoleId] || "CLIENT";
}

export function toFrontendRole(backendRole) {
  return BACKEND_TO_FRONTEND_ROLE[backendRole] || "general-user";
}

export const GHANA_CARD_REQUIRED_ROLES = ["land-owner", "contractor"];

const ROLE_DESTINATIONS = {
  "land-owner": "/dashboard",
  contractor: "/dashboard",
  "general-user": "/dashboard",
  admin: "/admin",
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(getStoredToken);
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuth = useCallback(async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    setToken(null);
    setUser(null);
    setFirebaseUser(null);
    setStoredToken(null);
  }, []);

  // Single source of truth: Firebase Auth state listener.
  // Handles both Firebase users and legacy backend-JWT-only users.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setStoredToken(idToken);
          setToken(idToken);
          const backendUser = await authApi.me();
          setUser(backendUser);
        } catch (err) {
          // Token expired or server unreachable
        }
      } else {
        // Firebase has no session — check for a backend JWT (admin/pre-seeded users)
        const storedToken = getStoredToken();
        if (storedToken) {
          try {
            const backendUser = await authApi.me();
            setUser(backendUser);
          } catch {
            // Token invalid — wipe it so the user is cleanly logged out
            setStoredToken(null);
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle unauthorized global event
  useEffect(() => {
    function handleUnauthorized() {
      clearAuth();
    }
    authEvents.addEventListener("unauthorized", handleUnauthorized);
    return () => authEvents.removeEventListener("unauthorized", handleUnauthorized);
  }, [clearAuth]);

  /**
   * User Registration:
   * 1. Creates Firebase account
   * 2. Sends Firebase email verification link
   * 3. Syncs account to PostgreSQL backend
   */
  const register = useCallback(
    async ({ name, email, password, frontendRole = "general-user", phone }) => {
      let fbUser = null;
      let idToken = null;

      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email.trim(),
          password
        );
        fbUser = userCredential.user;

        // Send real email verification
        await sendEmailVerification(fbUser);
        idToken = await fbUser.getIdToken();
      } catch (fbErr) {
        // Translate Firebase error codes to friendly messages
        if (fbErr.code === "auth/email-already-in-use") {
          throw new Error("An account with this email already exists.");
        } else if (fbErr.code === "auth/weak-password") {
          throw new Error("Password must be at least 6 characters.");
        } else if (fbErr.code === "auth/invalid-email") {
          throw new Error("Please enter a valid email address.");
        }
        throw new Error(fbErr.message || "Failed to create account.");
      }

      // Sync to PostgreSQL backend
      const response = await authApi.register({
        name,
        email,
        password,
        role: toBackendRole(frontendRole),
        phone,
        firebaseUid: fbUser.uid,
      });

      const activeToken = idToken || response.token;
      setStoredToken(activeToken);
      setToken(activeToken);
      setUser(response.user);
      setFirebaseUser(fbUser);
      return response.user;
    },
    []
  );

  /**
   * User Login:
   * 1. Authenticates with Firebase
   * 2. Obtains verified ID token
   * 3. Syncs session with backend
   */
  const login = useCallback(async ({ email, password }) => {
    let fbUser = null;
    let idToken = null;

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      fbUser = userCredential.user;
      idToken = await fbUser.getIdToken();
    } catch (fbErr) {
      if (
        fbErr.code === "auth/user-not-found" ||
        fbErr.code === "auth/wrong-password" ||
        fbErr.code === "auth/invalid-credential"
      ) {
        // Fallback: test against backend directly (e.g. for pre-seeded database accounts)
        try {
          const backendRes = await authApi.login({ email, password });
          setStoredToken(backendRes.token);
          setToken(backendRes.token);
          setUser(backendRes.user);
          return backendRes.user;
        } catch {
          throw new Error("Invalid email or password.");
        }
      } else if (fbErr.code === "auth/too-many-requests") {
        throw new Error("Too many failed attempts. Please try again later.");
      }
      throw new Error(fbErr.message || "Invalid email or password.");
    }

    const response = await authApi.login({
      email,
      password,
      firebaseUid: fbUser.uid,
      idToken,
    });

    const activeToken = idToken || response.token;
    setStoredToken(activeToken);
    setToken(activeToken);
    setUser(response.user);
    setFirebaseUser(fbUser);
    return response.user;
  }, []);

  /**
   * Admin Login:
   * Direct backend administrative authentication with RBAC enforcement
   */
  const loginAdmin = useCallback(async ({ email, password }) => {
    const response = await authApi.login({ email, password });
    if (response.user.role !== "ADMIN") {
      throw new Error("Access denied. Administrative privileges required.");
    }
    setStoredToken(response.token);
    setToken(response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    if (auth.currentUser) {
      try {
        await sendEmailVerification(auth.currentUser);
        return true;
      } catch (err) {
        console.warn("Client email verification resend fallback:", err.message);
      }
    }
    // Backend trigger fallback
    await authApi.resendVerification();
    return true;
  }, []);

  /**
   * Send Password Reset Email
   */
  const sendPasswordReset = useCallback(async (email) => {
    if (!email) throw new Error("Please enter your email address.");
    await sendPasswordResetEmail(auth, email.trim());
    return true;
  }, []);

  /**
   * Refresh / reload email verification status
   */
  const reloadUser = useCallback(async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      // Force a token refresh so the new email_verified claim is included
      const freshToken = await auth.currentUser.getIdToken(true);
      setStoredToken(freshToken);
      setToken(freshToken);
      setFirebaseUser(auth.currentUser);
    }
    const fresh = await authApi.me();
    setUser(fresh);
    return fresh;
  }, []);

  const verifyGhanaCard = useCallback(async (params) => {
    const res = await authApi.verifyGhanaCard(
      typeof params === "string" ? { ghanaCardNumber: params } : params
    );
    setUser(res.user);
    return res.user;
  }, []);

  const updateProfile = useCallback(async (data) => {
    const res = await authApi.updateMe(data);
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await clearAuth();
  }, [clearAuth]);

  const value = useMemo(() => {
    const frontendRole = user ? toFrontendRole(user.role) : null;
    const isEmailVerified = Boolean(
      firebaseUser?.emailVerified || user?.emailVerified
    );

    return {
      isAuthed: Boolean((token || firebaseUser) && user),
      isLoading,
      token,
      user,
      firebaseUser,
      role: frontendRole,
      backendRole: user?.role ?? null,
      isAdmin: user?.role === "ADMIN",
      emailVerified: isEmailVerified,
      ghanaCardVerified: Boolean(user?.ghanaCardVerified),
      login,
      loginAdmin,
      register,
      logout,
      verifyGhanaCard,
      updateProfile,
      resendVerificationEmail,
      sendPasswordReset,
      reloadUser,
    };
  }, [
    token,
    user,
    firebaseUser,
    isLoading,
    login,
    loginAdmin,
    register,
    logout,
    verifyGhanaCard,
    updateProfile,
    resendVerificationEmail,
    sendPasswordReset,
    reloadUser,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export function useRequiresGhanaCard(role) {
  const { role: currentRole } = useAuth();
  const targetRole = role ?? currentRole;
  return GHANA_CARD_REQUIRED_ROLES.includes(targetRole);
}

export function getRoleDestination(role) {
  return ROLE_DESTINATIONS[role] || "/dashboard";
}

export function useGetStartedTarget() {
  const { isAuthed, role } = useAuth();
  return isAuthed ? getRoleDestination(role) : "/get-started";
}
