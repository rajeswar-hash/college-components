import { Listing, User } from "./types";
import { MOCK_LISTINGS } from "./mock-data";

const LISTINGS_KEY = "cc_listings";
const USER_KEY = "cc_user";

function initListings(): Listing[] {
  const stored = localStorage.getItem(LISTINGS_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(MOCK_LISTINGS));
  return MOCK_LISTINGS;
}

export function getListings(): Listing[] {
  return initListings();
}

export function saveListings(listings: Listing[]) {
  localStorage.setItem(LISTINGS_KEY, JSON.stringify(listings));
}

export function addListing(listing: Listing) {
  const listings = getListings();
  listings.unshift(listing);
  saveListings(listings);
}

export function updateListing(id: string, updates: Partial<Listing>) {
  const listings = getListings().map((l) =>
    l.id === id ? { ...l, ...updates } : l
  );
  saveListings(listings);
}

export function deleteListing(id: string) {
  const listings = getListings().filter((l) => l.id !== id);
  saveListings(listings);
}

export function getListingById(id: string): Listing | undefined {
  return getListings().find((l) => l.id === id);
}

export function getUser(): User | null {
  const stored = localStorage.getItem(USER_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function saveUser(user: User) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser() {
  localStorage.removeItem(USER_KEY);
}

