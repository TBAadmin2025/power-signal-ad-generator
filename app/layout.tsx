import { Inter } from "next/font/google";
import "./globals.css";
import Warnings from "./components/warnings";
import { assistantId } from "./assistant-config";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Architect Advisor — The Boss Architect",
  description:
    "Decode premium buyers, architect strategic offers, and build revenue systems with Kendra J. Lewis — Your Fortune 500 Advisor On Demand.",
  icons: {
    icon: "/favicon.ico"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{
          background: "#F9F7F4",
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          overflowX: "hidden"
        }}
      >
        {assistantId ? children : <Warnings />}
      </body>
    </html>
  );
}
