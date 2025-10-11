export default function DashboardPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-3.5rem)]">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Welcome to iPaaS Manager</h1>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Select an iPaaS service from the top menu to get started with managing your integrations.
        </p>
      </div>
    </div>
  )
}
