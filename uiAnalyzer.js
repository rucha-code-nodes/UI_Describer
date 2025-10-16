import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/analyze", async (req, res) => {
  try {
    const apiKey = "YOUR_GEMINI_API_KEY"; // Replace with your Gemini API key

    // ✅ Directly forward the exact payload sent from frontend
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...req.body, // Use frontend's structure as-is
          generationConfig: {
            temperature: 0.7,
            candidateCount: 1,
          },
        }),
      }
    );

    const data = await response.json();
    console.log("Gemini API response:", JSON.stringify(data, null, 2));

    res.json(data);
  } catch (error) {
    console.error("Gemini API Error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
