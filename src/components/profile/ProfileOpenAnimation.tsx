import React from "react";

type Props = {
  animationValue?: string;
  children: React.ReactNode;
  onComplete?: () => void;
};

export function ProfileOpenAnimation({ children }: Props) {
  return <>{children}</>;
}

export function AnimationPreview() {
  return null;
}
