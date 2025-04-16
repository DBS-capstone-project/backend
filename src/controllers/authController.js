const bcrypt = require('bcryptjs'); // Menggunakan bcryptjs sebagai pengganti bcrypt
const winston = require('winston');
const supabase = require('../config/supabaseClient');

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

/**
 * Register a new user using Supabase Auth (without Admin API)
 */
exports.registerUser = async (request, h) => {
  const { email } = request.payload;

  try {
    // Validate email format
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailPattern.test(email)) {
      return h.response({ message: 'Format email tidak valid.' }).code(400);
    }

    // Check if user already exists in Supabase Auth
    const { data: existingUser, error: userError } = await supabase.auth.signInWithPassword({
      email,
      password: 'dummy-password', // Dummy password to check existence
    });

    if (existingUser && !userError) {
      return h.response({ message: 'Email sudah terdaftar. Silakan login.' }).code(400);
    }

    // Register user using Supabase Auth signUp method
    const { data, error } = await supabase.auth.signUp({
      email,
      password: 'dummy-password', // Dummy password for registration
      options: {
        emailRedirectTo: 'your_fe_url', // Redirect URL after confirmation
      },
    });

    if (error) {
      logger.error('Error creating user:', error);
      return h.response({ message: error.message || 'Gagal mendaftarkan pengguna.' }).code(500);
    }

    return h.response({ message: 'Pengguna berhasil didaftarkan. Silakan cek Gmail untuk verifikasi.' }).code(200);
  } catch (error) {
    logger.error('Internal server error:', error);
    return h.response({ message: 'Terjadi kesalahan internal server.' }).code(500);
  }
};

/**
 * Register a new user
 */
exports.signup = async (request, h) => {
  const { username, email, password } = request.payload;

  try {
    // Validate input
    if (!username || !email || !password) {
      return h.response({ message: 'Semua field wajib diisi.' }).code(400);
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return h.response({ message: 'Format email tidak valid.' }).code(400);
    }

    if (password.length < 6) {
      return h.response({ message: 'Password minimal 6 karakter.' }).code(400);
    }

    // Check if user already exists in the database
    const { data: existingUser, error: userError } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', email);

    if (userError) {
      logger.error('Error checking existing user:', userError);
      return h.response({ message: 'Terjadi kesalahan saat memeriksa pengguna.' }).code(500);
    }

    if (existingUser && existingUser.length > 0) {
      return h.response({ message: 'Email sudah terdaftar. Silakan login.' }).code(400);
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user into the database
    const { data, error } = await supabase
      .from('accounts')
      .insert([{ username, email, password: hashedPassword }])
      .select();

    if (error) {
      logger.error('Error creating account:', error);
      return h.response({ message: error.message || 'Gagal membuat akun.' }).code(500);
    }

    return h.response({ message: 'Akun berhasil dibuat!', user: data[0] }).code(201);
  } catch (error) {
    logger.error('Internal server error:', error);
    return h.response({ message: 'Terjadi kesalahan internal server.' }).code(500);
  }
};

/**
 * Login user
 */
exports.login = async (request, h) => {
  const { email, password } = request.payload;

  try {
    // Validate input
    if (!email || !password) {
      return h.response({ message: 'Email dan password wajib diisi.' }).code(400);
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return h.response({ message: 'Format email tidak valid.' }).code(400);
    }

    // Check if user exists in the database
    const { data: user, error: userError } = await supabase
      .from('accounts')
      .select('*')
      .eq('email', email);

    if (userError) {
      logger.error('Error checking user:', userError);
      return h.response({ message: 'Terjadi kesalahan saat memeriksa pengguna.' }).code(500);
    }

    if (!user || user.length === 0) {
      return h.response({ message: 'Email belum terdaftar.' }).code(400);
    }

    // Compare password with hashed password
    const isMatch = await bcrypt.compare(password, user[0].password);
    if (!isMatch) {
      return h.response({ message: 'Password salah.' }).code(400);
    }

    // Return user data (excluding sensitive fields like password)
    const userData = {
      id: user[0].id,
      username: user[0].username,
      email: user[0].email,
      created_at: user[0].created_at,
    };

    return h.response({ message: 'Login berhasil!', user: userData }).code(200);
  } catch (error) {
    logger.error('Internal server error:', error);
    return h.response({ message: 'Terjadi kesalahan internal server.' }).code(500);
  }
};

/**
 * Update user profile
 */
exports.updateProfile = async (request, h) => {
  const { id, birth_date, phone_number, new_password } = request.payload;

  try {
    // Validate input
    if (!id) {
      return h.response({ message: 'ID pengguna wajib diisi.' }).code(400);
    }

    // Prepare update payload
    const updatePayload = {};
    if (birth_date) updatePayload.birth_date = birth_date;
    if (phone_number) updatePayload.phone_number = phone_number;
    if (new_password) {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      updatePayload.password = hashedPassword;
    }

    // Update user in the database
    const { data, error } = await supabase
      .from('accounts')
      .update(updatePayload)
      .eq('id', id)
      .select();

    if (error) {
      logger.error('Error updating profile:', error);
      return h.response({ message: error.message || 'Gagal memperbarui profil.' }).code(500);
    }

    return h.response({ message: 'Profil berhasil diperbarui!', user: data[0] }).code(200);
  } catch (error) {
    logger.error('Internal server error:', error);
    return h.response({ message: 'Terjadi kesalahan internal server.' }).code(500);
  }
};

/**
 * Get user profile by ID
 */
exports.getProfile = async (request, h) => {
  const { id } = request.params;

  try {
    // Validate input
    if (!id) {
      return h.response({ message: 'ID pengguna wajib diisi.' }).code(400);
    }

    // Fetch user from the database
    const { data: user, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('id', id);

    if (error) {
      logger.error('Error fetching user profile:', error);
      return h.response({ message: error.message || 'Gagal memuat profil pengguna.' }).code(500);
    }

    if (!user || user.length === 0) {
      return h.response({ message: 'Pengguna tidak ditemukan.' }).code(404);
    }

    // Return user data (excluding sensitive fields like password)
    const userData = {
      id: user[0].id,
      username: user[0].username,
      email: user[0].email,
      birth_date: user[0].birth_date,
      phone_number: user[0].phone_number,
      created_at: user[0].created_at,
    };

    return h.response({ message: 'Profil pengguna berhasil dimuat.', user: userData }).code(200);
  } catch (error) {
    logger.error('Internal server error:', error);
    return h.response({ message: 'Terjadi kesalahan internal server.' }).code(500);
  }
};

