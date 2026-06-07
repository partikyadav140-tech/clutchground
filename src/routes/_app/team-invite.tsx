import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/team-invite')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/team-invite"!</div>
}
