const { spawnSync } = require('child_process');
const path = require('path');

const files = [
  'seedAccounts.js', 'seedAcademics.js', 'seedStudents.js', 'seedAttendance.js',
  'seedHomework.js', 'seedHomeworkMarks.js', 'seedHomeworkResponses.js', 'seedExams.js', 'seedFees.js', 'seedUpcomingFees.js', 'seedNotices.js', 'seedStars.js', 'seedPasswords.js',
];

for (const file of files) {
  console.log(`\n▶ Running ${file}`);
  const result = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('\n🎉 All linked demo seeds completed');
