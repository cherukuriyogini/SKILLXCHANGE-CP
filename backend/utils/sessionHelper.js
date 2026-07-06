const Session = require('../models/Session');

/**
 * Finds a session by either its MongoDB _id or its custom sessionId string.
 * @param {string} idOrSessionId - The ID or custom sessionId to search for.
 * @returns {Promise<Object|null>} The found session or null.
 */
const findSessionByIdOrCustomId = async (idOrSessionId) => {
  if (!idOrSessionId) return null;
  
  let session = null;
  
  // Try to find by MongoDB _id first if it looks like one
  if (idOrSessionId.match(/^[0-9a-fA-F]{24}$/)) {
    session = await Session.findById(idOrSessionId);
  }
  
  // If not found by _id, try by custom sessionId
  if (!session) {
    session = await Session.findOne({ sessionId: idOrSessionId });
  }
  
  return session;
};

module.exports = { findSessionByIdOrCustomId };
