require("dotenv").config();

const http = require("http");
const app = require("./src/app");
const connectDatabase = require("./src/config/database");

const port = Number(process.env.PORT) || 3000;

async function startServer() {
  await connectDatabase();

  const server = http.createServer(app);

  server.listen(port, () => {
    console.log(`Flashcard API running at http://localhost:${port}`);
  });
}

startServer().catch((error) => {
  console.error("Could not start server", error);
  process.exit(1);
});
