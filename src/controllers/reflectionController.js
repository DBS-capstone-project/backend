const supabase = require("../config/supabaseClient");

exports.checkReflection = async (request, h) => {
  const { user_id, date } = request.query;

  try {
    if (!user_id || !date) {
      return h.response({ message: "Parameter tidak lengkap." }).code(400);
    }

    // Query data reflection untuk user_id dan tanggal tertentu
    const { data, error } = await supabase
      .from("reflection_forms")
      .select("id")
      .eq("user_id", user_id)
      .lte("timestamp", `${date}T23:59:59Z`) // Cek timestamp sampai akhir hari
      .gte("timestamp", `${date}T00:00:00Z`); // Cek timestamp mulai awal hari

    if (error) {
      return h.response({ message: "Gagal memeriksa data refleksi." }).code(500);
    }

    return h.response({ exists: data.length > 0 }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan internal server." }).code(500);
  }
};

exports.submitReflection = async (request, h) => {
  const { user_id, category, ...answers } = request.payload;

  try {
    // Validasi input
    if (!user_id || !category || Object.keys(answers).length !== 10) {
      return h.response({ message: "Semua kolom wajib diisi." }).code(400);
    }

    // Insert data into Supabase
    const { data, error } = await supabase
      .from("reflection_forms")
      .insert([
        {
          user_id,
          category,
          question_1: answers.question_1,
          question_2: answers.question_2,
          question_3: answers.question_3,
          question_4: answers.question_4,
          question_5: answers.question_5,
          question_6: answers.question_6,
          question_7: answers.question_7,
          question_8: answers.question_8,
          question_9: answers.question_9,
          question_10: answers.question_10,
        },
      ])
      .select();

    if (error) {
      console.error("Error inserting data:", error);
      return h.response({ message: "Gagal menyimpan refleksi." }).code(500);
    }

    return h.response({ success: true, data }).code(201);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan internal server." }).code(500);
  }
};

exports.getReflectionFeedback = async (request, h) => {
  const { user_id } = request.payload;

  try {
    // Send POST request to external API using fetch
    const externalResponse = await fetch("your_ml_model_api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });

    if (!externalResponse.ok) {
      throw new Error("Gagal mendapatkan feedback dari API eksternal.");
    }

    // Extract feedback from external API response
    const externalData = await externalResponse.json();
    const feedback = externalData.feedback || "Tidak ada feedback tersedia.";

    // Return feedback to frontend
    return h.response({ user_id, feedback }).code(200);
  } catch (err) {
    console.error("Error fetching feedback from external API:", err);

    // Fallback jika API eksternal gagal
    return h.response({
      message: "Terjadi kesalahan saat memuat feedback.",
      feedback: "Tidak ada feedback tersedia.",
    }).code(500);
  }
};