import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/team-chat")({
  component: () => <Navigate to="/chat" />,
});
