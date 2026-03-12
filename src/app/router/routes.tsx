import React from 'react';
import { createHashRouter, Navigate, Outlet } from 'react-router';
import { Toaster } from 'sonner';

import { AuthProvider } from '../context/AuthContext';
import { ThemeProvider } from '../context/ThemeContext';
import { Layout } from '../components/Layout';
import { RequireAuth } from '../components/RequireAuth';
import { Home } from '../pages/Home';
import { Interaction } from '../pages/Interaction';
import { Moments } from '../pages/Moments';
import { Profile } from '../pages/Profile';
import { Following } from '../pages/Following';
import { UserProfile } from '../pages/UserProfile';
import { PlantAdoption } from '../pages/PlantAdoption';
import { DiscoverPlants } from '../pages/DiscoverPlants';
import { MoodRecordPage } from '../pages/MoodRecordPage';
import { JournalWritePage } from '../pages/JournalWritePage';
import { UserLogin } from '../pages/UserLogin';
import { AdoptionCeremony, JoinInvitation } from '../pages/AdoptionCeremony';
import { Achievements } from '../pages/Achievements';
import PlantProfileDetail from '../pages/PlantProfileDetail';
import JournalDetailPage from '../pages/JournalDetailPage';
import MoodDetailPage from '../pages/MoodDetailPage';
import NotificationsPage from '../pages/Notifications';
import { routePaths } from './routePaths';

function AppProviders() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster position="top-right" richColors closeButton />
        <Outlet />
      </ThemeProvider>
    </AuthProvider>
  );
}

function ProtectedApp() {
  return (
    <RequireAuth>
      <Layout />
    </RequireAuth>
  );
}

function RootRedirect() {
  return <Navigate to={routePaths.root} replace />;
}

export const router = createHashRouter([
  {
    path: routePaths.root,
    element: <AppProviders />,
    children: [
      { path: routePaths.login, element: <UserLogin /> },
      { path: routePaths.joinInvitation, element: <JoinInvitation /> },
      {
        element: <ProtectedApp />,
        children: [
          { index: true, element: <Home /> },
          { path: routePaths.interaction, element: <Interaction /> },
          { path: routePaths.moments, element: <Moments /> },
          { path: routePaths.profile, element: <Profile /> },
          { path: routePaths.following, element: <Following /> },
          { path: routePaths.userProfile, element: <UserProfile /> },
          { path: routePaths.legacyUserProfile, element: <UserProfile /> },
          { path: routePaths.discover, element: <DiscoverPlants /> },
          { path: routePaths.adopt, element: <PlantAdoption /> },
          { path: routePaths.ceremony, element: <AdoptionCeremony /> },
          { path: routePaths.moodRecord, element: <MoodRecordPage /> },
          { path: routePaths.journalWrite, element: <JournalWritePage /> },
          { path: routePaths.achievements, element: <Achievements /> },
          { path: routePaths.plantProfile, element: <PlantProfileDetail /> },
          { path: routePaths.journalDetail, element: <JournalDetailPage /> },
          { path: routePaths.moodDetail, element: <MoodDetailPage /> },
          { path: routePaths.notifications, element: <NotificationsPage /> },
        ],
      },
      { path: '*', element: <RootRedirect /> },
    ],
  },
]);
