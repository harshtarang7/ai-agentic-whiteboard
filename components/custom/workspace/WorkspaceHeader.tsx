'use client'
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DownloadIcon, Save, Share } from "lucide-react";
import Image from "next/image";
import React from "react";

type Props = {
  selectedTab: any,
  onExport: any
  projectName: string
}
function WorkspaceHeader({ selectedTab, onExport, projectName }: Props) {

  return (
    <div className="p-3 border-b flex justify-between items-center">
      <div className="flex gap-2 items-center">
        <Image src={"/logo.svg"} alt="logo" width={40} height={40} />
        <h2>{projectName}</h2>
      </div>

      {/* {switch} */}
      <div>
        <Tabs defaultValue={"whiteboard"} onValueChange={(value) => selectedTab(value)}>
          <TabsList>
            <TabsTrigger value={"whiteboard"}>Whiteboad</TabsTrigger>
            <TabsTrigger value={"doc"}>Doc</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Extra button  */}
      <div className="flex gap-2">
        <Button ><Save />Save</Button>
        <Button variant={'outline'}><Share />Share</Button>
        <Button variant={'outline'} onClick={onExport}><DownloadIcon />Export</Button>
      </div>
    </div>
  );
}

export default WorkspaceHeader;
