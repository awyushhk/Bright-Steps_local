import { getAuthUser } from '@/lib/auth';
import { getScreeningById, getScreeningWithChild, updateScreening } from '@/lib/queries';

export async function GET(request, { params }) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { screeningId } = await params;

  // Use JOIN query so clinician gets child info too
  const screening = await getScreeningWithChild(screeningId);
  if (!screening) return Response.json({ error: 'Not found' }, { status: 404 });

  return Response.json(screening, {
    headers: { 'Cache-Control': 'private, max-age=10, stale-while-revalidate=30' },
  });
}

export async function PATCH(request, { params }) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { screeningId } = await params;
  const body = await request.json();
  await updateScreening(screeningId, body);
  return Response.json({ success: true });
}