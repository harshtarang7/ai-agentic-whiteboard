"use client";
import SmartDocument from "@/components/custom/workspace/SmartDocument";
import Whiteboard from "@/components/custom/workspace/Whiteboard";
import WorkspaceHeader from "@/components/custom/workspace/WorkspaceHeader";
import { exportToBlob } from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import axios from "axios";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ExcalidrawInitialDataState } from "@excalidraw/excalidraw/types";

function Workspace() {
  const [activeTab, setActiveTab] = useState("whiteboard");
  const [api, setApi] = useState<ExcalidrawImperativeAPI | null>(null)
  const [initialData, setInitialData] = useState<ExcalidrawInitialDataState | null>(null)
  const [projectName, setProjectName] = useState('')
  console.log('name', projectName)
  const [loading, setLoading] = useState(true)

  const { projectid } = useParams();

  useEffect(() => {
    projectid && api && GetWhiteboardData();
  }, [projectid, api])

  const GetWhiteboardData = async () => {
    // setLoading(true)
    const result = await axios.get('/api/projects?projectId=' + projectid)
    console.log('resulttt', result)
    if (result.data?.projectName) {
      setProjectName(result.data.projectName)
    }
    api?.updateScene({
      elements: result.data.elements || [],
      appState: normalizeAppState(result.data.appState || {})
    })

    if (result.data.files) {
      api?.addFiles(
        Object.values(result.data.files)
      )
    }
    // setLoading(false)

  }

  const normalizeAppState = (appState: any) => {
    return {
      ...appState,
      collaborators: new Map()
    }
  }

  const handleExportImage = async () => {
    if (!api) return;

    const blob = await exportToBlob({
      elements: api.getSceneElements(),
      appState: {
        ...api.getAppState(),
        exportBackground: true,
      },
      files: api.getFiles(),
      mimeType: 'image/png',
      quality: 1

    })
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'whiteboard.png'
    link.click();

    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <WorkspaceHeader
        selectedTab={(value: string) => setActiveTab(value)}
        onExport={() => handleExportImage()}
        projectName={projectName}
      />

      {/* {loading ? (
        <div style={{ height: '90vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>Loading whiteboard...</p>
        </div>
      ) :  */}
      {activeTab === "whiteboard" ? <Whiteboard
        onApiReady={(api) => setApi(api)}
        initialData={initialData}
      /> : <SmartDocument />}
      {/* } */}
    </div>
  );
}

export default Workspace;
