"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function CadastroRecusadoSignOut() {
  const router = useRouter();
  return (
    <Button
      className="w-full"
      variant="secondary"
      onClick={async () => {
        await fetch("/auth/signout?next=/login", { method: "POST" });
        router.push("/login");
        router.refresh();
      }}
    >
      Sair da conta
    </Button>
  );
}
