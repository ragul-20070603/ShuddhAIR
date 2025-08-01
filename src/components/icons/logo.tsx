export function Logo(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22c-2 0-4-1-5-2.5-1.4-2.2-1.2-5.2.5-7.5C10 9.7 13.5 8 16 8s5 1.7 6.5 4c1.7 2.3 1.9 5.3.5 7.5-1 1.5-3 2.5-5 2.5z" />
      <path d="M12 22V8" />
      <path d="M16 8a4 4 0 1 0-8 0" />
      <path d="M12 8h.01" />
    </svg>
  );
}
