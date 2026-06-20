import { useMemo } from "react";

type PasswordStrengthProps = {
  password: string;
};

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: "Weak", color: "bg-red-500" };
  if (score <= 2) return { score, label: "Fair", color: "bg-orange-500" };
  if (score <= 3) return { score, label: "Good", color: "bg-yellow-500" };
  if (score <= 4) return { score, label: "Strong", color: "bg-green-500" };
  return { score, label: "Very Strong", color: "bg-emerald-500" };
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = useMemo(() => getStrength(password), [password]);

  if (!password) return null;

  return (
    <div className="space-y-1">
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
              i < strength.score ? strength.color : "bg-muted"
            }`}
          />
        ))}
      </div>
      <p
        className={`text-[10px] font-bold ${
          strength.score <= 1
            ? "text-red-500"
            : strength.score <= 2
              ? "text-orange-500"
              : strength.score <= 3
                ? "text-yellow-500"
                : "text-emerald-500"
        }`}
      >
        {strength.label}
      </p>
    </div>
  );
}
