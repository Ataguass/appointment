import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HospitalFlow — Book Your Appointment",
  description:
    "Book OPD appointments online. Find doctors, see real-time availability, and manage your appointments with ease.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
