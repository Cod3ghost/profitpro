import { cn } from "@/lib/utils";

const Logo = ({ className }: { className?: string }) => (
  <svg
    className={cn("text-primary", className)}
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>ProfitPro Logo</title>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
    <path d="M12 18v-1m0-10V6" />
    <path d="M16 12h-1m-6 0H8" />
    <path d="m15 15-1-1" />
    <path d="m9 9-1-1" />
    <path d="m15 9 1-1" />
    <path d="m9 15-1 1" />
  </svg>
);

export default Logo;
