const Notice = require('../models/notice.model');
const { runSeed, getSchool, getAdmin } = require('./seedUtils');

const notices = [
  ['Parent Teacher Meeting', 'Parent Teacher Meeting will be held on Saturday at 10:00 AM.', 'parent', 'important'],
  ['School Holiday', 'School will remain closed on Monday due to a local holiday.', 'all', 'urgent'],
  ['Monthly Test Schedule', 'The monthly tests will start from 5 September 2026.', 'parent', 'normal'],
  ['Teacher Training', 'Teacher training session will start at 1:30 PM on Friday.', 'teacher', 'important'],
  ['Fee Reminder', 'Please submit pending August fee before the due date.', 'parent', 'urgent'],
];

runSeed('Notices seed', async () => {
  const school = await getSchool();
  const admin = await getAdmin(school._id);
  for (const [title, message, audience, priority] of notices) {
    await Notice.updateOne(
      { schoolId: school._id, title },
      {
        $set: { message, audience, priority, status: 'published' },
        $setOnInsert: {
          publishedAt: new Date('2026-08-28T09:00:00.000Z'),
          expiresAt: new Date('2027-03-31T23:59:59.000Z'), createdBy: admin._id,
        },
      },
      { upsert: true }
    );
  }
  console.log('5 published notices for parent, teacher and all audiences are ready');
});
