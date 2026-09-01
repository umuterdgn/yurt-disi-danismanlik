import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import StudentSidebar from '@/components/student/student-sidebar';

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <StudentSidebar />
      <main className="flex-1 ml-64 p-4 md:p-8 w-full max-w-full">
        {children}
      </main>
    </div>
  );
}
