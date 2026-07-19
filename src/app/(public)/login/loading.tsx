import { AuthFormSkeleton } from "@/components/shared/loading-skeleton";

export default function LoginLoading() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-6xl items-center justify-center px-4 py-10 md:px-6">
      <div className="w-full max-w-md">
        <AuthFormSkeleton />
      </div>
    </main>
  );
}
