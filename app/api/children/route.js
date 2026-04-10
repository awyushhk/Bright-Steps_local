import { getAuthUser } from '@/lib/auth';
import { getChildrenByParent, addChild } from '@/lib/queries';

export async function GET() {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const children = await getChildrenByParent(user.id);
  return Response.json(children, {
    headers: {
      'Cache-Control': 'private, max-age=10, stale-while-revalidate=30',
    },
  });
}

export async function POST(request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, dateOfBirth, gender } = body;

  if (!name || !dateOfBirth || !gender) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const child = await addChild({ parentId: user.id, name, dateOfBirth, gender });
  return Response.json(child, { status: 201 });
}