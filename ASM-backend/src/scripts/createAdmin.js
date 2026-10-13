require("dotenv").config();

const bcrypt = require("bcrypt");
const mongoose = require("mongoose");
const connectDatabase = require("../config/database");
const User = require("../models/User");

async function main() {
  const [, , emailArg, passwordArg, ...nameParts] = process.argv;
  const email = emailArg || process.env.ADMIN_EMAIL;
  const password = passwordArg || process.env.ADMIN_PASSWORD;
  const name = nameParts.join(" ") || process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error("Usage: npm run create-admin -- <email> <password> [name]");
    process.exit(1);
  }

  await connectDatabase();

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    {
      name,
      email,
      password: hashedPassword,
      role: "admin",
      status: "active",
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );

  console.log(`Admin ready: ${user.email}`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
