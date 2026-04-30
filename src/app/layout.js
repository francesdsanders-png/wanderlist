export const metadata = {
  title: 'Map Out',
  description: 'Save and discover places together',
  manifest: '/manifest.json',
  themeColor: '#1A73E8',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Map Out" />
        <meta name="theme-color" content="#1A73E8" />
        <link href="https://fonts.googleapis.com/css2?family=Google+Sans:wght@400;500;700;800&family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#EEF2F7' }}>
        {children}
      </body>
    </html>
  )
}
