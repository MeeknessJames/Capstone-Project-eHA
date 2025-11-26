import { useState } from "react";
import { addVaccination, updateVaccination } from "@/integrations/firebase/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";

const VaccinationForm = ({ patientId, vaccinationId, initialData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    vaccineName: initialData?.vaccineName || "",
    dateGiven: initialData?.dateGiven?.toDate ? initialData.dateGiven.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    nextDoseDate: initialData?.nextDoseDate?.toDate ? initialData.nextDoseDate.toDate().toISOString().split('T')[0] : "",
    status: initialData?.status || "pending",
    batchNumber: initialData?.batchNumber || "",
    administeredBy: initialData?.administeredBy || "",
    notes: initialData?.notes || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const vaccinationData = {
        vaccineName: formData.vaccineName,
        dateGiven: Timestamp.fromDate(new Date(formData.dateGiven)),
        nextDoseDate: formData.nextDoseDate ? Timestamp.fromDate(new Date(formData.nextDoseDate)) : null,
        status: formData.status,
        batchNumber: formData.batchNumber || null,
        administeredBy: formData.administeredBy || null,
        notes: formData.notes || null,
      };

      let result;
      if (vaccinationId) {
        result = await updateVaccination(patientId, vaccinationId, vaccinationData);
      } else {
        result = await addVaccination(patientId, vaccinationData);
      }

      if (result.success) {
        toast.success(vaccinationId ? "Vaccination updated successfully" : "Vaccination added successfully");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to save vaccination");
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
        <Label htmlFor="vaccineName">Vaccine Name *</Label>
        <Input
          id="vaccineName"
          value={formData.vaccineName}
          onChange={(e) => setFormData({ ...formData, vaccineName: e.target.value })}
          required
          placeholder="e.g., COVID-19, Flu Shot, MMR"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dateGiven">Date Given *</Label>
        <Input
          id="dateGiven"
          type="date"
          value={formData.dateGiven}
          onChange={(e) => setFormData({ ...formData, dateGiven: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nextDoseDate">Next Dose Date</Label>
        <Input
          id="nextDoseDate"
          type="date"
          value={formData.nextDoseDate}
          onChange={(e) => setFormData({ ...formData, nextDoseDate: e.target.value })}
          placeholder="Optional - for multi-dose vaccines"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="batchNumber">Batch Number</Label>
        <Input
          id="batchNumber"
          value={formData.batchNumber}
          onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
          placeholder="Vaccine batch number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="administeredBy">Administered By</Label>
        <Input
          id="administeredBy"
          value={formData.administeredBy}
          onChange={(e) => setFormData({ ...formData, administeredBy: e.target.value })}
          placeholder="Doctor or clinic name"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Input
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes"
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
              {vaccinationId ? "Updating..." : "Adding..."}
            </>
          ) : (
            vaccinationId ? "Update Vaccination" : "Add Vaccination"
          )}
        </Button>
      </div>
    </form>
  );
};

export default VaccinationForm;

