const AuthController = require('../controllers/authController');

const routes = [
  {
    method: 'POST',
    path: '/api/auth/register',
    handler: AuthController.registerUser,
    options: {
      cors: true, // Enable CORS for frontend integration
    },
  },
  {
    method: 'POST',
    path: '/api/auth/signup',
    handler: AuthController.signup,
    options: {
      cors: true, // Enable CORS for frontend integration
    },
  },
  {
    method: 'POST',
    path: '/api/auth/login',
    handler: AuthController.login,
    options: {
      cors: true, // Enable CORS for frontend integration
    },
  },
  {
    method: 'PUT',
    path: '/api/auth/profile',
    handler: AuthController.updateProfile,
    options: {
      cors: true,
    },
  },
  {
    method: 'GET',
    path: '/api/auth/profile/{id}',
    handler: AuthController.getProfile,
    options: {
      cors: true,
    },
  },
];

module.exports = routes;