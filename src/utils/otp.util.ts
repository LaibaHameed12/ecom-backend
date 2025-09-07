export function generateOtp(length = 6): string {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit
}

export function getOtpExpiry(minutes = 5): Date {
  return new Date(Date.now() + minutes * 60 * 1000);
}
