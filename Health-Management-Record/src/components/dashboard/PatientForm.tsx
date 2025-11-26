import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

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

interface PatientFormProps {
  patientId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const PatientForm = ({ patientId, onSuccess, onCancel }: PatientFormProps) => {
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
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    try {
      const { data: patientData } = await supabase
        .from("patients")
        .select(`
          *,
          profiles!patients_user_id_fkey (
            full_name,
            email,
            phone,
            date_of_birth,
            gender,
            address
          )
        `)
        .eq("id", patientId)
        .single();

      if (patientData) {
        const profile = patientData.profiles as any;
        setFormData({
          email: profile?.email || "",
          fullName: profile?.full_name || "",
          phone: profile?.phone || "",
          dateOfBirth: profile?.date_of_birth || "",
          gender: profile?.gender || "",
          address: profile?.address || "",
          bloodType: patientData.blood_type || "",
          allergies: patientData.allergies?.join(", ") || "",
          chronicConditions: patientData.chronic_conditions?.join(", ") || "",
          emergencyContactName: patientData.emergency_contact_name || "",
          emergencyContactPhone: patientData.emergency_contact_phone || "",
        });
      }
    } catch (error) {
      toast.error("Failed to load patient data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const validation = patientSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
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
        const { data: patientData } = await supabase
          .from("patients")
          .select("user_id")
          .eq("id", patientId)
          .single();

        if (patientData) {
          // Update profile
          await supabase
            .from("profiles")
            .update({
              full_name: formData.fullName,
              email: formData.email,
              phone: formData.phone || null,
              date_of_birth: formData.dateOfBirth || null,
              gender: formData.gender || null,
              address: formData.address || null,
            })
            .eq("id", patientData.user_id);

          // Update patient data
          await supabase
            .from("patients")
            .update({
              blood_type: formData.bloodType || null,
              allergies: formData.allergies ? formData.allergies.split(",").map(a => a.trim()) : null,
              chronic_conditions: formData.chronicConditions ? formData.chronicConditions.split(",").map(c => c.trim()) : null,
              emergency_contact_name: formData.emergencyContactName || null,
              emergency_contact_phone: formData.emergencyContactPhone || null,
            })
            .eq("id", patientId);

          toast.success("Patient updated successfully");
        }
      } else {
        // Create new patient - first create user account
        const tempPassword = Math.random().toString(36).slice(-8) + "A1!";
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: tempPassword,
          options: {
            data: {
              full_name: formData.fullName,
            },
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });

        if (authError) {
          toast.error(authError.message);
          setLoading(false);
          return;
        }

        if (authData.user) {
          // Update profile with additional data
          await supabase
            .from("profiles")
            .update({
              phone: formData.phone || null,
              date_of_birth: formData.dateOfBirth || null,
              gender: formData.gender || null,
              address: formData.address || null,
            })
            .eq("id", authData.user.id);

          // Create patient record
          await supabase.from("patients").insert({
            user_id: authData.user.id,
            blood_type: formData.bloodType || null,
            allergies: formData.allergies ? formData.allergies.split(",").map(a => a.trim()) : null,
            chronic_conditions: formData.chronicConditions ? formData.chronicConditions.split(",").map(c => c.trim()) : null,
            emergency_contact_name: formData.emergencyContactName || null,
            emergency_contact_phone: formData.emergencyContactPhone || null,
          });

          // Assign patient role
          await supabase.from("user_roles").insert({
            user_id: authData.user.id,
            role: "patient",
          });

          toast.success("Patient added successfully");
        }
      }

      onSuccess();
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
