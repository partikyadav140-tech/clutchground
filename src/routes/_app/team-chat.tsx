import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/team-chat')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/team-chat"!</div>
}
