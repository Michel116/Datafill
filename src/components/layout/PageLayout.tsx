
import type { ReactNode } from 'react';
import Link from 'next/link';
import AppLogo from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { ListOrdered } from 'lucide-react';

interface PageLayoutProps {
  children: ReactNode;
  pageTitle?: string; 
}

export default function PageLayout({ children, pageTitle }: PageLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 sm:gap-4"> {/* Group Logo and Records link */}
            <AppLogo />
            <Link href="/records" legacyBehavior passHref>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-primary px-2 sm:px-3">
                <ListOrdered className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Журнал</span>
              </Button>
            </Link>
          </div>
          {pageTitle && <h1 className="text-sm sm:text-lg font-medium text-muted-foreground truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs md:max-w-sm lg:max-w-md text-right">{pageTitle}</h1>}
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-card p-4 sm:p-6 md:p-8 rounded-xl shadow-lg"> {/* Increased max-w for records page */}
          {children}
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground border-t">
        © {new Date().getFullYear()} DataFill. Все права защищены.
      </footer>
    </div>
  );
}

    