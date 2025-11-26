import { useState } from "react";
import { addAppointment, updateAppointment } from "@/integrations/firebase/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Timestamp } from "firebase/firestore";

const AppointmentForm = ({ patientId, appointmentId, initialData, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: initialData?.reason || "",
    appointmentDate: initialData?.appointmentDate?.toDate ? 
      initialData.appointmentDate.toDate().toISOString().slice(0, 16) : 
      new Date().toISOString().slice(0, 16),
    status: initialData?.status || "scheduled",
    notes: initialData?.notes || "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const appointmentData = {
        reason: formData.reason,
        appointmentDate: Timestamp.fromDate(new Date(formData.appointmentDate)),
        status: formData.status,
        notes: formData.notes || null,
      };

      let result;
      if (appointmentId) {
        result = await updateAppointment(patientId, appointmentId, appointmentData);
      } else {
        result = await addAppointment(patientId, appointmentData);
      }

      if (result.success) {
        toast.success(appointmentId ? "Appointment updated successfully" : "Appointment scheduled successfully");
        onSuccess();
      } else {
        toast.error(result.error || "Failed to save appointment");
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
        <Label htmlFor="reason">Appointment Reason *</Label>
        <Input
          id="reason"
          value={formData.reason}
          onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
          required
          placeholder="e.g., Annual checkup, Follow-up visit"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="appointmentDate">Date & Time *</Label>
        <Input
          id="appointmentDate"
          type="datetime-local"
          value={formData.appointmentDate}
          onChange={(e) => setFormData({ ...formData, appointmentDate: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status *</Label>
        <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="rescheduled">Rescheduled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes or instructions"
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
              {appointmentId ? "Updating..." : "Scheduling..."}
            </>
          ) : (
            appointmentId ? "Update Appointment" : "Schedule Appointment"
          )}
        </Button>
      </div>
    </form>
  );
};

export default AppointmentForm;

