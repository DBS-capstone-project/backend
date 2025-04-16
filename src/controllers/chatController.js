import supabase from "../config/supabaseClient.js";

// Handle chat messages
export const handleChat = async (request, h) => {
  const { user_id, message } = request.payload;

  try {
    // Validasi input
    if (!user_id || !message) {
      return h.response({ message: "Semua kolom wajib diisi." }).code(400);
    }

    console.log("Received input from user:", { user_id, message });

    // Kirim pesan ke model AI
    const aiResponse = await getAIResponse(user_id, message);

    // Simpan percakapan ke Supabase
    const { error } = await supabase.from("chat_history").insert([
      {
        user_id,
        user_message: message,
        ai_response: aiResponse.reply, // Pastikan hanya menyimpan field "reply"
        timestamp: new Date(),
      },
    ]);

    if (error) {
      console.error("Error saving chat history:", error);
      return h.response({ message: "Gagal menyimpan percakapan." }).code(500);
    }

    console.log("AI response saved to Supabase:", { user_id, message, reply: aiResponse.reply });

    // Kirim respons ke frontend
    return h.response({ reply: aiResponse.reply }).code(200);
  } catch (err) {
    console.error(err);
    return h.response({ message: "Terjadi kesalahan internal server." }).code(500);
  }
};

// Function to get AI response
async function getAIResponse(user_id, message) {
  try {
    console.log("Sending request to AI model:", { user_id, message });

    const response = await fetch("your_ml_model_api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error(`Gagal mendapatkan respons dari model AI. Status: ${response.status}`);
    }

    const data = await response.json();

    console.log("Received response from AI model:", data);

    // Pastikan respons memiliki field "reply"
    if (!data.reply) {
      throw new Error("Respon dari model AI tidak valid.");
    }

    return data;
  } catch (error) {
    console.error("Error getting AI response:", error);
    throw new Error("Gagal mendapatkan respons AI.");
  }
}