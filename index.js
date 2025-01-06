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

app.use((req, res, next) => {
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  next();
});

// Proxy endpoint
app.get("/proxy", async (req, res) => {
  const targetUrl = req.query.url ? decodeURIComponent(req.query.url) : null; // Target URL
  if (!targetUrl) {
    return res.status(400).json({ error: "URL is required" });
  }

  // Add path from request to target URL
  const targetPath = req.path.replace("/proxy", ""); // Add any additional path
  const fullTargetUrl = targetUrl + targetPath;

  console.log("====================================");
  console.log("Target URL:", fullTargetUrl);
  console.log("====================================");

  // Validate URL format
  try {
    new URL(fullTargetUrl); // Throws error if URL is invalid
  } catch (err) {
    return res.status(400).json({ error: "Invalid URL format" });
  }

  try {
    // Parse headers from query (optional)
    const additionalHeaders = req.query.headers
      ? JSON.parse(req.query.headers)
      : {};

    // Perform request to the target URL
    const response = await axios.get(fullTargetUrl, {
      headers: {
        ...additionalHeaders, // Apply custom headers passed via query
      },
      responseType: "arraybuffer", // Get response as binary data (for files)
    });

    const contentType = response.headers["content-type"];
    console.log("Content-Type:", contentType);

    // Handle different content types
    res.setHeader("Content-Type", contentType);
     // If `.m3u8` file, rewrite relative URLs
     if (contentType.includes("application/vnd.apple.mpegurl")) {
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1); // Dapatkan jalur utama
      const rewrittenContent = response.data
        .toString()
        .replace(/(.*\.m3u8|.*\.ts)/g, (match) => {
          return `${req.protocol}://${req.get("host")}/proxy?url=${encodeURIComponent(
            new URL(match, baseUrl).toString()
          )}`;
        });
      res.send(rewrittenContent);
    } else {
      // Untuk file lainnya, proxy data langsung
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
