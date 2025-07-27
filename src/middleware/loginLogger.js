const loginAttempts = [];

export const logLoginAttempt = (req, res, next) => {
  const ip = req.ip;
  const time = new Date().toISOString();
  const email = req.body.email || 'unknown';

  loginAttempts.push({ email, ip, time });

  console.log(`Login attempt by ${email} from IP ${ip} at ${time}`);

  next();
};