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
import { lazy } from 'react';

const Home = lazy(() => import('./pages/Home'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Discover = lazy(() => import('./pages/Discover'));
const MaybeList = lazy(() => import('./pages/MaybeList'));
const TalentProfile = lazy(() => import('./pages/TalentProfile'));
const TalentSetup = lazy(() => import('./pages/TalentSetup'));
const BookTalent = lazy(() => import('./pages/BookTalent'));
const Bookings = lazy(() => import('./pages/Bookings'));
const Messages = lazy(() => import('./pages/Messages'));
const Settings = lazy(() => import('./pages/Settings'));
const Verification = lazy(() => import('./pages/Verification'));
const WriteReview = lazy(() => import('./pages/WriteReview'));


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