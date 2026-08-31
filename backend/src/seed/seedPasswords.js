const { DEMO_PASSWORD, User, runSeed } = require('./seedUtils');

const demoEmails = [
  'superadmin@school.com', 'admin@school.com',
  'teacher@school.com', 'teacher2@school.com', 'teacher3@school.com',
  'teacher4@school.com', 'teacher5@school.com',
  'parent@school.com', 'parent2@school.com', 'parent3@school.com',
  'parent4@school.com', 'parent5@school.com',
];

runSeed('Demo passwords seed', async () => {
  const users = await User.find({ email: { $in: demoEmails } });
  if (!users.length) throw new Error('Run npm run seed:accounts first');
  for (const user of users) {
    user.password = DEMO_PASSWORD;
    await user.save();
    console.log(`${user.role.padEnd(10)} ${user.email}`);
  }
  console.log(`🔐 Password for every account above: ${DEMO_PASSWORD}`);
});
