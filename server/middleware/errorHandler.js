// errorHandler.js
// WHY THIS FILE EXISTS:
// Without a central error handler, Express might accidentally send stack traces
// to the browser — exposing file paths, library versions, or internal logic to attackers.
// This middleware catches ALL unhandled errors and returns a safe, generic message.

function errorHandler(err, req, res, next) {
  // Log the full error on the SERVER (for debugging by the developer)
  // This is safe because it goes to the terminal, not the browser
  console.error('Server error:', err.message);

  // Send a SAFE, generic message to the CLIENT
  // Never expose err.message or err.stack to the browser
  res.status(500).json({
    message: 'An internal server error occurred.'
  });
}

module.exports = errorHandler;
