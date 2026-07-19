import { SubjectDetailView } from "@/components/subjects/subject-detail-view";

type SubjectDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SubjectDetailPage({ params }: SubjectDetailPageProps) {
  const { id } = await params;
  return <SubjectDetailView subjectId={id} />;
}
