const Hapi = require("@hapi/hapi");
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const moodRoutes = require("./routes/moodRoutes");
const reflectionRoutes = require("./routes/reflectionRoutes");

// Initialize Hapi server
const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT || 3000,
    host: "localhost",
    routes: {
      cors: {
        origin: ["*"], // Izinkan semua origin
        headers: ["Accept", "Content-Type", "Authorization"], // Header yang diizinkan
        additionalHeaders: ["X-Requested-With"], // Header tambahan
        credentials: false, // Nonaktifkan kredensial (opsional)
      },
    },
  });

  // Register routes
  server.route([
    ...authRoutes,
    ...chatRoutes,
    ...moodRoutes,
    ...reflectionRoutes,
  ]);

  // Start the server
  await server.start();
  console.log(`Server is running on ${server.info.uri}`);
};

process.on("unhandledRejection", (err) => {
  console.error(err);
  process.exit(1);
});

init();