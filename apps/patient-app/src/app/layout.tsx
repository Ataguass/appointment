import type { Metadata } from "next";
import "./globals.css";
import Navigation from "../components/Navigation";

export const metadata: Metadata = {
  title: "HospitalFlow — Modern Healthcare & OPD Appointments",
  description:
    "Book OPD doctor appointments online with real-time live queue tracking, zero wait times, digital prescriptions, and instant receipts.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
