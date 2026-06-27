import type { ComponentProps } from "react";

export const GoogleIcon = (props: ComponentProps<"svg">) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" {...props}>
    <path
      fill="#4285F4"
      d="M23.52 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.87Z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.75-2.1-6.69-4.93H1.3v3.09A12 12 0 0 0 12 24Z"
    />
    <path
      fill="#FBBC05"
      d="M5.31 14.32a7.2 7.2 0 0 1 0-4.63V6.6H1.3a12 12 0 0 0 0 10.8l4.01-3.08Z"
    />
    <path
      fill="#EA4335"
      d="M12 4.74c1.76 0 3.34.61 4.58 1.8l3.43-3.43C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.3 6.6l4.01 3.09C6.25 6.84 8.89 4.74 12 4.74Z"
    />
  </svg>
);
