export const normalize = (email: string) => email.trim().normalize('NFC').toLowerCase();
