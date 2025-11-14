// ProfileImageUpload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Directory per le immagini profilo
const uploadDir = path.join(__dirname, "../../uploads/profiles");

// Crea la directory se non esiste
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configurazione storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Ottieni userId dalla sessione
    const userId = req.session?.account?.user_id;
    if (!userId) {
      return cb(new Error("Utente non autenticato"));
    }

    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    const filename = `user_${userId}_${timestamp}${ext}`;
    cb(null, filename);
  },
});

// Filtro file - valida tipo e dimensione
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tipo file non supportato. Usa JPEG, PNG, GIF o WebP"
      ),
      false
    );
  }
};

// Configurazione multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: fileFilter,
});

// Middleware per gestire errori multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Il file è troppo grande. Dimensione massima: 5MB",
        error: "FILE_TOO_LARGE",
      });
    }
    return res.status(400).json({
      success: false,
      message: "Errore durante il caricamento del file",
      error: "UPLOAD_ERROR",
    });
  }

  if (err) {
    if (err.message.includes("Tipo file non supportato")) {
      return res.status(400).json({
        success: false,
        message: err.message,
        error: "INVALID_FILE_TYPE",
      });
    }
    if (err.message.includes("Utente non autenticato")) {
      return res.status(401).json({
        success: false,
        message: "Autenticazione richiesta",
        error: "UNAUTHORIZED",
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || "Errore durante il caricamento",
      error: "UPLOAD_ERROR",
    });
  }

  next();
};

module.exports = {
  upload: upload.single("profile_image"),
  handleMulterError: handleMulterError,
};

