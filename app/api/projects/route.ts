import { db, projects, WhiteboardData } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { projectName, projectId } = await req.json();
  const user = await currentUser();

  if (!user?.primaryEmailAddress?.emailAddress) {
    return NextResponse.json({ error: "Unauthorized user " });
  }

  if (!projectId || !projectName) {
    return NextResponse.json({ error: "Project Information missing" });
  }

  const res = await db
    .insert(projects)
    .values({
      projectId: projectId,
      projectName: projectName ?? "",
      userEmail: user?.primaryEmailAddress?.emailAddress ?? "",
    })
    .returning();

  return NextResponse.json(res[0]);
}

export async function GET(req: NextRequest) {

  const searchParams = req.nextUrl.searchParams;
  const projectId = searchParams.get('projectId')

  const user = await currentUser();
  console.log('userr', user)
  if (!projectId) {
    return NextResponse.json({ error: "Project Information missing" });
  }

  const userProject = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.projectId, projectId),
        eq(projects.userEmail, user?.primaryEmailAddress?.emailAddress ?? ""),
      ),
    );

  console.log('userprojecttt', userProject)

  if (userProject.length == 0) {
    return NextResponse.json({ error: "Unauthorized user " });
  }

  const result = await db
    .select()
    .from(WhiteboardData)
    .where(eq(WhiteboardData.projectId, projectId));

  console.log('ressssss', result)

  return NextResponse.json({ ...result[0], projectName: userProject[0].projectName });
}
