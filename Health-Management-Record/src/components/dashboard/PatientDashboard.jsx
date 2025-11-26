import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "@/integrations/firebase/auth";
import {
  getPatientByUserId,
  getMedicalRecords,
  getVaccinations,
  getAppointments,
} from "@/integrations/firebase/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, FileText, Syringe, Calendar, Activity, LogOut, User, Pencil, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import PatientProfileForm from "@/components/patient/PatientProfileForm";

const PatientDashboard = ({ userId }) => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [vaccinations, setVaccinations] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showAppointmentDialog, setShowAppointmentDialog] = useState(false);
  const [userDisplayName, setUserDisplayName] = useState("");

  useEffect(() => {
    const user = getCurrentUser();
    if (user?.displayName) {
      setUserDisplayName(user.displayName);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      loadPatientData();
    }
  }, [userId]);

  const loadPatientData = async () => {
    const user = getCurrentUser();
    
    if (!user || !userId) {
      navigate("/auth");
      return;
    }

    // Load patient profile
    const patientData = await getPatientByUserId(userId);

    if (!patientData) {
      toast.error("Patient profile not found. Please contact your doctor.");
      setLoading(false);
      return;
    }

    setPatient(patientData);

    // Load recent medical records
    const recordsData = await getMedicalRecords(userId, 5);
    setMedicalRecords(recordsData || []);

    // Load vaccinations
    const vaccinationsData = await getVaccinations(userId, 5);
    setVaccinations(vaccinationsData || []);

    // Load upcoming appointments
    const appointmentsData = await getAppointments(userId, 5);
    setAppointments(appointmentsData || []);

    setLoading(false);
  };

  const refreshData = async () => {
    await loadPatientData();
  };

  const handleLogout = async () => {
    const { error } = await logout();
    if (error) {
      toast.error(error);
    } else {
      toast.success("Logged out successfully");
      navigate("/");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-teal-light via-background to-medical-blue-light">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">HealthCare Portal</h1>
              <p className="text-sm text-muted-foreground">Patient Dashboard</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Welcome Section */}
        <div className="bg-card rounded-xl p-6 shadow-md flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome back, {patient?.fullName || userDisplayName || "Patient"}!</h2>
              <p className="text-muted-foreground">Here's your health summary</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => setShowProfileForm(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowAppointmentDialog(true)}>
              <CalendarDays className="h-4 w-4 mr-2" />
              View Next Appointment
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Medical Records</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{medicalRecords.length}</div>
              <p className="text-xs text-muted-foreground">Total visits recorded</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Vaccinations</CardTitle>
              <Syringe className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{vaccinations.length}</div>
              <p className="text-xs text-muted-foreground">Vaccines received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{appointments.length}</div>
              <p className="text-xs text-muted-foreground">Scheduled appointments</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Medical Records */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Medical Records</CardTitle>
            <CardDescription>Your latest medical visits and diagnoses</CardDescription>
          </CardHeader>
          <CardContent>
            {medicalRecords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No medical records yet</p>
            ) : (
              <div className="space-y-4">
                {medicalRecords.map((record) => (
                  <div key={record.id} className="border-l-4 border-primary pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-semibold">{record.diagnosis}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{record.symptoms}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          <span className="font-medium">Treatment:</span> {record.treatment}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {record.visitDate?.toDate ? format(record.visitDate.toDate(), "MMM dd, yyyy") : "N/A"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vaccination Records */}
        <Card>
          <CardHeader>
            <CardTitle>Vaccination History</CardTitle>
            <CardDescription>Your immunization records</CardDescription>
          </CardHeader>
          <CardContent>
            {vaccinations.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No vaccination records yet</p>
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
                          {vaccination.dateGiven?.toDate ? format(vaccination.dateGiven.toDate(), "MMM dd, yyyy") : "N/A"}
                        </p>
                        {vaccination.nextDoseDate && (
                          <p className="text-xs text-muted-foreground">
                            Next dose: {vaccination.nextDoseDate?.toDate ? format(vaccination.nextDoseDate.toDate(), "MMM dd, yyyy") : "N/A"}
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

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Appointments</CardTitle>
            <CardDescription>Your scheduled visits</CardDescription>
          </CardHeader>
          <CardContent>
            {appointments.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No upcoming appointments</p>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment) => (
                  <div key={appointment.id} className="p-4 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold">{appointment.reason}</h4>
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
      </main>

      {/* Profile Dialog */}
      <Dialog open={showProfileForm} onOpenChange={setShowProfileForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden [&>button]:z-10">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Update Personal Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and medical details. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto min-h-0 -mx-6 px-6">
            <PatientProfileForm
              patient={patient}
              userId={userId}
              onSuccess={() => {
                setShowProfileForm(false);
                refreshData();
              }}
              onCancel={() => setShowProfileForm(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Next Appointment Dialog */}
      <Dialog open={showAppointmentDialog} onOpenChange={setShowAppointmentDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Your Next Appointment</DialogTitle>
            <DialogDescription>
              View details about your upcoming appointment with your doctor.
            </DialogDescription>
          </DialogHeader>
          {appointments.length === 0 ? (
            <p className="text-muted-foreground">You currently do not have any upcoming appointments scheduled.</p>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Here are the details of your next appointment.</p>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{appointments[0].reason || "General Consultation"}</span>
                  <Badge>{appointments[0].status || "scheduled"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {appointments[0].appointmentDate?.toDate
                    ? format(appointments[0].appointmentDate.toDate(), "PPP 'at' p")
                    : "Date not available"}
                </p>
                {appointments[0].notes && <p className="text-sm">{appointments[0].notes}</p>}
                <p className="text-xs text-muted-foreground">
                  Need changes? Contact your healthcare provider or clinic staff.
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientDashboard;
