// Erreur "métier" portant un code HTTP. On la lance avec throw dans un contrôleur,
// et le middleware errorHandler la transforme en réponse JSON.
class HttpError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

module.exports = HttpError;