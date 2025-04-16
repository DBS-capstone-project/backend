const MoodController = require("../controllers/moodController");

const routes = [
  {
    method: "GET",
    path: "/api/mood/check",
    handler: MoodController.checkMood,
    options: {
      cors: true,
    },
  },
  {
    method: "POST",
    path: "/api/mood/submit",
    handler: MoodController.submitMood,
    options: {
      cors: true,
    },
  },
  {
    method: "GET",
    path: "/api/mood/weekly",
    handler: MoodController.getWeeklyMood,
    options: {
      cors: true,
    },
  },
  {
    method: "GET",
    path: "/api/mood/all",
    handler: MoodController.getAllMoodData,
    options: {
      cors: true,
    },
  },
  {
    method: "GET",
    path: "/api/mood/weekly-summary",
    handler: MoodController.getWeeklySummary,
    options: {
      cors: true,
    },
  },
  {
    method: "GET",
    path: "/api/mood/reflection-feedback",
    handler: MoodController.getReflectionFeedback,
    options: {
      cors: true,
    },
  },
];

module.exports = routes;