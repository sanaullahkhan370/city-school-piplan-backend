const Student = require('../models/student.model');
const FeeStructure = require('../models/feeStructure.model');
const FeeInvoice = require('../models/feeInvoice.model');
const FeePayment = require('../models/feePayment.model');
const { runSeed, getAdmin, getAcademicContext } = require('./seedUtils');

runSeed('Fee status and payments seed', async () => {
  const { school, session, schoolClass } = await getAcademicContext();
  const admin = await getAdmin(school._id);
  const students = await Student.find({ schoolId: school._id, admissionNumber: /^ADM-2026-00[1-5]$/ }).sort({ admissionNumber: 1 });
  if (students.length < 5) throw new Error('Run npm run seed:students first');
  await FeeStructure.updateOne(
    { schoolId: school._id, academicSessionId: session._id, classId: schoolClass._id, title: 'Monthly Tuition Fee' },
    { $setOnInsert: { feeType: 'tuition', amount: 2500, frequency: 'monthly', createdBy: admin._id } },
    { upsert: true }
  );
  const paidAmounts = [1500, 2500, 0, 1000, 0];
  for (let index = 0; index < students.length; index += 1) {
    const invoiceNumber = `INV-DEMO-2026-00${index + 1}`;
    const paidAmount = paidAmounts[index];
    const remainingAmount = 2500 - paidAmount;
    const invoice = await FeeInvoice.findOneAndUpdate(
      { invoiceNumber },
      {
        $set: {
          paidAmount, remainingAmount,
          status: remainingAmount === 0 ? 'paid' : paidAmount > 0 ? 'partiallyPaid' : 'unpaid',
        },
        $setOnInsert: {
          invoiceNumber, schoolId: school._id, academicSessionId: session._id, studentId: students[index]._id,
          items: [{ title: 'August Tuition Fee', feeType: 'tuition', amount: 2500 }],
          subtotal: 2500, discount: 0, fine: 0, totalAmount: 2500,
          issueDate: new Date('2026-08-01'), dueDate: new Date('2026-08-10'), createdBy: admin._id,
        },
      },
      { upsert: true, new: true }
    );
    if (paidAmount > 0) {
      const receiptNumber = `RCP-DEMO-2026-00${index + 1}`;
      await FeePayment.updateOne(
        { receiptNumber },
        {
          $setOnInsert: {
            receiptNumber, schoolId: school._id, invoiceId: invoice._id, studentId: students[index]._id,
            amount: paidAmount, method: index % 2 === 0 ? 'cash' : 'bankDeposit',
            reference: index % 2 === 0 ? '' : `BANK-DEMO-00${index + 1}`,
            paidAt: new Date('2026-08-05'), recordedBy: admin._id,
          },
        },
        { upsert: true }
      );
    }

    const notebookInvoiceNumber = `INV-NOTEBOOKS-2026-00${index + 1}`;
    const notebookPaidAmounts = [800, 400, 0, 800, 0];
    const notebookPaid = notebookPaidAmounts[index];
    const notebookRemaining = 800 - notebookPaid;
    const notebookInvoice = await FeeInvoice.findOneAndUpdate(
      { invoiceNumber: notebookInvoiceNumber },
      {
        $set: {
          paidAmount: notebookPaid,
          remainingAmount: notebookRemaining,
          status: notebookRemaining === 0
            ? 'paid'
            : notebookPaid > 0
              ? 'partiallyPaid'
              : 'unpaid',
        },
        $setOnInsert: {
          invoiceNumber: notebookInvoiceNumber,
          schoolId: school._id,
          academicSessionId: session._id,
          studentId: students[index]._id,
          items: [
            { title: 'School Notebooks and Copies', feeType: 'copies', amount: 600 },
            { title: 'Homework Planner', feeType: 'planner', amount: 200 },
          ],
          subtotal: 800,
          discount: 0,
          fine: 0,
          totalAmount: 800,
          issueDate: new Date('2026-08-20'),
          dueDate: new Date('2026-09-05'),
          createdBy: admin._id,
        },
      },
      { upsert: true, new: true }
    );
    if (notebookPaid > 0) {
      await FeePayment.updateOne(
        { receiptNumber: `RCP-NOTEBOOKS-2026-00${index + 1}` },
        {
          $setOnInsert: {
            receiptNumber: `RCP-NOTEBOOKS-2026-00${index + 1}`,
            schoolId: school._id,
            invoiceId: notebookInvoice._id,
            studentId: students[index]._id,
            amount: notebookPaid,
            method: 'cash',
            reference: '',
            paidAt: new Date('2026-08-22'),
            recordedBy: admin._id,
          },
        },
        { upsert: true }
      );
    }
  }
  console.log('10 Tuition, Notebooks and Planner invoices with payment states are ready');
});
