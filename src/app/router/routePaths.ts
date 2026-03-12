export const routePaths = {
  root: '/',
  login: '/login',
  joinInvitation: '/join/:inviteCode',
  interaction: '/interaction',
  moments: '/moments',
  profile: '/profile',
  following: '/following',
  userProfile: '/u/:userId',
  legacyUserProfile: '/user/:userId',
  discover: '/discover',
  adopt: '/adopt/:id',
  ceremony: '/ceremony/:plantId',
  moodRecord: '/mood/:plantId',
  journalWrite: '/journal/:plantId',
  achievements: '/achievements',
  plantProfile: '/plant-profile/:plantId',
  journalDetail: '/journal-detail/:id',
  moodDetail: '/mood-detail/:id',
  notifications: '/notifications',
} as const;

export type RoutePathKey = keyof typeof routePaths;
