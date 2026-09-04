// Shared per-tab navigation memory for the bottom tab bar.
// Each tab remembers the sub-page the user last left it on, so switching
// back restores their position instead of resetting to the tab root.
export const TAB_ROOTS = ['/Discover', '/Bookings', '/Messages', '/Settings'];

// Sub-pages that belong to a specific tab (kept separate from the tab roots)
const ROUTE_TAB_MAP = {
  '/TalentProfile': '/Discover',
  '/BookTalent': '/Discover',
  '/MaybeList': '/Discover',
  '/BookingDetails': '/Bookings',
  '/booking-history': '/Bookings',
  '/WriteReview': '/Bookings',
  '/TalentSetup': '/Settings',
  '/Verification': '/Settings',
  '/TalentAvailability': '/Settings',
  '/account-security': '/Settings',
  '/privacy-policy': '/Settings',
};

let activeTab = null;
const tabLocations = {};

// Returns the tab a pathname belongs to, or null for non-tab pages.
export function resolveTab(pathname) {
  const root = TAB_ROOTS.find((t) => pathname === t || pathname.startsWith(t + '/'));
  return root || ROUTE_TAB_MAP[pathname] || null;
}

// Record the current location; unmapped sub-pages inherit the active tab.
export function trackLocation(pathname, search = '') {
  const tab = resolveTab(pathname) || activeTab;
  if (tab) {
    activeTab = tab;
    tabLocations[tab] = { pathname, search };
  }
  return activeTab;
}

// The saved location for a tab — falls back to the tab root.
export function getTabLocation(tabRoot) {
  return tabLocations[tabRoot] || { pathname: tabRoot, search: '' };
}