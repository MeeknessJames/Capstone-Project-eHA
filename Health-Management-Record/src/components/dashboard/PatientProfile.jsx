import { useEffect, useState } from "react";
import { getPatientByUserId, getMedicalRecords, getVaccinations, getAppointments } from "@/integrations/firebase/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar, Heart, Activity, Syringe, FileText, User, Phone, Mail, MapPin, AlertCircle } from "lucide-react";
import { format } from "date-fns";

const PatientProfile = ({ patientId }) => {
  const [patient, setPatient] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (patientId) {
      loadPatientData();
    }
  }, [patientId]);

  const loadPatientData = async () => {
    setLoading(true);

    // Load patient details
    const patientData = await getPatientByUserId(patientId);
    setPatient(patientData);

    // Load medical records
    const recordsData = await getMedicalRecords(patientId);
    setMedicalRecords(recordsData || []);

    // Load vaccinations
    const vaccinationsData = await getVaccinations(patientId);
    setVaccinations(vaccinationsData || []);

    // Load appointments
    const appointmentsData = await getAppointments(patientId);
    setAppointments(appointmentsData || []);

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Activity className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        Patient not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Patient Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-full">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{patient.fullName}</CardTitle>
                <CardDescription>Patient ID: {patient.id.slice(0, 8)}</CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{patient.email}</span>
            </div>
            {patient.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{patient.phone}</span>
              </div>
            )}
            {patient.dateOfBirth && (
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(patient.dateOfBirth), "MMM dd, yyyy")}
                </span>
              </div>
            )}
            {patient.gender && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm capitalize">{patient.gender}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center gap-2 md:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{patient.address}</span>
              </div>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {patient.bloodType && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Blood Type</p>
                <Badge variant="outline">{patient.bloodType}</Badge>
              </div>
            )}
            {patient.allergies && patient.allergies.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Allergies</p>
                <div className="flex flex-wrap gap-2">
                  {patient.allergies.map((allergy, idx) => (
                    <Badge key={idx} variant="destructive">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {patient.chronicConditions && patient.chronicConditions.length > 0 && (
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-1">Chronic Conditions</p>
                <div className="flex flex-wrap gap-2">
                  {patient.chronicConditions.map((condition, idx) => (
                    <Badge key={idx} variant="secondary">{condition}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {(patient.emergencyContactName || patient.emergencyContactPhone) && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium mb-2">Emergency Contact</p>
                <div className="space-y-1">
                  {patient.emergencyContactName && (
                    <p className="text-sm">{patient.emergencyContactName}</p>
                  )}
                  {patient.emergencyContactPhone && (
                    <p className="text-sm text-muted-foreground">{patient.emergencyContactPhone}</p>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Medical Records */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle>Medical Records</CardTitle>
          </div>
          <CardDescription>Complete medical history and visits</CardDescription>
        </CardHeader>
        <CardContent>
          {medicalRecords.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No medical records yet</p>
          ) : (
            <div className="space-y-4">
              {medicalRecords.map((record) => (
                <div key={record.id} className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{record.diagnosis}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.visitDate?.toDate ? format(record.visitDate.toDate(), "PPP") : "N/A"}
                      </p>
                    </div>
                  </div>
                  {record.symptoms && (
                    <div>
                      <p className="text-sm font-medium">Symptoms:</p>
                      <p className="text-sm text-muted-foreground">{record.symptoms}</p>
                    </div>
                  )}
                  {record.treatment && (
                    <div>
                      <p className="text-sm font-medium">Treatment:</p>
                      <p className="text-sm text-muted-foreground">{record.treatment}</p>
                    </div>
                  )}
                  {record.prescription && (
                    <div>
                      <p className="text-sm font-medium">Prescription:</p>
                      <p className="text-sm text-muted-foreground">{record.prescription}</p>
                    </div>
                  )}
                  {record.notes && (
                    <div>
                      <p className="text-sm font-medium">Notes:</p>
                      <p className="text-sm text-muted-foreground">{record.notes}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vaccinations */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Syringe className="h-5 w-5 text-primary" />
            <CardTitle>Vaccination Records</CardTitle>
          </div>
          <CardDescription>Immunization history and schedule</CardDescription>
        </CardHeader>
        <CardContent>
          {vaccinations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No vaccination records yet</p>
          ) : (
            <div className="space-y-3">
              {vaccinations.map((vaccination) => (
                <div key={vaccination.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-full">
                      <Syringe className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{vaccination.vaccineName}</p>
                      <p className="text-sm text-muted-foreground">
                        Given: {vaccination.dateGiven?.toDate ? format(vaccination.dateGiven.toDate(), "MMM dd, yyyy") : "N/A"}
                      </p>
                      {vaccination.nextDoseDate && (
                        <p className="text-sm text-muted-foreground">
                          Next: {vaccination.nextDoseDate?.toDate ? format(vaccination.nextDoseDate.toDate(), "MMM dd, yyyy") : "N/A"}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={vaccination.status === "completed" ? "default" : "secondary"}>
                    {vaccination.status || "pending"}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appointments */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <CardTitle>Appointments</CardTitle>
          </div>
          <CardDescription>Scheduled and past appointments</CardDescription>
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No appointments scheduled</p>
          ) : (
            <div className="space-y-3">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium">{appointment.reason}</p>
                      <p className="text-sm text-muted-foreground">
                        {appointment.appointmentDate?.toDate ? format(appointment.appointmentDate.toDate(), "PPP 'at' p") : "N/A"}
                      </p>
                    </div>
                    <Badge variant={
                      appointment.status === "completed" ? "default" :
                      appointment.status === "cancelled" ? "destructive" :
                      "secondary"
                    }>
                      {appointment.status || "scheduled"}
                    </Badge>
                  </div>
                  {appointment.notes && (
                    <p className="text-sm text-muted-foreground">{appointment.notes}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PatientProfile;
