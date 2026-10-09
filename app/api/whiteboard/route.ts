import { db, WhiteboardData } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
     const { projectId, elements, files, appState } = await req.json();
  const user = await currentUser();
  console.log(projectId)

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
          updatedAt:new Date()
        },
      });

    return NextResponse.json(result);
  }

  return NextResponse.json("Project Information missing!");
  } catch (error) {
    console.log(error)
  }
 
}
