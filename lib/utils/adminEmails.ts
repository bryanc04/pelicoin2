import adminEmailsJson from '../config/adminEmails.json';

export const ADMIN_EMAILS: string[] =
  adminEmailsJson.emails.map((e) => e.toLowerCase());

export const isAdminEmail = (email: string | null | undefined) => {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}
