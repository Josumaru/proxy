import express from "express";
import axios from "axios";
import cors from "cors";

const app = express();
const PORT = 8080;

// Enable CORS for all origins
app.use(
  cors({
    origin: "*", // Adjust as needed for security
  })
);

// Middleware for parsing JSON from query parameters
app.use(express.json());

// Proxy endpoint
app.get("/proxy", async (req, res) => {
  const targetUrl = decodeURIComponent(req.query.url); // Target URL
  if (!targetUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  console.log('====================================');
  console.log(targetUrl);
  console.log('====================================');

  // Validate URL format
  try {
    new URL(targetUrl); // Throws error if URL is invalid
  } catch (err) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    // Parse headers from query (optional)
    const additionalHeaders = req.query.headers
      ? JSON.parse(req.query.headers)
      : {};

    // Perform request to the target URL
    const response = await axios.get(targetUrl, {
      headers: {
        ...additionalHeaders, // Apply custom headers passed via query
      },
      responseType: "arraybuffer", // Get response as binary data (for files)
    });

    const contentType = response.headers["content-type"];
    console.log("Content-Type:", contentType);

    // Handle different content types
    if (contentType.includes("application/json")) {
      // Return JSON response
      res.setHeader("Content-Type", "application/json");
      res.status(response.status).send(response.data);
    } else if (contentType.includes("text/html")) {
      // Return HTML response
      res.setHeader("Content-Type", "text/html");
      res.status(response.status).send(response.data.toString());
    } else if (contentType.includes("application/vnd.apple.mpegurl")) {
      // Handle m3u8 (for example)
      res.setHeader("Content-Type", "application/vnd.apple.mpegurl");
      res.status(response.status).send(response.data.toString());
    } else {
      // For other types of files, return as binary data
      res.setHeader("Content-Type", contentType);
      res.status(response.status).send(response.data);
    }
  } catch (error) {
    console.error("Error making proxy request:", error.message);

    // Return error details to client
    res.status(error.response?.status || 500).json({
      error: error.message || "An error occurred while processing the request",
    });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
