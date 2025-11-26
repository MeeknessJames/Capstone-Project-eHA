// Firestore Database helpers
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  Timestamp,
} from 'firebase/firestore';
import { db } from './config';

// ============ PATIENTS ============

// Create or update patient profile
export const createOrUpdatePatient = async (userId, patientData) => {
  try {
    const patientRef = doc(db, 'patients', userId);
    await setDoc(patientRef, {
      ...patientData,
      updatedAt: Timestamp.now(),
    }, { merge: true });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get patient by user ID
export const getPatientByUserId = async (userId) => {
  try {
    const patientDoc = await getDoc(doc(db, 'patients', userId));
    if (patientDoc.exists()) {
      return { id: patientDoc.id, ...patientDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting patient:', error);
    return null;
  }
};

// Get all patients (for doctors/admins)
export const getAllPatients = async () => {
  try {
    const patientsRef = collection(db, 'patients');
    const q = query(patientsRef, orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting patients:', error);
    return [];
  }
};

// Search patients
export const searchPatients = async (searchTerm) => {
  try {
    const patientsRef = collection(db, 'patients');
    const querySnapshot = await getDocs(patientsRef);
    const allPatients = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Filter by search term (name, email, or patient ID)
    const searchLower = searchTerm.toLowerCase();
    return allPatients.filter(patient => {
      const fullName = patient.fullName?.toLowerCase() || '';
      const email = patient.email?.toLowerCase() || '';
      const patientId = patient.id?.toLowerCase() || '';
      return fullName.includes(searchLower) || 
             email.includes(searchLower) || 
             patientId.includes(searchLower);
    });
  } catch (error) {
    console.error('Error searching patients:', error);
    return [];
  }
};

// Delete patient
export const deletePatient = async (userId) => {
  try {
    await deleteDoc(doc(db, 'patients', userId));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ MEDICAL RECORDS ============

// Add medical record
export const addMedicalRecord = async (patientId, recordData) => {
  try {
    const recordsRef = collection(db, 'patients', patientId, 'medicalRecords');
    await addDoc(recordsRef, {
      ...recordData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get medical records for a patient
export const getMedicalRecords = async (patientId, limitCount = null) => {
  try {
    const recordsRef = collection(db, 'patients', patientId, 'medicalRecords');
    let q = query(recordsRef, orderBy('visitDate', 'desc'));
    if (limitCount) {
      q = query(recordsRef, orderBy('visitDate', 'desc'), limit(limitCount));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting medical records:', error);
    return [];
  }
};

// Update medical record
export const updateMedicalRecord = async (patientId, recordId, recordData) => {
  try {
    const recordRef = doc(db, 'patients', patientId, 'medicalRecords', recordId);
    await updateDoc(recordRef, {
      ...recordData,
      updatedAt: Timestamp.now(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete medical record
export const deleteMedicalRecord = async (patientId, recordId) => {
  try {
    await deleteDoc(doc(db, 'patients', patientId, 'medicalRecords', recordId));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ VACCINATIONS ============

// Add vaccination record
export const addVaccination = async (patientId, vaccinationData) => {
  try {
    const vaccinationsRef = collection(db, 'patients', patientId, 'vaccinations');
    await addDoc(vaccinationsRef, {
      ...vaccinationData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get vaccinations for a patient
export const getVaccinations = async (patientId, limitCount = null) => {
  try {
    const vaccinationsRef = collection(db, 'patients', patientId, 'vaccinations');
    let q = query(vaccinationsRef, orderBy('dateGiven', 'desc'));
    if (limitCount) {
      q = query(vaccinationsRef, orderBy('dateGiven', 'desc'), limit(limitCount));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting vaccinations:', error);
    return [];
  }
};

// Get upcoming vaccinations (for reminders)
export const getUpcomingVaccinations = async () => {
  try {
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);
    const upcomingVaccinations = [];

    for (const patientDoc of patientsSnapshot.docs) {
      const vaccinationsRef = collection(db, 'patients', patientDoc.id, 'vaccinations');
      const vaccinationsSnapshot = await getDocs(vaccinationsRef);
      
      vaccinationsSnapshot.forEach(vaccDoc => {
        const vaccData = vaccDoc.data();
        if (vaccData.nextDoseDate) {
          const nextDose = vaccData.nextDoseDate.toDate();
          const today = new Date();
          const daysUntil = Math.ceil((nextDose - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntil >= 0 && daysUntil <= 30) {
            upcomingVaccinations.push({
              patientId: patientDoc.id,
              patientName: patientDoc.data().fullName,
              vaccinationId: vaccDoc.id,
              vaccineName: vaccData.vaccineName,
              nextDoseDate: nextDose,
              daysUntil,
            });
          }
        }
      });
    }

    return upcomingVaccinations.sort((a, b) => a.daysUntil - b.daysUntil);
  } catch (error) {
    console.error('Error getting upcoming vaccinations:', error);
    return [];
  }
};

// Update vaccination
export const updateVaccination = async (patientId, vaccinationId, vaccinationData) => {
  try {
    const vaccinationRef = doc(db, 'patients', patientId, 'vaccinations', vaccinationId);
    await updateDoc(vaccinationRef, {
      ...vaccinationData,
      updatedAt: Timestamp.now(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete vaccination
export const deleteVaccination = async (patientId, vaccinationId) => {
  try {
    await deleteDoc(doc(db, 'patients', patientId, 'vaccinations', vaccinationId));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ APPOINTMENTS ============

// Add appointment
export const addAppointment = async (patientId, appointmentData) => {
  try {
    const appointmentsRef = collection(db, 'patients', patientId, 'appointments');
    await addDoc(appointmentsRef, {
      ...appointmentData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get appointments for a patient
export const getAppointments = async (patientId, limitCount = null) => {
  try {
    const appointmentsRef = collection(db, 'patients', patientId, 'appointments');
    let q = query(appointmentsRef, orderBy('appointmentDate', 'asc'));
    if (limitCount) {
      q = query(appointmentsRef, orderBy('appointmentDate', 'asc'), limit(limitCount));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting appointments:', error);
    return [];
  }
};

// Get upcoming appointments
export const getUpcomingAppointments = async () => {
  try {
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);
    const upcomingAppointments = [];
    const today = new Date();

    for (const patientDoc of patientsSnapshot.docs) {
      const appointmentsRef = collection(db, 'patients', patientDoc.id, 'appointments');
      const q = query(
        appointmentsRef,
        where('appointmentDate', '>=', Timestamp.fromDate(today)),
        orderBy('appointmentDate', 'asc')
      );
      const appointmentsSnapshot = await getDocs(q);
      
      appointmentsSnapshot.forEach(apptDoc => {
        const apptData = apptDoc.data();
        upcomingAppointments.push({
          patientId: patientDoc.id,
          patientName: patientDoc.data().fullName,
          appointmentId: apptDoc.id,
          ...apptData,
        });
      });
    }

    return upcomingAppointments.sort((a, b) => 
      a.appointmentDate.toDate() - b.appointmentDate.toDate()
    );
  } catch (error) {
    console.error('Error getting upcoming appointments:', error);
    return [];
  }
};

// Update appointment
export const updateAppointment = async (patientId, appointmentId, appointmentData) => {
  try {
    const appointmentRef = doc(db, 'patients', patientId, 'appointments', appointmentId);
    await updateDoc(appointmentRef, {
      ...appointmentData,
      updatedAt: Timestamp.now(),
    });
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Delete appointment
export const deleteAppointment = async (patientId, appointmentId) => {
  try {
    await deleteDoc(doc(db, 'patients', patientId, 'appointments', appointmentId));
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// ============ STATISTICS ============

// Get dashboard statistics for doctors
export const getDoctorStats = async () => {
  try {
    const patientsRef = collection(db, 'patients');
    const patientsSnapshot = await getDocs(patientsRef);
    const totalPatients = patientsSnapshot.size;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let todayAppointments = 0;
    let recentRecords = 0;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    for (const patientDoc of patientsSnapshot.docs) {
      // Count today's appointments
      const appointmentsRef = collection(db, 'patients', patientDoc.id, 'appointments');
      const todayApptsQuery = query(
        appointmentsRef,
        where('appointmentDate', '>=', Timestamp.fromDate(today)),
        where('appointmentDate', '<', Timestamp.fromDate(tomorrow))
      );
      const todayAppts = await getDocs(todayApptsQuery);
      todayAppointments += todayAppts.size;

      // Count recent records
      const recordsRef = collection(db, 'patients', patientDoc.id, 'medicalRecords');
      const recentRecordsQuery = query(
        recordsRef,
        where('visitDate', '>=', Timestamp.fromDate(weekAgo))
      );
      const recentRecs = await getDocs(recentRecordsQuery);
      recentRecords += recentRecs.size;
    }

    return {
      totalPatients,
      todayAppointments,
      recentRecords,
    };
  } catch (error) {
    console.error('Error getting doctor stats:', error);
    return {
      totalPatients: 0,
      todayAppointments: 0,
      recentRecords: 0,
    };
  }
};

