import { useState, useEffect } from "react";
import { getPatientByUserId, createOrUpdatePatient } from "@/integrations/firebase/database";
import { signUp, ROLES } from "@/integrations/firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { Timestamp } from "firebase/firestore";

const patientSchema = z.object({
  email: z.string().email("Invalid email address").max(255, "Email too long"),
  fullName: z.string().trim().min(1, "Name is required").max(100, "Name too long"),
  phone: z.string().trim().max(20, "Phone number too long").optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", ""]).optional(),
  address: z.string().trim().max(500, "Address too long").optional(),
  bloodType: z.string().trim().max(10, "Blood type too long").optional(),
  allergies: z.string().trim().max(1000, "Allergies text too long").optional(),
  chronicConditions: z.string().trim().max(1000, "Chronic conditions text too long").optional(),
  emergencyContactName: z.string().trim().max(100, "Emergency contact name too long").optional(),
  emergencyContactPhone: z.string().trim().max(20, "Emergency contact phone too long").optional(),
});

const PatientForm = ({ patientId, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(!!patientId);
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodType: "",
    allergies: "",
    chronicConditions: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      const patientData = await getPatientByUserId(patientId);

      if (patientData) {
        setFormData({
          email: patientData.email || "",
          fullName: patientData.fullName || "",
          phone: patientData.phone || "",
          dateOfBirth: patientData.dateOfBirth || "",
          gender: patientData.gender || "",
          address: patientData.address || "",
          bloodType: patientData.bloodType || "",
          allergies: Array.isArray(patientData.allergies) ? patientData.allergies.join(", ") : (patientData.allergies || ""),
          chronicConditions: Array.isArray(patientData.chronicConditions) ? patientData.chronicConditions.join(", ") : (patientData.chronicConditions || ""),
          emergencyContactName: patientData.emergencyContactName || "",
          emergencyContactPhone: patientData.emergencyContactPhone || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load patient data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const validation = patientSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors = {};
      validation.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      toast.error("Please fix the form errors");
      return;
    }

    setLoading(true);

    try {
      if (patientId) {
        // Update existing patient
        const patientData = {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          dateOfBirth: formData.dateOfBirth || null,
          gender: formData.gender || null,
          address: formData.address || null,
          bloodType: formData.bloodType || null,
          allergies: formData.allergies ? formData.allergies.split(",").map(a => a.trim()).filter(a => a) : null,
          chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(",").map(c => c.trim()).filter(c => c) : null,
          emergencyContactName: formData.emergencyContactName || null,
          emergencyContactPhone: formData.emergencyContactPhone || null,
        };

        const { success, error } = await createOrUpdatePatient(patientId, patientData);

        if (success) {
          toast.success("Patient updated successfully");
          onSuccess();
        } else {
          toast.error(error || "Failed to update patient");
        }
      } else {
        // Create new patient - first create user account
        const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
        const { user, error: authError } = await signUp(formData.email, tempPassword, formData.fullName, ROLES.PATIENT);

        if (authError) {
          toast.error(authError);
          setLoading(false);
          return;
        }

        if (user) {
          // Create patient record
          const patientData = {
            fullName: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
            dateOfBirth: formData.dateOfBirth || null,
            gender: formData.gender || null,
            address: formData.address || null,
            bloodType: formData.bloodType || null,
            allergies: formData.allergies ? formData.allergies.split(",").map(a => a.trim()).filter(a => a) : null,
            chronicConditions: formData.chronicConditions ? formData.chronicConditions.split(",").map(c => c.trim()).filter(c => c) : null,
            emergencyContactName: formData.emergencyContactName || null,
            emergencyContactPhone: formData.emergencyContactPhone || null,
            createdAt: Timestamp.now(),
          };

          const { success, error } = await createOrUpdatePatient(user.uid, patientData);

          if (success) {
            toast.success("Patient added successfully");
            onSuccess();
          } else {
            toast.error(error || "Failed to create patient");
          }
        }
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name *</Label>
          <Input
            id="fullName"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            required
            maxLength={100}
          />
          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!patientId}
            maxLength={255}
          />
          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            maxLength={20}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dateOfBirth">Date of Birth</Label>
          <Input
            id="dateOfBirth"
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
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
          <Input
            id="bloodType"
            value={formData.bloodType}
            onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
            placeholder="e.g., A+, O-, AB+"
            maxLength={10}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            maxLength={500}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="allergies">Allergies (comma-separated)</Label>
          <Textarea
            id="allergies"
            value={formData.allergies}
            onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
            placeholder="e.g., Penicillin, Peanuts, Latex"
            maxLength={1000}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="chronicConditions">Chronic Conditions (comma-separated)</Label>
          <Textarea
            id="chronicConditions"
            value={formData.chronicConditions}
            onChange={(e) => setFormData({ ...formData, chronicConditions: e.target.value })}
            placeholder="e.g., Diabetes, Hypertension, Asthma"
            maxLength={1000}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyContactName">Emergency Contact Name</Label>
          <Input
            id="emergencyContactName"
            value={formData.emergencyContactName}
            onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="emergencyContactPhone">Emergency Contact Phone</Label>
          <Input
            id="emergencyContactPhone"
            type="tel"
            value={formData.emergencyContactPhone}
            onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
            maxLength={20}
          />
        </div>
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {patientId ? "Updating..." : "Adding..."}
            </>
          ) : (
            patientId ? "Update Patient" : "Add Patient"
          )}
        </Button>
      </div>
    </form>
  );
};

export default PatientForm;
