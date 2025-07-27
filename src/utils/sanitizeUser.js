export function sanitizeUser(user) {
  if (!user) return null;

  const userObj = user.toObject ? user.toObject() : user;
  const { password, __v, ...sanitizedUser } = userObj;

  return sanitizedUser;
}
