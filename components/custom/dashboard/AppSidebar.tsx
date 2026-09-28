"use client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { useUser } from "@clerk/nextjs";
import { Archive, Files, Settings, Sparkle, UserRound } from "lucide-react";
import Image from "next/image";
import { usePathname } from "next/navigation";

export function AppSidebar() {
  const path = usePathname();
  const { user } = useUser();
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Image src={"/logo.svg"} alt="logo" width={40} height={40} />
          <h2 className="text-xl font-bold">Whizboard</h2>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <Button>+ Create New Board</Button>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>My Boards</SidebarGroupLabel>
          <SidebarMenuButton className="p-5" isActive={path === "/dashboard"}>
            <Files />
            <span>All Files</span>
          </SidebarMenuButton>
          <SidebarMenuButton
            className="p-5 my-2"
            isActive={path === "/shared-files"}
          >
            <UserRound />
            <span>Shared</span>
          </SidebarMenuButton>
          <SidebarMenuButton className="p-5" isActive={path === "/archived"}>
            <Archive />
            <span>Archive</span>
          </SidebarMenuButton>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Others</SidebarGroupLabel>
          <SidebarMenuButton className="p-5" isActive={path === "/ai"}>
            <Sparkle />
            <span>AI Helper</span>
          </SidebarMenuButton>
          <SidebarMenuButton
            className="p-5 my-2"
            isActive={path === "/settings"}
          >
            <Settings />
            <span>Settings</span>
          </SidebarMenuButton>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 my-3 border rounded-md">
          <h2 className="text-sm flex justify-between mb-1">
            {" "}
            2 files created <span>total 3</span>
          </h2>
          <Progress value={66} className={"h-2 mt-2"} />
        </div>
        <div className="flex items-center gap-2 p-4 border rounded-md">
          <Image
            src={user?.imageUrl ?? ""}
            alt="image"
            width={40}
            height={40}
            className="rounded-full"
          />
          <h2>
            {user?.firstName} {user?.lastName}
          </h2>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
