import "./globals.css";

export const metadata = {
  title: "One-Click Deployment",
  description: "Deploy your web project live in just a few clicks",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
