const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');

require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const User = require('../models/user.model');
const School = require('../models/school.model');
const AcademicSession = require('../models/academicSession.model');
const SchoolClass = require('../models/class.model');
const Section = require('../models/section.model');
const Subject = require('../models/subject.model');

const DEMO_PASSWORD = 'password123';

async function connect() {
  if (!process.env.MONGO_URI) throw new Error('MONGO_URI is missing from backend/.env');
  await mongoose.connect(process.env.MONGO_URI);
}

async function close() {
  await mongoose.disconnect();
}

async function runSeed(label, task) {
  try {
    await connect();
    console.log(`\n🌱 ${label}`);
    await task();
    console.log(`✅ ${label} completed`);
    await close();
  } catch (error) {
    console.error(`❌ ${label} failed: ${error.message}`);
    await close().catch(() => {});
    process.exitCode = 1;
  }
}

function temporaryPassword() {
  return crypto.randomBytes(18).toString('hex');
}

async function getSchool() {
  const school = await School.findOne({ email: 'demo@school.com' });
  if (!school) throw new Error('Run npm run seed:accounts first');
  return school;
}

async function getAdmin(schoolId) {
  const admin = await User.findOne({ schoolId, email: 'admin@school.com', role: 'admin' });
  if (!admin) throw new Error('Run npm run seed:accounts first');
  return admin;
}

async function getAcademicContext() {
  const school = await getSchool();
  const session = await AcademicSession.findOne({ schoolId: school._id, name: '2026-2027' });
  if (!session) throw new Error('Run npm run seed:academics first');
  const schoolClass = await SchoolClass.findOne({
    schoolId: school._id,
    academicSessionId: session._id,
    name: 'Grade 1',
  });
  const section = schoolClass && await Section.findOne({
    schoolId: school._id,
    academicSessionId: session._id,
    classId: schoolClass._id,
    name: 'A',
  });
  const subject = await Subject.findOne({
    schoolId: school._id,
    academicSessionId: session._id,
    name: 'Mathematics',
  });
  if (!schoolClass || !section || !subject) {
    throw new Error('Academic demo context is incomplete; run npm run seed:academics');
  }
  return { school, session, schoolClass, section, subject };
}

module.exports = {
  DEMO_PASSWORD,
  User,
  School,
  runSeed,
  temporaryPassword,
  getSchool,
  getAdmin,
  getAcademicContext,
};
