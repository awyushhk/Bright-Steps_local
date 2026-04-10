import { getAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function DELETE(request, { params }) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { childId } = await params;

  // Make sure the child belongs to this parent
  const rows = await query(
    'SELECT * FROM children WHERE id = $1 AND parent_id = $2',
    [childId, user.id]
  );
  if (rows.length === 0) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  // ON DELETE CASCADE handles screenings automatically, but explicit is fine too
  await query('DELETE FROM screenings WHERE child_id = $1', [childId]);
  await query('DELETE FROM children WHERE id = $1', [childId]);

  return Response.json({ success: true });
}