"use client";
import { toast } from "@/components/ui/toast";
// import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import axios from "axios";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => <p>Loading whiteboard...</p>,
  },
);

function Whiteboard() {
  const [excalidrawAPI, setExcalidrawAPI] = useState(false);
  const saveTimeRef = useRef<any>(null);
  const isSavingRef = useRef(false);
  const { projectid } = useParams<{ projectid: string }>();
  console.log(projectid)

  const saveCanvasChanges = useCallback(
    async (elements: readonly any[], appState: any, files: any) => {
       if (isSavingRef.current) return;

    isSavingRef.current = true;
      try {
        await axios.post("/api/whiteboard", {
          elements,
          appState,
          files,
          projectId:projectid,
        });

        toast.add({
          title: "Changes saved",
          type: "success",
        });
      } catch (error) {
        console.error("Failed to save whiteboard:", error);

        toast.add({
          title: "Failed to save changes",
          type: "error",
        });
      }finally {
      isSavingRef.current = false;
    }
    },
    [projectid]
  );

   const handleCanvasChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (saveTimeRef.current) {
        clearTimeout(saveTimeRef.current);
      }

      saveTimeRef.current = setTimeout(() => {
        void saveCanvasChanges(elements, appState, files);
      }, 2000);
    },
    [saveCanvasChanges]
  );


  useEffect(() => {
    return () => {
      if (saveTimeRef.current) {
        clearTimeout(saveTimeRef.current);
      }
    };
  }, []);
  return (
    <div style={{ height: "90vh" }}>
      <Excalidraw
        // @ts-ignore
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleCanvasChange}
      />
    </div>
  );
}

export default Whiteboard;
