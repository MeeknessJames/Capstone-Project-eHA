import { useState } from "react";
import { addMedicalRecord, updateMedicalRecord } from "@/integrations/firebase/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";

const MedicalRecordForm = ({ patientId, recordId, initialData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    diagnosis: initialData?.diagnosis || "",
    symptoms: initialData?.symptoms || "",
    treatment: initialData?.treatment || "",
    prescription: initialData?.prescription || "",
    notes: initialData?.notes || "",
    visitDate: initialData?.visitDate?.toDate ? initialData.visitDate.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const recordData = {
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms || null,
        treatment: formData.treatment || null,
        prescription: formData.prescription || null,
        notes: formData.notes || null,
        visitDate: Timestamp.fromDate(new Date(formData.visitDate)),
      };

      let result;
      if (recordId) {
        result = await updateMedicalRecord(patientId, recordId, recordData);
      } else {
        result = await addMedicalRecord(patientId, recordData);
      }

      if (result.success) {
        toast.success(recordId ? "Medical record updated successfully" : "Medical record added successfully");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to save medical record");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="visitDate">Visit Date *</Label>
        <Input
          id="visitDate"
          type="date"
          value={formData.visitDate}
          onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="diagnosis">Diagnosis *</Label>
        <Input
          id="diagnosis"
          value={formData.diagnosis}
          onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
          required
          placeholder="Enter diagnosis"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="symptoms">Symptoms</Label>
        <Textarea
          id="symptoms"
          value={formData.symptoms}
          onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
          placeholder="Describe symptoms"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="treatment">Treatment</Label>
        <Textarea
          id="treatment"
          value={formData.treatment}
          onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
          placeholder="Describe treatment provided"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="prescription">Prescription</Label>
        <Textarea
          id="prescription"
          value={formData.prescription}
          onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
          placeholder="List prescribed medications"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Additional Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Any additional notes"
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {recordId ? "Updating..." : "Adding..."}
            </>
          ) : (
            recordId ? "Update Record" : "Add Record"
          )}
        </Button>
      </div>
    </form>
  );
};

export default MedicalRecordForm;

