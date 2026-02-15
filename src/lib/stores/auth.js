import { writable } from "svelte/store";
import { browser } from "$app/environment";

function decodeBase64Url(input) {
    // Base64URL -> Base64
    const base64 = String(input).replace(/-/g, "+").replace(/_/g, "/");
    const pad = base64.length % 4;
    const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
    return atob(padded);
}

function decodeJwtPayload(token) {
    if (!token) return null;
    const parts = String(token).split(".");
    if (parts.length < 2) return null;
    try {
        const json = decodeBase64Url(parts[1]);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function isJwtExpired(token, skewSeconds = 30) {
    const payload = decodeJwtPayload(token);
    const exp = payload?.exp;
    if (!exp || typeof exp !== "number") return false;
    const nowSeconds = Math.floor(Date.now() / 1000);
    return nowSeconds >= exp - skewSeconds;
}

function createAuthStore() {
    const initialUser = browser ? getStoredUser() : null;
    const { subscribe, set } = writable(initialUser);

    function getStoredUser() {
        const accessToken = localStorage.getItem("accessToken");
        const username = localStorage.getItem("username");
        const name = localStorage.getItem("name");
        const accountType = localStorage.getItem("accountType");

        if (accessToken && isJwtExpired(accessToken)) {
            // Token is expired (or about to expire). Clear and force re-login.
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("username");
            localStorage.removeItem("name");
            localStorage.removeItem("accountType");
            return null;
        }

        if (accessToken && username) return { accessToken, username, name, accountType };
        return null;
    }

    return {
        subscribe,
        login(tokenData) {
            const user = {
                accessToken: tokenData.accessToken,
                username: tokenData.username,
                name: tokenData.name,
                accountType: tokenData.accountType,
            };
            localStorage.setItem("accessToken", tokenData.accessToken);
            if (tokenData.refreshToken) {
                localStorage.setItem("refreshToken", tokenData.refreshToken);
            }
            localStorage.setItem("username", tokenData.username);
            localStorage.setItem("name", tokenData.name);
            localStorage.setItem("accountType", tokenData.accountType || "MEMBER");
            set(user);
        },
        logout() {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("username");
            localStorage.removeItem("name");
            localStorage.removeItem("accountType");
            set(null);
        },
        refresh() {
            set(browser ? getStoredUser() : null);
        },
    };
}

export const auth = createAuthStore();
