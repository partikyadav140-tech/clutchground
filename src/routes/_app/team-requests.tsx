import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/team-requests')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/team-requests"!</div>
}
