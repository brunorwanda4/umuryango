import Link from "next/link";

const AppFooter = () => {
  return (
    <footer className="mt-12 -mx-4 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border py-4 text-xs text-muted-foreground">
      <Link href="/" className="hover:text-foreground transition-colors">
        <span className="font-medium text-foreground">Rwanda Family</span>
        <span> — Money Management</span>
      </Link>
      <Link href="http://bruno-rwanda.vercel.app" className="hover:text-foreground transition-colors">
        <span>Developed by </span>
        <span className="font-medium text-foreground">Rwanda Bruno</span>
      </Link>
    </footer>
  );
};

export default AppFooter;
