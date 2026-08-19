import { User } from "firebase/auth";
import toast from "react-hot-toast";
import emailJs from "@emailjs/browser";
import {
  PUBLIC_KEY,
  SERVICE_ID_GMAIL,
  TEMPLATE_ID_INVENTORY_RUNNING_OUT,
} from "../constants/emailjs";
import { authService } from "../services/app/AuthService";
import { setRuntimeTenantId } from "../context/tenantRuntime";

/**
 * Given the last used invoice number, returns a generator function that yields the NEXT sequential numbers.
 */
export const generateNextInvoiceNumber = (initialNumber = "AAA0000000") => {
  if (!/^[A-Z]{3}\d{7}$/.test(initialNumber)) {
    initialNumber = "AAA0000000";
  }

  const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let currentLetters = initialNumber.slice(0, 3);
  let currentNumber = parseInt(initialNumber.slice(3), 10);

  return function () {
    currentNumber++;

    if (currentNumber > 9999999) {
      currentNumber = 0;

      // Increment the alphabet characters
      let carry = 1;
      for (let i = 2; i >= 0; i--) {
        let index = LETTERS.indexOf(currentLetters[i]);
        index += carry;
        if (index >= LETTERS.length) {
          index = 0;
          carry = 1;
        } else {
          carry = 0;
        }
        currentLetters =
          currentLetters.substring(0, i) +
          LETTERS[index] +
          currentLetters.substring(i + 1);
      }
    }

    const number = currentNumber.toString().padStart(7, "0");
    return `${currentLetters}${number}`;
  };
};

export const isEmailValid = (email?: string): boolean => {
  if (!email) return false;
  const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
};

export const isStrongPassword = (password?: string): boolean => {
  if (!password || password.length < 8) {
    return false;
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+{}[\]:;<>,.?~\\-]/.test(password);

  return hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
};

export const addUserInLocalstorage = (user: User) => {
  user
    .getIdToken()
    .then((res) => {
      localStorage.setItem("tkn", res);
      localStorage.setItem("uid", user.uid);
      if (user.email) localStorage.setItem("email", user.email);
      if (user.photoURL) localStorage.setItem("photoURL", user.photoURL);
    })
    .catch(() => toast.error("Unable to generate idToken"));
};

export const setOrganisationInLocalStorage = (organisationEmail: string) => {
  if (organisationEmail) {
    const orgKey = `${organisationEmail?.split("@")[0]}_${
      organisationEmail?.split("@")[1]?.split(".")[0]
    }`;
    localStorage.setItem("org", orgKey);
    setRuntimeTenantId(orgKey);
  }
};

export const removeUserFromLocalstorage = () => {
  localStorage.removeItem("tkn");
  localStorage.removeItem("uid");
  localStorage.removeItem("email");
  localStorage.removeItem("photoURL");
  localStorage.removeItem("org");
};

/**
 * Checks authentication status via current Firebase Auth session or token cache.
 */
export const isAuthenticated = (): boolean => {
  const fbUser = authService.getCurrentUser();
  if (fbUser) return true;
  return !!localStorage.getItem("tkn");
};

export const isAdmin = (admins: string[] = []): boolean => {
  const currentUserEmail = authService.getCurrentUser()?.email || localStorage.getItem("email") || "";
  if (!currentUserEmail && admins.length <= 0) {
    return false;
  }
  return admins.includes(currentUserEmail);
};

export const isOrganisation = (organisations: any[] = []): boolean => {
  const currentUserEmail = authService.getCurrentUser()?.email || localStorage.getItem("email") || "";
  if (!currentUserEmail && organisations.length <= 0) {
    return false;
  }
  return !!organisations.find((item) => item?.email?.includes(currentUserEmail));
};

export const sendEmail = (toEmail: string, message: string) => {
  if (!toEmail || !message) {
    console.error("Invalid email or message");
    return;
  }
  const templateParams = {
    user_email: toEmail,
    message: message,
  };

  emailJs
    .send(
      SERVICE_ID_GMAIL,
      TEMPLATE_ID_INVENTORY_RUNNING_OUT,
      templateParams,
      PUBLIC_KEY
    )
    .then(
      (result) => {
        console.log("Email sent:", result.text);
      },
      (error) => {
        console.log("Failed to send email:", error.text);
      }
    );
};
