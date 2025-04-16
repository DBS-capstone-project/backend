const ReflectionController = require("../controllers/reflectionController");

const routes = [
  {
    method: "GET",
    path: "/api/reflection/check",
    handler: ReflectionController.checkReflection,
    options: {
      cors: true,
    },
  },
  {
    method: "POST",
    path: "/api/reflection/submit",
    handler: ReflectionController.submitReflection,
    options: {
      cors: true,
    },
  },
  {
    method: "POST",
    path: "/api/reflection-feedback",
    handler: ReflectionController.getReflectionFeedback,
    options: {
      cors: true,
    },
  },
];

module.exports = routes;