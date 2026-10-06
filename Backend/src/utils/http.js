// Errors that carry their HTTP status, so controllers don't string-match messages.
export const httpError = (status, message) => Object.assign(new Error(message), { status });

export const sendError = (res, err, fallbackMessage) => {
  if (err.status) return res.status(err.status).json({ message: err.message });
  console.error(`${fallbackMessage}:`, err);
  return res.status(500).json({ message: fallbackMessage });
};
