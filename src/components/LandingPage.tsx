import React from "react";

import { Heart } from "lucide-react";

const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold">Invitaciones Virtuales</h1>
        <p className="text-muted-foreground text-sm max-w-xs mx-auto">
          Plataforma de invitaciones digitales para bodas y eventos especiales.
        </p>
        <p className="text-xs text-muted-foreground">
          Accede a tu invitación con el enlace personalizado que recibiste.
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
