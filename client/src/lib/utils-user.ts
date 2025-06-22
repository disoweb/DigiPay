// Utility function to extract username from email
export function getUserDisplayName(email: string | null | undefined): string {
  if (!email) return 'Unknown User';
  return email.split('@')[0];
}

// Utility function to mask email for privacy
export function maskEmail(email: string | null | undefined): string {
  if (!email) return 'Unknown';
  const [username, domain] = email.split('@');
  if (!domain) return email;
  const maskedUsername = username.length > 2 
    ? username.substring(0, 2) + '*'.repeat(username.length - 2)
    : username;
  return `${maskedUsername}@${domain}`;
}