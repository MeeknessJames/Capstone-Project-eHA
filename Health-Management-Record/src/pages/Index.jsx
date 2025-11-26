import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Heart, Shield, Users, Activity } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-teal-light via-background to-medical-blue-light">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <span className="text-xl font-bold">HealthCare Portal</span>
          </div>
          <Button onClick={() => navigate("/auth")}>Get Started</Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20">
        <div className="text-center max-w-4xl mx-auto space-y-8">
          <div className="inline-block p-4 bg-primary/10 rounded-full mb-6">
            <Heart className="h-16 w-16 text-primary" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Your Health Records,
            <br />
            <span className="text-primary">All in One Place</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Secure, modern health management system for patients and healthcare providers. 
            Track medical records, vaccinations, and appointments with ease.
          </p>

          <div className="flex gap-4 justify-center pt-8">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Access Portal
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/auth")}>
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24">
          <div className="bg-card p-8 rounded-xl shadow-lg text-center">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Secure & Private</h3>
            <p className="text-muted-foreground">
              Your health data is protected with enterprise-grade security and encryption
            </p>
          </div>

          <div className="bg-card p-8 rounded-xl shadow-lg text-center">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">For Everyone</h3>
            <p className="text-muted-foreground">
              Built for both patients and healthcare providers to manage records efficiently
            </p>
          </div>

          <div className="bg-card p-8 rounded-xl shadow-lg text-center">
            <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
              <Activity className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold mb-3">Real-time Updates</h3>
            <p className="text-muted-foreground">
              Access your medical history, vaccinations, and appointments anytime, anywhere
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;

