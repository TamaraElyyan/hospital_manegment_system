/**
 * Build a user-visible message from axios /register failures (string body, or JSON, or network).
 * @param {import("axios").AxiosError} err
 * @param {(k: string) => string} t - i18n t()
 */
export function getRegisterErrorMessage(err, t) {
  if (!err) {
    return t("auth.registerFailed");
  }
  if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
    return t("auth.errorNetwork");
  }
  const status = err.response?.status;
  const data = err.response?.data;

  if (data == null || data === "") {
    if (status >= 500) {
      return t("auth.errorServer");
    }
    if (status === 0 || status == null) {
      return t("auth.errorNetwork");
    }
    return t("auth.registerFailed");
  }

  if (typeof data === "string") {
    const s = data.trim();
    if (!s) {
      return t("auth.registerFailed");
    }
    if (/username already exists/i.test(s)) {
      return t("auth.errorUsernameExists");
    }
    if (/email already exists/i.test(s)) {
      return t("auth.errorEmailExists");
    }
    if (/request body is required/i.test(s)) {
      return t("auth.errorBadRequest");
    }
    if (/registration failed/i.test(s)) {
      return t("auth.errorServer");
    }
    return s;
  }

  if (typeof data === "object") {
    if (data.message && typeof data.message === "string") {
      return mapKnownServerMessage(data.message, t) || data.message;
    }
    if (data.error && typeof data.error === "string") {
      return mapKnownServerMessage(data.error, t) || data.error;
    }
  }

  if (status >= 500) {
    return t("auth.errorServer");
  }

  return t("auth.registerFailed");
}

function mapKnownServerMessage(s, t) {
  if (/username already exists/i.test(s)) {
    return t("auth.errorUsernameExists");
  }
  if (/email already exists/i.test(s)) {
    return t("auth.errorEmailExists");
  }
  return null;
}
