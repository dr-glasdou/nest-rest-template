/** Project constants that are not environment-specific. Change them here. */
export const constants = {
  app: {
    name: 'DRI Auth API',
    description: 'Authentication and identity service for the DRI platform.',
  },
  api: {
    defaultVersion: '1',
    versionPrefix: 'v',
  },
  pagination: {
    defaultPage: 1,
    defaultLimit: 10,
  },
} as const;
