"use client";

import { useState } from "react";
import Link from "next/link";

import { validateLoginForm } from "@/lib/auth-form-model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

export default function LoginPage() {
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = validateLoginForm({
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    setErrors(result.errors);
    if (result.success) {
      toast("La connexion arrive bientôt", {
        description: "Flinty est en cours de lancement — la création de compte ouvre très prochainement.",
      });
    }
  }

  return (
    <div>
      <h1 className="font-flinty text-2xl text-foreground">Connexion</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ravi de vous revoir sur Flinty.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <Input id="email" name="email" type="email" placeholder="vous@entreprise.fr" autoComplete="email" />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <Input id="password" name="password" type="password" autoComplete="current-password" />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <Button type="submit" className="w-full">
          Se connecter
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Créer un compte
        </Link>
      </p>
    </div>
  );
}
