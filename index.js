import express from "express";
import axios from "axios";
import cors from "cors"; // Import CORS middleware

const app = express();
const PORT = 8080;

// Enable CORS for all origins or specific origin
app.use(cors({
  origin: "http://localhost:8000", // Allow requests only from this origin
}));

// Proxy endpoint
app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url; // URL yang akan diakses
  if (!targetUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.71 Safari/537.36",
      },
    });

    // Return the response from the target server
    res.status(response.status).json(response.data);
  } catch (error) {
    res
      .status(error.response?.status || 500)
      .json({ error: error.message || "Something went wrong" });
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});