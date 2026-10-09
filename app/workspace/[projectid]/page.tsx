"use client";
import SmartDocument from "@/components/custom/workspace/SmartDocument";
import Whiteboard from "@/components/custom/workspace/Whiteboard";
import WorkspaceHeader from "@/components/custom/workspace/WorkspaceHeader";
import { useState } from "react";

function Workspace() {
  const [activeTab, setActiveTab] = useState("whiteboard");

  return (
    <div>
      <WorkspaceHeader selectedTab={(value: string) => setActiveTab(value)} />

      {activeTab === "whiteboard" ? <Whiteboard /> : <SmartDocument />}
    </div>
  );
}

export default Workspace;
