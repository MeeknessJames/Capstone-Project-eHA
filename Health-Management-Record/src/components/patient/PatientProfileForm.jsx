import { useEffect, useState } from "react";
import { createOrUpdatePatient } from "@/integrations/firebase/database";
import { auth } from "@/integrations/firebase/config";
import { updateProfile } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const toDateInputValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString().split("T")[0];
  if (value?.toDate) return value.toDate().toISOString().split("T")[0];
  return "";
};

const normalizeListField = (field) => {
  if (Array.isArray(field)) return field.join(", ");
  return field || "";
};

const defaultState = (patient) => ({
  fullName: patient?.fullName || "",
  email: patient?.email || auth.currentUser?.email || "",
  phone: patient?.phone || "",
  dateOfBirth: toDateInputValue(patient?.dateOfBirth),
  gender: patient?.gender ?? "",
  address: patient?.address || "",
  bloodType: patient?.bloodType || "",
  allergies: normalizeListField(patient?.allergies),
  chronicConditions: normalizeListField(patient?.chronicConditions),
  emergencyContactName: patient?.emergencyContactName || "",
  emergencyContactPhone: patient?.emergencyContactPhone || "",
});

const PatientProfileForm = ({ patient, userId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState(() => defaultState(patient));
  const [loading, setLoading] = useState(false);

  // Keep form in sync whenever patient data changes
  useEffect(() => {
    setFormData(defaultState(patient));
  }, [patient]);

  const handleChange = (field) => (eventOrValue) => {
    if (eventOrValue?.target) {
      setFormData((prev) => ({ ...prev, [field]: eventOrValue.target.value }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: eventOrValue }));
    }
  };

  const formatListField = (value) =>
    value
      ? value
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone || null,
      dateOfBirth: formData.dateOfBirth || null,
      gender: formData.gender && formData.gender.trim() ? formData.gender.trim() : null,
      address: formData.address || null,
      bloodType: formData.bloodType || null,
      allergies: formatListField(formData.allergies),
      chronicConditions: formatListField(formData.chronicConditions),
      emergencyContactName: formData.emergencyContactName || null,
      emergencyContactPhone: formData.emergencyContactPhone || null,
    };

    try {
      const { success, error } = await createOrUpdatePatient(userId, payload);

      if (!success) {
        toast.error(error || "Failed to update profile");
        setLoading(false);
        return;
      }

      if (auth.currentUser && formData.fullName && auth.currentUser.displayName !== formData.fullName) {
        await updateProfile(auth.currentUser, {
          displayName: formData.fullName,
        });
      }

      toast.success("Profile updated successfully");
      onSuccess();
    } catch (err) {
      toast.error("Something went wrong while saving your profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input id="fullName" required value={formData.fullName} onChange={handleChange("fullName")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" value={formData.email} readOnly className="bg-muted cursor-not-allowed" />
          <p className="text-xs text-muted-foreground">Email changes require contacting support.</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" value={formData.phone} onChange={handleChange("phone")} placeholder="(+1) 555-555-5555" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input id="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange("dateOfBirth")} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select 
            value={formData.gender || undefined} 
            onValueChange={handleChange("gender")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bloodType">Blood Type</Label>
          <Input id="bloodType" value={formData.bloodType} onChange={handleChange("bloodType")} placeholder="e.g., A+, O-" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Textarea
          id="address"
          value={formData.address}
          onChange={handleChange("address")}
          placeholder="Street, City, State, ZIP"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="allergies">Allergies (comma separated)</Label>
          <Textarea
            id="allergies"
            value={formData.allergies}
            onChange={handleChange("allergies")}
            placeholder="Penicillin, Peanuts, Latex"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="chronicConditions">Chronic Conditions (comma separated)</Label>
          <Textarea
            id="chronicConditions"
            value={formData.chronicConditions}
            onChange={handleChange("chronicConditions")}
            placeholder="Diabetes, Hypertension"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
          <Input
            id="emergencyContactName"
            value={formData.emergencyContactName}
            onChange={handleChange("emergencyContactName")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
          <Input
            id="emergencyContactPhone"
            value={formData.emergencyContactPhone}
            onChange={handleChange("emergencyContactPhone")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
};

export default PatientProfileForm;


