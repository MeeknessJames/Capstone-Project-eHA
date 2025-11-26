// Firebase Cloud Functions for notifications
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Send vaccination reminder emails
exports.sendVaccinationReminders = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Get all patients
    const patientsSnapshot = await db.collection('patients').get();
    
    for (const patientDoc of patientsSnapshot.docs) {
      const vaccinationsRef = db
        .collection('patients')
        .doc(patientDoc.id)
        .collection('vaccinations');
      
      const vaccinationsSnapshot = await vaccinationsRef.get();
      
      for (const vaccDoc of vaccinationsSnapshot.docs) {
        const vaccData = vaccDoc.data();
        if (vaccData.nextDoseDate) {
          const nextDose = vaccData.nextDoseDate.toDate();
          
          // Check if reminder is needed (within 7 days)
          if (nextDose >= today && nextDose <= nextWeek) {
            const patientData = patientDoc.data();
            const daysUntil = Math.ceil((nextDose - today) / (1000 * 60 * 60 * 24));
            
            // Send email notification (you'll need to configure email service)
            console.log(`Reminder: ${patientData.fullName} needs ${vaccData.vaccineName} in ${daysUntil} days`);
            
            // TODO: Integrate with email service (SendGrid, Mailgun, etc.)
            // await sendEmail({
            //   to: patientData.email,
            //   subject: `Vaccination Reminder: ${vaccData.vaccineName}`,
            //   body: `Dear ${patientData.fullName}, you have an upcoming vaccination in ${daysUntil} days.`
            // });
          }
        }
      }
    }
    
    return null;
  });

// Send appointment reminders
exports.sendAppointmentReminders = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // Get all patients
    const patientsSnapshot = await db.collection('patients').get();
    
    for (const patientDoc of patientsSnapshot.docs) {
      const appointmentsRef = db
        .collection('patients')
        .doc(patientDoc.id)
        .collection('appointments');
      
      const tomorrowStart = admin.firestore.Timestamp.fromDate(tomorrow);
      const tomorrowEnd = admin.firestore.Timestamp.fromDate(
        new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
      );
      
      const appointmentsQuery = appointmentsRef
        .where('appointmentDate', '>=', tomorrowStart)
        .where('appointmentDate', '<', tomorrowEnd)
        .where('status', '==', 'scheduled');
      
      const appointmentsSnapshot = await appointmentsQuery.get();
      
      for (const apptDoc of appointmentsSnapshot.docs) {
        const apptData = apptDoc.data();
        const patientData = patientDoc.data();
        
        console.log(`Reminder: ${patientData.fullName} has an appointment tomorrow: ${apptData.reason}`);
        
        // TODO: Integrate with email service
        // await sendEmail({
        //   to: patientData.email,
        //   subject: `Appointment Reminder: ${apptData.reason}`,
        //   body: `Dear ${patientData.fullName}, you have an appointment tomorrow.`
        // });
      }
    }
    
    return null;
  });

