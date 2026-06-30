export const getApiUrl = (path: string): string => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    if (window.location.port !== '3001') {
      return `http://localhost:3001${path}`;
    }
  }
  return path;
};
