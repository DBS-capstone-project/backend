const supabase = require("../config/supabaseClient");

// Check if user has already submitted mood today
exports.checkMood = async (request, h) => {
  const { user_id, date } = request.query;

  try {
    if (!user_id || !date) {
      return h.response({ message: "Parameter tidak lengkap." }).code(400);
    }

    const { data, error } = await supabase
      .from("mood_tracking")
      .select("id")
      .eq("user_id", user_id)
      .eq("date", date);

    if (error) {
      return h.response({ message: "Gagal memeriksa data mood." }).code(500);
    }

    return h.response({ exists: data.length > 0 }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan internal server." }).code(500);
  }
};

// Submit mood tracking data
exports.submitMood = async (request, h) => {
  const { user_id, date, mood, keyword, reason } = request.payload;

  try {
    if (!user_id || !date || !mood || !keyword || !reason) {
      return h.response({ message: "Semua kolom wajib diisi." }).code(400);
    }

    const validMoods = ["sangat_buruk", "buruk", "netral", "baik", "sangat_baik"];
    if (!validMoods.includes(mood)) {
      return h.response({ message: "Nilai mood tidak valid." }).code(400);
    }

    const { error: dbError } = await supabase.from("mood_tracking").insert([
      {
        user_id,
        date,
        mood,
        keyword,
        reason,
      },
    ]);

    if (dbError) {
      console.error("Database Error:", dbError.message);
      return h.response({ message: "Gagal menyimpan mood ke database." }).code(500);
    }

    return h.response({ message: "Mood berhasil disimpan!" }).code(201);
  } catch (err) {
    console.error("Error in submitMood:", err.message);
    return h.response({ message: "Terjadi kesalahan internal server." }).code(500);
  }
};

// Get weekly mood data
exports.getWeeklyMood = async (request, h) => {
  const { user_id, start, end } = request.query;

  try {
    if (!user_id || !start || !end) {
      return h.response({ message: "Semua parameter wajib diisi." }).code(400);
    }

    const { data, error } = await supabase
      .from("mood_tracking")
      .select("date, mood")
      .eq("user_id", user_id)
      .gte("date", start)
      .lte("date", end);

    if (error) {
      console.error("Database error:", error.message);
      return h.response({ message: "Gagal mengambil data mood." }).code(500);
    }

    return h.response({ data }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan internal server." }).code(500);
  }
};

// Get all mood data for a user
exports.getAllMoodData = async (request, h) => {
  const { user_id } = request.query;

  try {
    if (!user_id) {
      return h.response({ message: "Parameter user_id wajib diisi." }).code(400);
    }

    const { data, error } = await supabase
      .from("mood_tracking")
      .select("date, mood, keyword, reason")
      .eq("user_id", user_id)
      .order("date", { ascending: false });

    if (error) {
      return h.response({ message: "Gagal mengambil data mood." }).code(500);
    }

    return h.response({ data }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan internal server." }).code(500);
  }
};

// Get weekly summary from AI model
exports.getWeeklySummary = async (request, h) => {
  const { user_id } = request.query;

  try {
    if (!user_id) {
      return h.response({ message: "Parameter user_id wajib diisi." }).code(400);
    }

    let aiResponse;
    try {
      aiResponse = await fetch(`your_ml_model_api`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
    } catch (fetchError) {
      console.error("Fetch error:", fetchError.message);
      return h
        .response({ message: "Gagal terhubung ke server AI model. Silakan coba lagi nanti." })
        .code(503);
    }

    if (!aiResponse.ok) {
      console.error("AI model response error:", aiResponse.status, aiResponse.statusText);
      return h.response({ message: "Gagal mendapatkan analisis mingguan dari AI model." }).code(500);
    }

    const aiData = await aiResponse.json();

    if (!aiData.summary) {
      console.error("Invalid AI response:", aiData);
      return h.response({ message: "Respon dari AI model tidak valid." }).code(500);
    }

    return h.response({ summary: aiData.summary }).code(200);
  } catch (err) {
    console.error("Error in getWeeklySummary:", err.message);
    return h.response({ message: "Terjadi kesalahan internal server." }).code(500);
  }
};

// Get reflection feedback for a user
exports.getReflectionFeedback = async (request, h) => {
  const { user_id } = request.query;

  try {
    // Validate input
    if (!user_id) {
      return h.response({ message: "Parameter user_id wajib diisi." }).code(400);
    }

    // Step 1: Query latest mood data from Supabase
    const { data, error: dbError } = await supabase
      .from("mood_tracking")
      .select("date, mood, keyword, reason")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1);

    if (dbError) {
      return h.response({ message: "Gagal mengambil data mood." }).code(500);
    }

    if (!data || data.length === 0) {
      return h.response({ message: "Tidak ada data mood tersedia." }).code(404);
    }

    // Extract latest mood data
    const { date, mood, keyword, reason } = data[0];

    // Step 2: Send data to AI model
    const aiRequestBody = {
      user_id,
      mood,
      reason: keyword, // Keyword diubah menjadi reason di body request
      text_reason: reason, // Reason di database menjadi text_reason di body request
    };

    const aiResponse = await fetch("your_ml_model_api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(aiRequestBody),
    });

    if (!aiResponse.ok) {
      throw new Error("Gagal mendapatkan refleksi dari AI model.");
    }

    const aiResult = await aiResponse.json();

    // Return AI reflection as response
    return h.response({
      refleksi: aiResult.refleksi || "Tidak ada refleksi tersedia.",
    }).code(200);
  } catch (err) {
    console.error("Error in getReflectionFeedback:", err.message);
    return h.response({ message: "Terjadi kesalahan internal server." }).code(500);
  }
};