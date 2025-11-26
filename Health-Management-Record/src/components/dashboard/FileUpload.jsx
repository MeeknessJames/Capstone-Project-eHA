import { useState, useEffect } from "react";
import { uploadPatientFile, getPatientFiles, deletePatientFile } from "@/integrations/firebase/storage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Upload, File, X, Download } from "lucide-react";

const FileUpload = ({ patientId, folder = "documents" }) => {
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadFiles();
    }
  }, [patientId, folder]);

  const loadFiles = async () => {
    setLoading(true);
    const { success, files: fileList, error } = await getPatientFiles(patientId, folder);
    if (success) {
      setFiles(fileList);
    } else {
      console.error("Error loading files:", error);
    }
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(selectedFiles).map(file => 
        uploadPatientFile(patientId, file, folder)
      );
      
      const results = await Promise.all(uploadPromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);

      if (successful.length > 0) {
        toast.success(`${successful.length} file(s) uploaded successfully`);
        loadFiles();
      }
      if (failed.length > 0) {
        toast.error(`${failed.length} file(s) failed to upload`);
      }
    } catch (error) {
      toast.error("Error uploading files");
    } finally {
      setUploading(false);
      e.target.value = ""; // Reset input
    }
  };

  const handleDeleteFile = async (fileName) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    const { success, error } = await deletePatientFile(patientId, fileName, folder);
    if (success) {
      toast.success("File deleted successfully");
      loadFiles();
    } else {
      toast.error(error || "Failed to delete file");
    }
  };

  const handleDownload = (url, fileName) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Upload and manage patient documents</CardDescription>
          </div>
          <div className="relative">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploading}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            />
            <Button variant="outline" disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Files
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : files.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No files uploaded yet</p>
        ) : (
          <div className="space-y-2">
            {files.map((file, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground">Click to download</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file.url, file.name)}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFile(file.name)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;

