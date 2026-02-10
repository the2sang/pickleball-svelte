import { writable, derived } from 'svelte/store';
import { MOCK_COURTS } from '$lib/data/mock.js';
import { getNext7Days } from '$lib/data/mock.js';

const dates = getNext7Days();

export const selectedPartner = writable(null);
export const selectedDate = writable(dates[0].value);
export const modalOpen = writable(false);
export const modalData = writable(null);
export const confirmOpen = writable(false);
export const successOpen = writable(false);

export const filteredCourts = derived(selectedPartner, ($partner) =>
  $partner ? MOCK_COURTS.filter((c) => c.partnerId === $partner) : []
);
