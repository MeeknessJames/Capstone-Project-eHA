import { useEffect, useState } from "react";
import { logout, getCurrentUser, getUserData } from "@/integrations/firebase/auth";
import { getAllPatients, searchPatients, deletePatient, getDoctorStats, getUpcomingVaccinations, getUpcomingAppointments } from "@/integrations/firebase/database";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, Users, Calendar, Activity, LogOut, Search, Plus, Pencil, Trash2, FileText, Syringe, Bell } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PatientProfile from "./PatientProfile";
import PatientForm from "./PatientForm";
import MedicalRecordForm from "./MedicalRecordForm";
import VaccinationForm from "./VaccinationForm";
import AppointmentForm from "./AppointmentForm";
import FileUpload from "./FileUpload";

const DoctorDashboard = ({ userId }) => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [editingPatientId, setEditingPatientId] = useState(null);
  const [deletePatientId, setDeletePatientId] = useState(null);
  const [showMedicalRecordForm, setShowMedicalRecordForm] = useState(false);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState(null);
  const [editingVaccinationId, setEditingVaccinationId] = useState(null);
  const [editingAppointmentId, setEditingAppointmentId] = useState(null);
  const [stats, setStats] = useState({
    totalPatients: 0,
    todayAppointments: 0,
    recentRecords: 0,
  });
  const [upcomingVaccinations, setUpcomingVaccinations] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("patients");
  const [doctorName, setDoctorName] = useState("");

  useEffect(() => {
    loadDoctorName();
    loadData();
    loadUpcomingItems();
  }, []);

  const loadDoctorName = async () => {
    try {
      const user = getCurrentUser();
      if (user) {
        const userData = await getUserData(user.uid);
        const name = userData?.fullName || user.displayName || "Doctor";
        setDoctorName(name);
      }
    } catch (error) {
      console.error("Error loading doctor name:", error);
      setDoctorName("Doctor");
    }
  };

  const loadUpcomingItems = async () => {
    const vaccinations = await getUpcomingVaccinations();
    setUpcomingVaccinations(vaccinations);

    const appointments = await getUpcomingAppointments();
    setUpcomingAppointments(appointments);
  };

  const loadData = async () => {
    // Load all patients
    const patientsData = await getAllPatients();
    setPatients(patientsData || []);

    // Load stats
    const statsData = await getDoctorStats();
    setStats(statsData);
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

  const handleDeletePatient = async () => {
    if (!deletePatientId) return;

    try {
      const { success, error } = await deletePatient(deletePatientId);
      
      if (success) {
        toast.success("Patient deleted successfully");
        loadData();
      } else {
        toast.error(error || "Failed to delete patient");
      }
    } catch (error) {
      toast.error("Failed to delete patient");
    } finally {
      setDeletePatientId(null);
    }
  };

  const handleEditPatient = (patientId) => {
    setEditingPatientId(patientId);
    setShowPatientForm(true);
  };

  const handleAddPatient = () => {
    setEditingPatientId(null);
    setShowPatientForm(true);
  };

  const handleAddMedicalRecord = (patientId) => {
    setSelectedPatientId(patientId);
    setEditingRecordId(null);
    setShowMedicalRecordForm(true);
  };

  const handleAddVaccination = (patientId) => {
    setSelectedPatientId(patientId);
    setEditingVaccinationId(null);
    setShowVaccinationForm(true);
  };

  const handleAddAppointment = (patientId) => {
    setSelectedPatientId(patientId);
    setEditingAppointmentId(null);
    setShowAppointmentForm(true);
  };

  const handleFormSuccess = () => {
    setShowPatientForm(false);
    setShowMedicalRecordForm(false);
    setShowVaccinationForm(false);
    setShowAppointmentForm(false);
    setEditingPatientId(null);
    setEditingRecordId(null);
    setEditingVaccinationId(null);
    setEditingAppointmentId(null);
    loadData();
    loadUpcomingItems();
  };

  const handleFormCancel = () => {
    setShowPatientForm(false);
    setShowMedicalRecordForm(false);
    setShowVaccinationForm(false);
    setShowAppointmentForm(false);
    setEditingPatientId(null);
    setEditingRecordId(null);
    setEditingVaccinationId(null);
    setEditingAppointmentId(null);
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadData();
      return;
    }

    const results = await searchPatients(searchTerm);
    setPatients(results);
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        loadData();
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

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
          <h2 className="text-2xl font-bold">Welcome back, {doctorName || "Doctor"}!</h2>
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

        {/* Upcoming Reminders */}
        {(upcomingVaccinations.length > 0 || upcomingAppointments.length > 0) && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>Upcoming Reminders</CardTitle>
              </div>
              <CardDescription>Vaccinations and appointments requiring attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {upcomingVaccinations.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Vaccinations Due Soon</h4>
                    <div className="space-y-2">
                      {upcomingVaccinations.slice(0, 5).map((vacc) => (
                        <div key={vacc.vaccinationId} className="p-2 bg-muted/50 rounded text-sm">
                          <p className="font-medium">{vacc.patientName}</p>
                          <p className="text-muted-foreground">{vacc.vaccineName} - {vacc.daysUntil} days</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {upcomingAppointments.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Upcoming Appointments</h4>
                    <div className="space-y-2">
                      {upcomingAppointments.slice(0, 5).map((appt) => (
                        <div key={appt.appointmentId} className="p-2 bg-muted/50 rounded text-sm">
                          <p className="font-medium">{appt.patientName}</p>
                          <p className="text-muted-foreground">{appt.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Management Tabs */}
        <Card>
          <CardHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="patients">Patients</TabsTrigger>
                <TabsTrigger value="records">Medical Records</TabsTrigger>
                <TabsTrigger value="vaccinations">Vaccinations</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              {/* Patients Tab */}
              <TabsContent value="patients" className="space-y-4">
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
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search patients by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                {patients.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    {searchTerm ? "No patients found" : "No patients registered yet"}
                  </p>
                ) : (
                  <div className="space-y-3">
                    {patients.map((patient) => (
                      <div
                        key={patient.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-primary/10 rounded-full">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{patient.fullName || "N/A"}</h4>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                            {patient.bloodType && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Blood Type: {patient.bloodType}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
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
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddMedicalRecord(patient.id)}
                          >
                            Log Visit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddVaccination(patient.id)}
                          >
                            Add Vaccine
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleAddAppointment(patient.id)}
                          >
                            Schedule Appt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Medical Records Tab */}
              <TabsContent value="records" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Medical Records</CardTitle>
                    <CardDescription>Add and manage patient medical records</CardDescription>
                  </div>
                  {selectedPatientId && (
                    <Button onClick={() => handleAddMedicalRecord(selectedPatientId)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  )}
                </div>
                {!selectedPatientId ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select a patient from the Patients tab to manage their medical records
                  </p>
                ) : (
                  <>
                    <PatientProfile patientId={selectedPatientId} />
                    <FileUpload patientId={selectedPatientId} folder="documents" />
                  </>
                )}
              </TabsContent>

              {/* Vaccinations Tab */}
              <TabsContent value="vaccinations" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Vaccination Management</CardTitle>
                    <CardDescription>Track and manage patient vaccinations</CardDescription>
                  </div>
                  {selectedPatientId && (
                    <Button onClick={() => handleAddVaccination(selectedPatientId)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Vaccination
                    </Button>
                  )}
                </div>
                {!selectedPatientId ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select a patient from the Patients tab to manage their vaccinations
                  </p>
                ) : (
                  <PatientProfile patientId={selectedPatientId} />
                )}
              </TabsContent>

              {/* Appointments Tab */}
              <TabsContent value="appointments" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Appointment Management</CardTitle>
                    <CardDescription>Schedule and manage patient appointments</CardDescription>
                  </div>
                  {selectedPatientId && (
                    <Button onClick={() => handleAddAppointment(selectedPatientId)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Appointment
                    </Button>
                  )}
                </div>
                {!selectedPatientId ? (
                  <p className="text-muted-foreground text-center py-8">
                    Select a patient from the Patients tab to manage their appointments
                  </p>
                ) : (
                  <PatientProfile patientId={selectedPatientId} />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      {/* Patient Profile Dialog */}
      <Dialog open={!!selectedPatientId && activeTab === "patients"} onOpenChange={() => setSelectedPatientId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Profile</DialogTitle>
          </DialogHeader>
          {selectedPatientId && (
            <>
              <PatientProfile patientId={selectedPatientId} />
              <div className="mt-4 flex gap-2">
                <Button onClick={() => { setActiveTab("records"); setSelectedPatientId(selectedPatientId); }}>
                  <FileText className="h-4 w-4 mr-2" />
                  Medical Records
                </Button>
                <Button onClick={() => { setActiveTab("vaccinations"); setSelectedPatientId(selectedPatientId); }}>
                  <Syringe className="h-4 w-4 mr-2" />
                  Vaccinations
                </Button>
                <Button onClick={() => { setActiveTab("appointments"); setSelectedPatientId(selectedPatientId); }}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Appointments
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Medical Record Form Dialog */}
      <Dialog open={showMedicalRecordForm} onOpenChange={setShowMedicalRecordForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRecordId ? "Edit Medical Record" : "Add Medical Record"}</DialogTitle>
          </DialogHeader>
          {selectedPatientId && (
            <MedicalRecordForm
              patientId={selectedPatientId}
              recordId={editingRecordId || undefined}
              initialData={null}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Vaccination Form Dialog */}
      <Dialog open={showVaccinationForm} onOpenChange={setShowVaccinationForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingVaccinationId ? "Edit Vaccination" : "Add Vaccination"}</DialogTitle>
          </DialogHeader>
          {selectedPatientId && (
            <VaccinationForm
              patientId={selectedPatientId}
              vaccinationId={editingVaccinationId || undefined}
              initialData={null}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Appointment Form Dialog */}
      <Dialog open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingAppointmentId ? "Edit Appointment" : "Schedule Appointment"}</DialogTitle>
          </DialogHeader>
          {selectedPatientId && (
            <AppointmentForm
              patientId={selectedPatientId}
              appointmentId={editingAppointmentId || undefined}
              initialData={null}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          )}
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
