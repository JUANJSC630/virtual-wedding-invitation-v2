import React from "react";

import { Heart, LogIn } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-8 p-8">
      <div className="text-center space-y-4 max-w-sm">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold">Invitaciones Virtuales</h1>
        <p className="text-muted-foreground text-sm">
          Plataforma de invitaciones digitales para bodas y eventos especiales.
        </p>
        <p className="text-xs text-muted-foreground">
          Si eres invitado, accede con el enlace personalizado que recibiste.
        </p>
      </div>

      <Button onClick={() => navigate("/login")} className="flex items-center gap-2">
        <LogIn className="h-4 w-4" />
        Iniciar sesión
      </Button>
    </div>
  );
};

export default LandingPage;
