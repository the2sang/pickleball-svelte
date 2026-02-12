import { writable, derived } from 'svelte/store';

import { getNext7Days } from '$lib/data/mock.js';

const dates = getNext7Days();

export const selectedPartner = writable(null);
export const partnerInfo = writable(null); // { id, name, ... }
export const selectedDate = writable(dates[0].value);
export const modalOpen = writable(false);
export const modalData = writable(null);
export const confirmOpen = writable(false);
export const successOpen = writable(false);
export const refreshTrigger = writable(0);

export const courts = writable([]); // List of courts for selected partner

// Deprecated or alias to courts for compatibility if needed, but better to use courts directly.
// Keeping filteredCourts as alias to courts for now to minimize changes in other files
export const filteredCourts = courts;
