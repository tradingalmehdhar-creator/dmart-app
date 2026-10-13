import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

const SYSTEM_ROLES: Record<string, { en: string; ms: string }> = {
  shopper: {
    en: "You are the D-mart Pasaraya Personal Shopper AI. Your job is to help Malaysian customers find the best groceries, fresh produce, pantry essentials, and household goods from D-mart. Prices are in Ringgit Malaysia (RM). Be warm, friendly, and provide helpful suggestions including complementary items.",
    ms: "Anda adalah Pembantu Beli-belah Peribadi AI D-mart Pasaraya. Tugas anda adalah membantu pelanggan Malaysia mencari barangan dapur terbaik, hasil segar, dan keperluan harian daripada D-mart dalam Ringgit Malaysia (RM). Berikan layanan mesra dan cadangan barangan yang sesuai.",
  },
  chef: {
    en: "You are Chef D-mart, an expert Malaysian chef and recipe advisor. Help users with quick, delicious recipe ideas (Nasi Lemak, Ayam Masak Merah, Tom Yum, Sambal Belacan, Stir-fry Sayur, etc.) using fresh ingredients readily available at D-mart Pasaraya Malaysia. Provide step-by-step cooking tips, estimated cooking times, and ingredient lists in RM.",
    ms: "Anda adalah Chef D-mart, pakar masakan Malaysia dan penasihat resepi. Bantu pengguna dengan idea resepi lazat dan pantas (Nasi Lemak, Ayam Masak Merah, Tom Yum, Sambal Belacan, Sayur Campur, dsb.) menggunakan bahan segar D-mart Pasaraya. Berikan langkah masakan, anggaran masa, dan senarai bahan dalam RM.",
  },
  budget: {
    en: "You are the D-mart Budget Saver AI. You specialize in smart supermarket shopping on a budget. Help Malaysian families maximize value, find bulk discounts, calculate total costs under budget limits (e.g. RM 50 or RM 100 groceries plan), and suggest money-saving swaps and available vouchers (DMART10, FREEDEL, SEGAR15, JIMAT5).",
    ms: "Anda adalah Pembantu Jimat Belanja AI D-mart. Anda pakar dalam perbelanjaan bijak pasaraya. Bantu keluarga Malaysia memaksimumkan nilai belian, merancang belanja bawah bajet (cth. bajet RM 50 atau RM 100), dan manfaatkan baucar diskaun D-mart (DMART10, FREEDEL, SEGAR15, JIMAT5).",
  },
  halal: {
    en: "You are the D-mart Halal & Dietary Specialist AI. You guide customers on 100% Halal-certified poultry, fresh fish, vegetarian options, organic produce, and allergen-safe grocery choices available in Malaysian markets.",
    ms: "Anda adalah Pakar Halal & Diet AI D-mart. Anda membimbing pelanggan mengenai produk 100% Halal yang diiktiraf, ayam/daging segar, ikan laut, pilihan vegetarian, dan makanan sihat di pasaraya Malaysia.",
  },
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // Serve public directory statically (PWA manifest, icons, service worker, privacy page)
  const publicDir = path.join(process.cwd(), "public");
  app.use(express.static(publicDir));

  // Ensure uploads directory exists and is served statically
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      timestamp: new Date().toISOString(),
    });
  });

  // Image Upload API Endpoint for Product and Asset Storage
  app.post("/api/upload", (req, res) => {
    try {
      const { dataUrl, filename } = req.body;
      if (!dataUrl) {
        return res.status(400).json({ error: "dataUrl payload is required." });
      }

      // Check if it's a valid data URL
      const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        return res.status(400).json({ error: "Invalid base64 data URL format." });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, "base64");

      // Determine extension safely
      let ext = "jpg";
      if (mimeType.includes("png")) ext = "png";
      else if (mimeType.includes("webp")) ext = "webp";
      else if (mimeType.includes("gif")) ext = "gif";
      else if (mimeType.includes("jpeg")) ext = "jpg";

      const cleanFilename = filename
        ? filename.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 30)
        : "product";
      const generatedFilename = `prod-${Date.now()}-${cleanFilename}.${ext}`;
      const destPath = path.join(uploadsDir, generatedFilename);

      fs.writeFileSync(destPath, buffer);

      const publicUrl = `/uploads/${generatedFilename}`;
      res.json({
        success: true,
        url: publicUrl,
        filename: generatedFilename,
        size: buffer.length,
      });
    } catch (error: any) {
      console.error("Upload error in /api/upload:", error);
      res.status(500).json({
        error: "Failed to upload and store product image.",
        details: String(error),
      });
    }
  });

  // Multi-turn Gemini Chatbot Endpoint
  app.post("/api/chat", async (req, res) => {
    try {
      const {
        messages = [],
        model = "gemini-3.5-flash",
        roleId = "shopper",
        language = "en",
        cartSummary = "",
      } = req.body;

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({
          error: "Messages array is required with at least one user message.",
        });
      }

      // Allowed models as specified by requirements
      const allowedModels = [
        "gemini-3.5-flash",
        "gemini-3.1-flash-lite",
        "gemini-3.1-pro-preview",
        "gemini-3.8-flash",
      ];
      const selectedModel = allowedModels.includes(model) ? model : "gemini-3.5-flash";

      const ai = getGeminiClient();
      if (!ai) {
        // Friendly fallback when GEMINI_API_KEY is not configured yet
        const lastMsg = messages[messages.length - 1]?.text?.toLowerCase() || "";
        let fallbackReply = "";

        if (language === "ms") {
          if (lastMsg.includes("resepi") || lastMsg.includes("masak")) {
            fallbackReply = "Untuk hidangan makan malam pantas, saya cadangkan **Ayam Goreng Kunyit Bersayur**! Bahan segar D-mart: Ayam Segar (RM 12.90), Kobis Bulat (RM 3.20), dan Bawang Merah. Gaulkan ayam bersama kunyit dan garam, goreng garing, dan masukkan sayuran. *(Nota: Sila sambungkan Kunci API Gemini di menu Settings > Secrets untuk perbualan AI sepenuhnya.)*";
          } else if (lastMsg.includes("baucar") || lastMsg.includes("diskaun")) {
            fallbackReply = "Baucar aktif D-mart hari ini: **DMART10** (Diskaun RM10 untuk RM80+), **FREEDEL** (Penghantaran Percuma), dan **SEGAR15** (15% Diskaun Barangan Segar). *(Nota: Sila sambungkan Kunci API Gemini di Settings > Secrets untuk perbualan AI langsung.)*";
          } else {
            fallbackReply = "Selamat datang ke D-mart Pasaraya! Saya boleh membantu anda mencari barangan segar, cadangan resepi masakan, dan merancang bajet dapur anda. *(Sila masukkan Gemini API Key di Settings > Secrets untuk mengaktifkan AI secara langsung.)*";
          }
        } else {
          if (lastMsg.includes("recipe") || lastMsg.includes("cook")) {
            fallbackReply = "For a quick Malaysian comfort dinner, try **Turmeric Chicken with Stir-fried Vegetables**! Pick up Fresh Chicken (RM 12.90), Round Cabbage (RM 3.20), and Red Onions from D-mart. Quick, wholesome, and delicious under 20 minutes! *(Note: Connect your Gemini API Key in Settings > Secrets for real-time generative chat.)*";
          } else if (lastMsg.includes("voucher") || lastMsg.includes("discount")) {
            fallbackReply = "Today's active D-mart vouchers: **DMART10** (RM10 off orders over RM80), **FREEDEL** (Free Delivery waiver), and **SEGAR15** (15% off Fresh Products). *(Note: Connect your Gemini API Key in Settings > Secrets for real-time AI responses.)*";
          } else {
            fallbackReply = "Welcome to D-mart Pasaraya! I am here to help you explore fresh groceries, plan budget-friendly family meals, and discover Malaysian recipe ideas. *(Please add your Gemini API Key in Settings > Secrets to activate real-time AI responses.)*";
          }
        }

        return res.json({
          reply: fallbackReply,
          modelUsed: selectedModel,
          isDemoFallback: true,
        });
      }

      // Build System Instruction
      const roleConfig = SYSTEM_ROLES[roleId] || SYSTEM_ROLES.shopper;
      const baseRolePrompt = language === "ms" ? roleConfig.ms : roleConfig.en;

      const systemInstruction = `
${baseRolePrompt}

App Context:
- Platform: D-mart Pasaraya (Malaysia's premier online supermarket with fresh groceries, meats, seafood, vegetables, fruits, pantry staples, and household cleaning supplies).
- Currency: Ringgit Malaysia (RM).
- Vouchers available: DMART10 (RM10 OFF min spend RM80), FREEDEL (FREE Delivery on orders over RM60 or code FREEDEL), SEGAR15 (15% OFF Fresh Meats & Produce), JIMAT5 (RM5 OFF min spend RM40).
- Delivery: Same-day express rider delivery across Klang Valley and major Malaysian cities.
- Current User Preferred Language: ${language === "ms" ? "Bahasa Malaysia (BM)" : "English"}. Respond primarily in the user's selected language or match whatever language the user speaks.
${cartSummary ? `- User's current cart items: ${cartSummary}` : ""}

Behavior Guidelines:
- Keep answers informative, encouraging, and formatted with clean Markdown (bullet points, bold titles).
- When giving recipes, mention practical ingredient quantities and cooking times.
- If asked about local Malaysian foods, celebrate authentic Malaysian tastes (halal, flavorful, fresh).
- Maintain multi-turn continuity by referencing previously discussed preferences or items.
`;

      // Transform messages into Gemini Contents format
      const contents = messages.map((m: { role: string; text: string }) => ({
        role: m.role === "assistant" || m.role === "model" ? "model" : "user",
        parts: [{ text: m.text }],
      }));

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const reply = response.text || "I apologize, but I could not generate a response. Please try asking again.";

      res.json({
        reply,
        modelUsed: selectedModel,
        isDemoFallback: false,
      });
    } catch (error: any) {
      console.error("Gemini API Error in /api/chat:", error);
      res.status(500).json({
        error: error?.message || "Failed to communicate with Gemini API.",
        details: String(error),
      });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`D-mart Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
