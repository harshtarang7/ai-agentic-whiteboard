"use client";
import { toast } from "@/components/ui/toast";
// import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import axios from "axios";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import "./whiteboard.css";
import { ArrowRight, Circle, Diamond, Eraser, Hand, Icon, Image, Minus, MousePointer2, Pencil, Square, Type } from "lucide-react";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";

const tools = [
  {
    name: "selection",
    icon: MousePointer2,
    color: "text-blue-600",
  },
  {
    name: "hand",
    icon: Hand,
    color: "text-cyan-600",
  },
  {
    name: "rectangle",
    icon: Square,
    color: "text-blue-600",
  },
  {
    name: "diamond",
    icon: Diamond,
    color: "text-emerald-600",
  },
  {
    name: "ellipse",
    icon: Circle,
    color: "text-amber-600",
  },
  {
    name: "arrow",
    icon: ArrowRight,
    color: "text-violet-600",
  },
  {
    name: "line",
    icon: Minus,
    color: "text-pink-600",
  },
  {
    name: "freedraw",
    icon: Pencil,
    color: "text-orange-600",
  },
  {
    name: "text",
    icon: Type,
    color: "text-indigo-600",
  },
  {
    name: "image",
    icon: Image,
    color: "text-green-600",
  },
  {
    name: "eraser",
    icon: Eraser,
    color: "text-purple-600",
  },
];

const Excalidraw = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => <p>Loading whiteboard...</p>,
  },
);

function Whiteboard() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawImperativeAPI|null>(null);
  const [activeTool,setActiveTool] = useState('selection');
  const saveTimeRef = useRef<any>(null);
  const isSavingRef = useRef(false);
  const { projectid } = useParams<{ projectid: string }>();
  console.log(projectid);

  const saveCanvasChanges = useCallback(
    async (elements: readonly any[], appState: any, files: any) => {
      if (isSavingRef.current) return;

      isSavingRef.current = true;
      try {
        await axios.post("/api/whiteboard", {
          elements,
          appState,
          files,
          projectId: projectid,
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
      } finally {
        isSavingRef.current = false;
      }
    },
    [projectid],
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
    [saveCanvasChanges],
  );

  const changeTool = (tool:any)=>{
    if(!excalidrawAPI) return ;

    setActiveTool(tool)
    excalidrawAPI.setActiveTool({
      type:tool
    })
  }

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

      <div className="absolute left-4 top-1/2 z-50 -translate-y-1/2 flex flex-col gap-1 rounded-2xl bg-white border p-1.5 shadow-xl">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button className={` flex h-10 w-10 items-center justify-center rounded-xl transition
            hover:bg-primary/10 hover:cursor-pointer
            ${activeTool === tool.name?"bg-primary/10":null}
            `}
            onClick={()=>changeTool(tool.name)}
            >
              <Icon size={19} className={tool.color} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default Whiteboard;
