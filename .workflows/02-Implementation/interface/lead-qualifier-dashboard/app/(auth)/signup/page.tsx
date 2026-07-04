"use client";

import { useState } from "react";
import Link from "next/link";

import { validateSignupForm } from "@/lib/auth-form-model";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/sonner";

export default function SignupPage() {
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const result = validateSignupForm({
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
    });
    setErrors(result.errors);
    if (result.success) {
      toast("La création de compte arrive bientôt", {
        description: "Flinty est en cours de lancement — laissez-nous vos coordonnées via la page contact d'ici là.",
      });
    }
  }

  return (
    <div>
      <h1 className="font-flinty text-2xl text-foreground">Créer un compte</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Lancez votre première campagne en quinze minutes.
      </p>
      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-foreground">
            Nom
          </label>
          <Input id="name" name="name" type="text" placeholder="Thomas Callendreau" autoComplete="name" />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-foreground">
            Email professionnel
          </label>
          <Input id="email" name="email" type="email" placeholder="vous@entreprise.fr" autoComplete="email" />
          {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
        </div>
        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-foreground">
            Mot de passe
          </label>
          <Input id="password" name="password" type="password" autoComplete="new-password" />
          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
        </div>
        <Button type="submit" className="w-full">
          Créer mon compte
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Essai gratuit · Sans carte bancaire · Annulation en 1 clic
        </p>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  );
}
