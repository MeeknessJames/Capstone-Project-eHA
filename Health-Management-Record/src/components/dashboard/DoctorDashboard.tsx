import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Heart, Users, Calendar, Activity, LogOut, Search, Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PatientProfile from "./PatientProfile";
import PatientForm from "./PatientForm";

const DoctorDashboard = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null);
  const [deletePatientId, setDeletePatientId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    recentRecords: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load all patients
    const { data: patientsData } = await supabase
      .from("patients")
      .select(`
        *,
        profiles:user_id (
          full_name,
          email,
          phone
        )
      `)
      .order("created_at", { ascending: false });

    setPatients(patientsData || []);

    // Calculate stats
    const totalPatients = patientsData?.length || 0;

    const today = new Date().toISOString().split("T")[0];
    const { data: appointmentsData } = await supabase
      .from("appointments")
      .select("id")
      .gte("appointment_date", today)
      .lt("appointment_date", `${today}T23:59:59`);

    const { data: recordsData } = await supabase
      .from("medical_records")
      .select("id")
      .gte("visit_date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    setStats({
      totalPatients,
      todayAppointments: appointmentsData?.length || 0,
      recentRecords: recordsData?.length || 0,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const handleDeletePatient = async () => {
    if (!deletePatientId) return;

    try {
      const { data: patientData } = await supabase
        .from("patients")
        .select("user_id")
        .eq("id", deletePatientId)
        .single();

      if (patientData) {
        // Delete patient record (cascades to related records via FK)
        await supabase.from("patients").delete().eq("id", deletePatientId);
        
        toast.success("Patient deleted successfully");
        loadData();
      }
    } catch (error) {
      toast.error("Failed to delete patient");
    } finally {
      setDeletePatientId(null);
    }
  };

  const handleEditPatient = (patientId: string) => {
    setEditingPatientId(patientId);
    setShowPatientForm(true);
  };

  const handleAddPatient = () => {
    setEditingPatientId(null);
    setShowPatientForm(true);
  };

  const handleFormSuccess = () => {
    setShowPatientForm(false);
    setEditingPatientId(null);
    loadData();
  };

  const handleFormCancel = () => {
    setShowPatientForm(false);
    setEditingPatientId(null);
  };

  const filteredPatients = patients.filter((patient) => {
    const name = patient.profiles?.full_name?.toLowerCase() || "";
    const email = patient.profiles?.email?.toLowerCase() || "";
    const search = searchTerm.toLowerCase();
    return name.includes(search) || email.includes(search);
  });

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
              <p className="text-sm text-muted-foreground">Doctor Dashboard</p>
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
          <h2 className="text-2xl font-bold">Welcome, Doctor!</h2>
          <p className="text-muted-foreground">Here's an overview of your practice</p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPatients}</div>
              <p className="text-xs text-muted-foreground">Registered in system</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayAppointments}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Recent Records</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.recentRecords}</div>
              <p className="text-xs text-muted-foreground">Added this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Patient Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Patient Management</CardTitle>
                <CardDescription>View and manage all patients</CardDescription>
              </div>
              <Button onClick={handleAddPatient}>
                <Plus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </div>
            <div className="pt-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search patients by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredPatients.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                {searchTerm ? "No patients found" : "No patients registered yet"}
              </p>
            ) : (
              <div className="space-y-3">
                {filteredPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{patient.profiles?.full_name || "N/A"}</h4>
                        <p className="text-sm text-muted-foreground">{patient.profiles?.email}</p>
                        {patient.blood_type && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Blood Type: {patient.blood_type}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedPatientId(patient.id)}
                      >
                        View Details
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditPatient(patient.id)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDeletePatientId(patient.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Patient Profile Dialog */}
      <Dialog open={!!selectedPatientId} onOpenChange={() => setSelectedPatientId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Profile</DialogTitle>
          </DialogHeader>
          {selectedPatientId && <PatientProfile patientId={selectedPatientId} />}
        </DialogContent>
      </Dialog>

      {/* Add/Edit Patient Dialog */}
      <Dialog open={showPatientForm} onOpenChange={setShowPatientForm}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPatientId ? "Edit Patient" : "Add New Patient"}</DialogTitle>
          </DialogHeader>
          <PatientForm
            patientId={editingPatientId || undefined}
            onSuccess={handleFormSuccess}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletePatientId} onOpenChange={() => setDeletePatientId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the patient profile and all associated medical records, appointments, and vaccinations. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePatient} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DoctorDashboard;
