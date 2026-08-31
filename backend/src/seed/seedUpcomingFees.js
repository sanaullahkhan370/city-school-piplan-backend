const UpcomingFee = require('../models/upcomingFee.model');
const { runSeed, getAdmin, getAcademicContext } = require('./seedUtils');

runSeed('Upcoming parent fee plans seed', async () => {
  const { school, session, schoolClass } = await getAcademicContext();
  const admin = await getAdmin(school._id);
  const plans = [
    {
      title: 'September Tuition Fee',
      feeType: 'tuition',
      amount: 2500,
      expectedDate: new Date('2026-09-01'),
      dueDate: new Date('2026-09-10'),
      description: 'Next month regular school tuition fee.',
    },
    {
      title: 'Monthly Test Fee',
      feeType: 'test',
      amount: 500,
      expectedDate: new Date('2026-09-05'),
      dueDate: new Date('2026-09-10'),
      description: 'September monthly assessment and test material.',
    },
    {
      title: 'Copies and Workbooks',
      feeType: 'copies',
      amount: 800,
      expectedDate: new Date('2026-09-15'),
      dueDate: new Date('2026-09-20'),
      description: 'Class copies and practice workbooks for the new unit.',
    },
    {
      title: 'Student Planner and Diary',
      feeType: 'planner',
      amount: 350,
      expectedDate: new Date('2026-10-01'),
      dueDate: new Date('2026-10-07'),
      description: 'School planner and home communication diary.',
    },
    {
      title: 'Assignment Material',
      feeType: 'assignment',
      amount: 250,
      expectedDate: new Date('2026-10-12'),
      dueDate: new Date('2026-10-18'),
      description: 'Art and project material for the class assignment.',
    },
  ];

  for (const plan of plans) {
    await UpcomingFee.updateOne(
      {
        schoolId: school._id,
        academicSessionId: session._id,
        classId: schoolClass._id,
        title: plan.title,
      },
      {
        $set: { ...plan, status: 'planned', isActive: true, updatedBy: admin._id },
        $setOnInsert: {
          schoolId: school._id,
          academicSessionId: session._id,
          classId: schoolClass._id,
          createdBy: admin._id,
        },
      },
      { upsert: true }
    );
  }

  console.log('5 next-month and planned charges are ready for Grade 1 parents');
});
