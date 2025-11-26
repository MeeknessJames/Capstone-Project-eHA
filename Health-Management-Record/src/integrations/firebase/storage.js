// Firebase Storage helpers for file uploads
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { storage } from './config';

// Upload file to patient's folder
export const uploadPatientFile = async (patientId, file, folder = 'documents') => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const fileRef = ref(storage, `patients/${patientId}/${folder}/${fileName}`);
    
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    
    return {
      success: true,
      url: downloadURL,
      fileName: fileName,
      originalName: file.name,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      url: null,
      fileName: null,
      originalName: file.name,
      error: error.message,
    };
  }
};

// Upload multiple files
export const uploadMultipleFiles = async (patientId, files, folder = 'documents') => {
  const uploadPromises = Array.from(files).map(file => 
    uploadPatientFile(patientId, file, folder)
  );
  
  const results = await Promise.all(uploadPromises);
  return results;
};

// Delete file from storage
export const deletePatientFile = async (patientId, fileName, folder = 'documents') => {
  try {
    const fileRef = ref(storage, `patients/${patientId}/${folder}/${fileName}`);
    await deleteObject(fileRef);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get all files for a patient
export const getPatientFiles = async (patientId, folder = 'documents') => {
  try {
    const folderRef = ref(storage, `patients/${patientId}/${folder}`);
    const fileList = await listAll(folderRef);
    
    const filePromises = fileList.items.map(async (itemRef) => {
      const url = await getDownloadURL(itemRef);
      return {
        name: itemRef.name,
        url: url,
        fullPath: itemRef.fullPath,
      };
    });
    
    const files = await Promise.all(filePromises);
    return { success: true, files, error: null };
  } catch (error) {
    return { success: false, files: [], error: error.message };
  }
};

