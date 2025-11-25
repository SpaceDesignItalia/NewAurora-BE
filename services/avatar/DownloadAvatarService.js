// DownloadAvatarService.js
const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

/**
 * Scarica e salva l'avatar da un URL esterno
 * @param {string} avatarUrl - URL dell'avatar da scaricare
 * @param {BigInt|string|number} userId - ID dell'utente
 * @returns {Promise<string|null>} - Path relativo dell'immagine salvata o null se fallisce
 */
async function downloadAndSaveAvatar(avatarUrl, userId) {
  try {
    if (!avatarUrl || !userId) {
      console.warn("DownloadAvatarService: URL o userId mancanti");
      return null;
    }

    // 1. Download immagine
    const response = await axios.get(avatarUrl, {
      responseType: "arraybuffer",
      timeout: 10000, // 10 secondi timeout
      maxContentLength: 5 * 1024 * 1024, // Max 5MB
      headers: {
        "User-Agent": "NewAurora-BE/1.0", // Richiesto per GitHub
        Accept: "image/*",
      },
    });

    // 2. Valida dimensione
    const buffer = Buffer.from(response.data);
    if (buffer.length > 5 * 1024 * 1024) {
      console.warn("DownloadAvatarService: Immagine troppo grande (>5MB)");
      return null;
    }

    // 3. Determina estensione dal Content-Type
    const contentType = response.headers["content-type"] || "";
    let extension = "jpg"; // default

    if (contentType.includes("jpeg") || contentType.includes("jpg")) {
      extension = "jpg";
    } else if (contentType.includes("png")) {
      extension = "png";
    } else if (contentType.includes("gif")) {
      extension = "gif";
    } else if (contentType.includes("webp")) {
      extension = "webp";
    } else {
      // Prova a determinare dall'URL
      const urlExt = path.extname(new URL(avatarUrl).pathname).toLowerCase();
      if (urlExt && [".jpg", ".jpeg", ".png", ".gif", ".webp"].includes(urlExt)) {
        extension = urlExt.substring(1); // Rimuovi il punto
      }
    }

    // 4. Genera nome file univoco
    const timestamp = Date.now();
    const filename = `user_${userId}_${timestamp}.${extension}`;
    const uploadDir = path.join(__dirname, "../../uploads/profiles");

    // 5. Assicurati che la directory esista
    try {
      await fs.mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      // Directory potrebbe già esistere
      if (mkdirError.code !== "EEXIST") {
        throw mkdirError;
      }
    }

    // 6. Salva file
    const filePath = path.join(uploadDir, filename);
    await fs.writeFile(filePath, buffer);

    // 7. Restituisci path relativo per il database
    const relativePath = `/uploads/profiles/${filename}`;
    console.log(`DownloadAvatarService: Avatar salvato per user ${userId}: ${relativePath}`);
    return relativePath;
  } catch (error) {
    console.error("DownloadAvatarService: Errore nel download avatar:", error.message);
    // Non lanciare errore, restituisci null per permettere fallback
    return null;
  }
}

/**
 * Valida che l'URL sia un'immagine valida
 * @param {string} url - URL da validare
 * @returns {boolean} - true se l'URL sembra valido
 */
function isValidImageUrl(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const urlObj = new URL(url);
    // Verifica che sia HTTP/HTTPS
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  downloadAndSaveAvatar,
  isValidImageUrl,
};

