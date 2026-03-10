import React from 'react';
import { createHashRouter, RouterProvider, Navigate, Outlet } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';

import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Interaction } from './pages/Interaction';
import { Moments } from './pages/Moments';
import { Profile } from './pages/Profile';
import { Following } from './pages/Following';
import { UserProfile } from './pages/UserProfile';
import { PlantAdoption } from './pages/PlantAdoption';
import { DiscoverPlants } from './pages/DiscoverPlants';
import { MoodRecordPage } from './pages/MoodRecordPage';
import { JournalWritePage } from './pages/JournalWritePage';
import { UserLogin } from './pages/UserLogin';
import { AdoptionCeremony, JoinInvitation } from './pages/AdoptionCeremony';
import { Achievements } from './pages/Achievements';
import PlantProfileDetail from './pages/PlantProfileDetail';
import JournalDetailPage from './pages/JournalDetailPage';
import MoodDetailPage from './pages/MoodDetailPage';
import NotificationsPage from './pages/Notifications';

function RootRedirect() {
  return <Navigate to="/" replace />;
}

const router = createHashRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <ThemeProvider>
          <Toaster position="top-right" richColors closeButton />
          <Outlet />
        </ThemeProvider>
      </AuthProvider>
    ),
    children: [
      { path: 'login', element: <UserLogin /> },
      {
        path: '',
        element: <Layout />,
        children: [
          { index: true, element: <Home /> },
          { path: 'join/:inviteCode', element: <JoinInvitation /> },
          { path: 'interaction', element: <Interaction /> },
          { path: 'moments', element: <Moments /> },
          { path: 'profile', element: <Profile /> },
          { path: 'following', element: <Following /> },
          { path: 'u/:userId', element: <UserProfile /> },
          { path: 'user/:userId', element: <UserProfile /> },
          { path: 'discover', element: <DiscoverPlants /> },
          { path: 'adopt/:id', element: <PlantAdoption /> },
          { path: 'ceremony/:plantId', element: <AdoptionCeremony /> },
          { path: 'mood/:plantId', element: <MoodRecordPage /> },
          { path: 'journal/:plantId', element: <JournalWritePage /> },
          { path: 'achievements', element: <Achievements /> },
          { path: 'plant-profile/:plantId', element: <PlantProfileDetail /> },
          { path: 'journal-detail/:id', element: <JournalDetailPage /> },
          { path: 'mood-detail/:id', element: <MoodDetailPage /> },
          { path: 'notifications', element: <NotificationsPage /> }
        ]
      },
      { path: '*', element: <RootRedirect /> }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
