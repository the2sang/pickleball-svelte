import { writable } from "svelte/store";
import { browser } from "$app/environment";

function createAuthStore() {
    const initialUser = browser ? getStoredUser() : null;
    const { subscribe, set } = writable(initialUser);

    function getStoredUser() {
        const accessToken = localStorage.getItem("accessToken");
        const username = localStorage.getItem("username");
        const name = localStorage.getItem("name");
        const accountType = localStorage.getItem("accountType");
        if (accessToken && username) {
            return { accessToken, username, name, accountType };
        }
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
