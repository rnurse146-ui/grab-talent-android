import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import NavigationTracker from '@/lib/NavigationTracker'
import { pagesConfig } from './pages.config'
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import MobileTabBar from '@/components/MobileTabBar';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import BookingDetailsPage from './pages/BookingDetails';
import TalentAvailabilityPage from './pages/TalentAvailability';
import BookingHistoryPage from './pages/BookingHistory';
import AccountSecurityPage from './pages/AccountSecurity';
import PrivacyPolicyPage from './pages/PrivacyPolicy';

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

function useNavDirection() {
  const location = useLocation();
  const stackRef = useRef([location.pathname]);
  const [nav, setNav] = useState({ path: location.pathname, dir: 1 });

  if (nav.path !== location.pathname) {
    const stack = stackRef.current;
    let dir = 1;
    if (stack.length > 1 && stack[stack.length - 2] === location.pathname) {
      stack.pop(); // navigating back to the previous screen → pop
      dir = -1;
    } else {
      stack.push(location.pathname); // new screen → push
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
          <AppRoutes location={location} />
        </motion.div>
      </AnimatePresence>
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