import "./globals.css";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  <html lang="en" className="font-sans">
      <body className="bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}