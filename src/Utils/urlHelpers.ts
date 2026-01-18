export function formatLinkedInUrl(url: string): string {
  if (!url) return '';

  // Remove protocol and www
  let cleanUrl = url
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '');

  // Ensure linkedin.com prefix
  if (!cleanUrl.startsWith('linkedin.com')) {
    cleanUrl = `linkedin.com/${cleanUrl.replace(/^\/+/, '')}`;
  }

  return `https://${cleanUrl}`;
}

export function getLinkedInDisplayText(url: string): string {
  if (!url) return 'LinkedIn Profile';

  const cleanUrl = url
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '');

  if (cleanUrl.startsWith('linkedin.com/in/')) {
    const username = cleanUrl
      .replace('linkedin.com/in/', '')
      .split('/')[0];

    return username
      ? `linkedin.com/in/${username}`
      : 'LinkedIn Profile';
  }

  return cleanUrl.startsWith('linkedin.com')
    ? cleanUrl
    : 'LinkedIn Profile';
}