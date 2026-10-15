import { db, projects, WhiteboardData } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const projectId = req.nextUrl.searchParams.get('projectId');

  if (!projectId) {
    return NextResponse.json({ error: "Project ID missing" });
  }

  const result = await db
    .select()
    .from(WhiteboardData)
    .where(eq(WhiteboardData.projectId, projectId));

  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.projectId, projectId));

  return NextResponse.json({
    ...(result[0] ?? {}),
    projectName: project[0]?.projectName,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, elements, files, appState } = await req.json();
    const user = await currentUser();

    if (!user) {
      return NextResponse.json("Unauthorized user");
    }

    if (projectId) {
      const result = await db
        .insert(WhiteboardData)
        .values({
          projectId: projectId,
          elements: elements,
          appState: appState,
          files: files,
        })
        .onConflictDoUpdate({
          target: WhiteboardData.projectId,
          set: {
            elements: elements,
            appState: appState,
            files: files,
            updatedAt: new Date()
          },
        });

      return NextResponse.json(result);
    }

    return NextResponse.json("Project Information missing!");
  } catch (error) {
    console.log(error)
  }
}

