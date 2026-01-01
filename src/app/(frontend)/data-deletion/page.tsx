export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Data Deletion Instructions</h1>

        <div className="space-y-4">
          <p>
            If you signed up for Kaka Malem using Facebook Login and want to delete your data,
            please follow these steps:
          </p>

          <ol className="list-decimal list-inside space-y-2">
            <li>
              Log in to your Kaka Malem account at{' '}
              <a href="/auth/login" className="text-primary underline">
                kakamalem.com/auth/login
              </a>
            </li>
            <li>Go to your account settings</li>
            <li>Click on "Delete Account"</li>
            <li>Confirm the deletion</li>
          </ol>

          <p>
            Alternatively, you can email us at{' '}
            <a href="mailto:kakamalem.team@gmail.com" className="text-primary underline">
              kakamalem.team@gmail.com
            </a>{' '}
            with your account email and request data deletion. We will process your request within
            30 days.
          </p>

          <p className="text-muted-foreground text-sm">
            When you delete your account, all your personal data including profile information,
            stores, products, and orders will be permanently removed from our systems.
          </p>
        </div>
      </div>
    </div>
  )
}
