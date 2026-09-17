import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import MobileTabBar from '@/components/MobileTabBar';
import DesktopNavBar from '@/components/DesktopNavBar';
import { resolveTab } from '@/lib/tabNavigation';

// Page-level routes load lazily so each screen ships in its own bundle
const PageNotFound = lazy(() => import('./lib/PageNotFound'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const BookingDetailsPage = lazy(() => import('./pages/BookingDetails'));
const TalentAvailabilityPage = lazy(() => import('./pages/TalentAvailability'));
const BookingHistoryPage = lazy(() => import('./pages/BookingHistory'));
const AccountSecurityPage = lazy(() => import('./pages/AccountSecurity'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfService'));
const NotificationsPage = lazy(() => import('./pages/Notifications'));

const PageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
  </div>
);

const { Pages, Layout, mainPage } = pagesConfig;
const mainPageKey = mainPage ?? Object.keys(Pages)[0];
const MainPage = mainPageKey ? Pages[mainPageKey] : <></>;

const LayoutWrapper = ({ children, currentPageName }) => Layout ?
  <Layout currentPageName={currentPageName}>{children}</Layout>
  : <>{children}</>;

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  return <AnimatedApp />;
};

// Horizontal push/pop screen transitions for a native WebView feel.
const slideVariants = {
  enter: (dir) => ({ x: dir === -1 ? '-100%' : '100%' }),
  center: { x: '0%' },
  exit: (dir) => ({ x: dir === -1 ? '100%' : '-100%' }),
};

// Independent navigation stack per bottom tab — back gestures stay within a tab,
// and switching tabs resumes the target tab's stack where the user left it.
function useNavDirection() {
  const location = useLocation();
  const stacksRef = useRef({}); // tab root (or '_other') -> array of visited paths
  const [nav, setNav] = useState({ path: location.pathname, dir: 1 });

  if (nav.path !== location.pathname) {
    const stacks = stacksRef.current;
    const prevKey = resolveTab(nav.path) || '_other';
    const nextKey = resolveTab(location.pathname) || '_other';
    let dir = 1;

    if (prevKey === nextKey) {
      const stack = stacks[nextKey] || (stacks[nextKey] = [nav.path]);
      if (stack.length > 1 && stack[stack.length - 2] === location.pathname) {
        stack.pop(); // navigating back to the previous screen → pop
        dir = -1;
      } else if (stack[stack.length - 1] !== location.pathname) {
        stack.push(location.pathname); // new screen → push
      }
    } else {
      // Switching tabs: slide in from the right and resume the target tab's stack
      const stack = stacks[nextKey] || (stacks[nextKey] = []);
      if (stack[stack.length - 1] !== location.pathname) stack.push(location.pathname);
    }
    setNav({ path: location.pathname, dir });
  }
  return nav.dir;
}

const AnimatedApp = () => {
  const location = useLocation();
  const dir = useNavDirection();
  return (
    <>
      <AnimatePresence mode="popLayout" initial={false} custom={dir}>
        <motion.div
          key={location.pathname}
          custom={dir}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
          className="w-full"
        >
          <Suspense fallback={<PageLoader />}>
            <AppRoutes location={location} />
          </Suspense>
        </motion.div>
      </AnimatePresence>
      <DesktopNavBar />
      <MobileTabBar />
    </>
  );
};

const AppRoutes = ({ location }) => (
  <Routes location={location}>
      {/* Public auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
      <Route path="/terms-of-service" element={<TermsOfServicePage />} />

      {/* Authenticated app routes — gated by ProtectedRoute */}
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/" element={
          <LayoutWrapper currentPageName={mainPageKey}>
            <MainPage />
          </LayoutWrapper>
        } />
        {Object.entries(Pages).map(([path, Page]) => (
          <Route
            key={path}
            path={`/${path}`}
            element={
              <LayoutWrapper currentPageName={path}>
                <Page />
              </LayoutWrapper>
            }
          />
        ))}
        <Route path="/BookingDetails" element={<LayoutWrapper currentPageName="BookingDetails"><BookingDetailsPage /></LayoutWrapper>} />
        <Route path="/TalentAvailability" element={<LayoutWrapper currentPageName="TalentAvailability"><TalentAvailabilityPage /></LayoutWrapper>} />
        <Route path="/booking-history" element={<LayoutWrapper currentPageName="booking-history"><BookingHistoryPage /></LayoutWrapper>} />
        <Route path="/account-security" element={<LayoutWrapper currentPageName="account-security"><AccountSecurityPage /></LayoutWrapper>} />
        <Route path="/Notifications" element={<LayoutWrapper currentPageName="Notifications"><NotificationsPage /></LayoutWrapper>} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App