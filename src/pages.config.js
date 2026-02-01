/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import Home from './pages/Home';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import MaybeList from './pages/MaybeList';
import TalentProfile from './pages/TalentProfile';
import TalentSetup from './pages/TalentSetup';
import BookTalent from './pages/BookTalent';
import Bookings from './pages/Bookings';
import Messages from './pages/Messages';
import Settings from './pages/Settings';
import Verification from './pages/Verification';
import WriteReview from './pages/WriteReview';


export const PAGES = {
    "Home": Home,
    "Onboarding": Onboarding,
    "Dashboard": Dashboard,
    "Discover": Discover,
    "MaybeList": MaybeList,
    "TalentProfile": TalentProfile,
    "TalentSetup": TalentSetup,
    "BookTalent": BookTalent,
    "Bookings": Bookings,
    "Messages": Messages,
    "Settings": Settings,
    "Verification": Verification,
    "WriteReview": WriteReview,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
};