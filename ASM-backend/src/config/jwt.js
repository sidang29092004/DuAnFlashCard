function getJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing. Create .env from .env.example.");
  }

  return process.env.JWT_SECRET;
}

function getJwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN || "7d";
}

module.exports = {
  getJwtExpiresIn,
  getJwtSecret,
};
