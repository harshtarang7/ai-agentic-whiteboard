import { db, users } from "@/db";
import { currentUser } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req:NextRequest) {
        const user =await currentUser()

        if(user){
            const result = await db.select().from(users)
            // @ts-ignore
            .where(eq(user.primaryEmailAddress?.emailAddress , users.email))

            if(result?.length>0){
                return NextResponse.json(result[0]);
            }else{
                const response = await db.insert(users).values({
                    name:user?.firstName,
                    email:user?.primaryEmailAddress?.emailAddress ?? '',
                }).returning();
                return NextResponse.json(result[0]);
            }
        }


        return NextResponse.json({message:'USER not found', status:404})

}