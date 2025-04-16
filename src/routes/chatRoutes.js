const ChatController = require("../controllers/chatController");

const routes = [
  {
    method: "POST",
    path: "/api/chat/send",
    handler: ChatController.handleChat,
    options: {
      cors: true,
    },
  },
];

module.exports = routes;