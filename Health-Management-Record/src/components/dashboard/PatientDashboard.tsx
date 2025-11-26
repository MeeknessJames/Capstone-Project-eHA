import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, FileText, Syringe, Calendar, Activity, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const PatientDashboard = () => {
  const navigate = useNavigate();
  const [patient, setPatient] = useState<any>(null);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [vaccinations, setVaccinations] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientData();
  }, []);

  const loadPatientData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    // Load patient profile
    const { data: patientData } = await supabase
      .from("patients")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .eq("user_id", user.id)
      .single();

    if (!patientData) {
      toast.error("Patient profile not found. Please contact your doctor.");
      setLoading(false);
      return;
    }

    setPatient(patientData);

    // Load recent medical records
    const { data: recordsData } = await supabase
      .from("medical_records")
      .select("*")
      .eq("patient_id", patientData.id)
      .order("visit_date", { ascending: false })
      .limit(5);

    setMedicalRecords(recordsData || []);

    // Load upcoming vaccinations
    const { data: vaccinationsData } = await supabase
      .from("vaccinations")
      .select("*")
      .eq("patient_id", patientData.id)
      .order("date_given", { ascending: false })
      .limit(5);

    setVaccinations(vaccinationsData || []);

    // Load upcoming appointments
    const today = new Date().toISOString();
    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select("*")
      .eq("patient_id", patientData.id)
      .gte("appointment_date", today)
      .order("appointment_date", { ascending: true })
      .limit(5);

    setAppointments(appointmentsData || []);

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
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
        <div className="bg-card rounded-xl p-6 shadow-md">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Welcome back, {patient?.profiles?.full_name}!</h2>
              <p className="text-muted-foreground">Here's your health summary</p>
            </div>
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
                        {new Date(record.visit_date).toLocaleDateString()}
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
                        <p className="font-medium">{vaccination.vaccine_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(vaccination.date_given), "MMM dd, yyyy")}
                        </p>
                        {vaccination.next_dose_date && (
                          <p className="text-xs text-muted-foreground">
                            Next dose: {format(new Date(vaccination.next_dose_date), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    </div>
                    <Badge variant={vaccination.status === "completed" ? "default" : "secondary"}>
                      {vaccination.status}
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
                          {format(new Date(appointment.appointment_date), "PPP 'at' p")}
                        </p>
                      </div>
                      <Badge variant={
                        appointment.status === "completed" ? "default" :
                        appointment.status === "cancelled" ? "destructive" :
                        "secondary"
                      }>
                        {appointment.status}
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
    </div>
  );
};

export default PatientDashboard;
