const asyncHandler = require('express-async-handler');

/**
 * Ye middleware ye verify karta hai ke user sirf apne hi school ka data access kar raha hai.
 * Agar user Super Admin hai, to wo kisi bhi school ka data access kar sakta hai.
 */
const checkSchoolAccess = asyncHandler(async (req, res, next) => {
  // Super Admin ko har jagah janay ki ijazat hai
  if (req.user.role === 'superAdmin') {
    return next();
  }

  // Agar request mein schoolId hai (body ya params mein)
  const schoolId = req.params.schoolId || req.body.schoolId || req.query.schoolId;

  if (schoolId) {
    // Check karna ke kya ye user ki apni schoolId se match karti hai
    if (schoolId.toString() !== req.user.schoolId.toString()) {
      res.status(403);
      throw new Error('Access denied: You can only access data belonging to your school');
    }
  }

  // Agar kisi specific resource ki request hai (maslan Student ID)
  // To controller mein hum query karte waqt { _id: id, schoolId: req.user.schoolId } istemal karenge.

  next();
});

module.exports = { checkSchoolAccess };
