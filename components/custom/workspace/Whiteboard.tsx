"use client";
import { toast } from "@/components/ui/toast";
// import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import axios from "axios";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import "./whiteboard.css";
import {
  ArrowRight,
  Circle,
  Diamond,
  Eraser,
  Hand,
  Image,
  Minus,
  MousePointer2,
  Pencil,
  Sparkles,
  Square,
  Type,
} from "lucide-react";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import FloatingProperties from "./FloatingProperties";
import { Button } from "@/components/ui/button";
import AiFloatingSidebar from "./AiFloatingSidebar";

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

type Props={
  onApiReady:(api:ExcalidrawImperativeAPI)=>void;
}

function Whiteboard({onApiReady}:Props) {
  const [excalidrawAPI, setExcalidrawAPI] =
    useState<ExcalidrawImperativeAPI | null>(null);
  const [activeTool, setActiveTool] = useState("selection");
  const [selectedElement, setSelectedElement] = useState<any>(null);
  const [canvasState, setCanvasState] = useState<any>(null);
  const [showAiSidebar, setShowAiSidebar] = useState(true)

  const saveTimeRef = useRef<any>(null);
  const isSavingRef = useRef(false);
  const lastSavedElementsRef = useRef<string>("");
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
      // Update UI state immediately (no debounce needed — doesn't trigger a save)
      setCanvasState(appState);

      const selectedIds = Object.keys(appState.selectedElementIds || {});
      if (selectedIds?.length === 1) {
        const element = elements.find((el) => el.id === selectedIds[0]);
        setSelectedElement(element ?? null);
      } else {
        setSelectedElement(null);
      }

      // Only save to server when elements actually changed (ignore scroll/zoom/selection)
      const elementsSnapshot = JSON.stringify(
        elements.filter((el) => !el.isDeleted).map((el) => ({ id: el.id, version: el.version }))
      );

      if (elementsSnapshot === lastSavedElementsRef.current) return;

      lastSavedElementsRef.current = elementsSnapshot;

      if (saveTimeRef.current) clearTimeout(saveTimeRef.current);

      saveTimeRef.current = setTimeout(() => {
        void saveCanvasChanges(elements, appState, files);
      }, 2000);
    },
    [saveCanvasChanges],
  );

  const changeTool = (tool: any) => {
    if (!excalidrawAPI) return;

    setActiveTool(tool);
    excalidrawAPI.setActiveTool({
      type: tool,
    });
  };

  useEffect(() => {
    return () => {
      if (saveTimeRef.current) {
        clearTimeout(saveTimeRef.current);
      }
    };
  }, []);

  const getFloatingPosition = () => {
    if (!selectedElement || !canvasState) {
      return { left: 0, top: 0 };
    }

    const zoom = canvasState.zoom.value ?? 1;
    const scrollX = canvasState.scrollX ?? 0;
    const scrollY = canvasState.scrollY ?? 0;

    // center of the selected element
    const centerX = selectedElement.x + selectedElement.width / 2;

    // convert exaclidraw coordinates
    // into browser coordinates
    const screenX = (centerX + scrollX) * zoom;

    const screenY = (selectedElement.y + scrollY) * zoom;

    return {
      left: screenX,
      top: screenY - 60,
    };
  };

  const handlePropertyChange = (property: string, value: any) => {
    if (!excalidrawAPI || !selectedElement) return;

    const element = excalidrawAPI.getSceneElements();

    const updatedElements = element.map((element) => {
      if (element.id != selectedElement.id) {
        return element;
      }

      return {
        ...element,
        [property]: value,
        version: element.version + 1,
        updated: Date.now(),
      };
    });

    excalidrawAPI.updateScene({
      elements: updatedElements,
    });
  };

  const handleDeleteElement = () => {
    if (!excalidrawAPI || !selectedElement) return;

    const elements = excalidrawAPI.getSceneElements();

    const updatedElements = elements.map((element) => {
      if (element.id != selectedElement.id) {
        return {
          ...element,
          isDeleted: true,
          version: element.version + 1,
          updated: Date.now(),

        }
      }

      return element
    })

    excalidrawAPI.updateScene({
      elements: updatedElements,

    })

    setSelectedElement(null)
  }

  const handleDuplicateElement = () => {
    if (!excalidrawAPI || !selectedElement) return;

    const elements = excalidrawAPI.getSceneElements();

    const duplicateElement = {
      ...selectedElement,
      id: crypto.randomUUID(),
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
      seed: Math.floor(Math.random() * 1000000),
      version: 1,
      updated: Date.now(),
      isDeleted: false
    };
    excalidrawAPI.updateScene({
      elements: [...elements, duplicateElement]
    })

  }

  const handleBringFrontBack = (type: string) => {
    if (!excalidrawAPI || !selectedElement) return;
    const elements = excalidrawAPI.getSceneElements();

    const selected = elements.find((element) => element.id === selectedElement.id);
    if (!selected) return;
    const remainingElement = elements.filter((element) => element.id !== selectedElement.id);

    if (type == 'front') {
      excalidrawAPI.updateScene({
        elements: [
          ...remainingElement,
          selected
        ]
      })
    } else {
      excalidrawAPI.updateScene({
        elements: [
          selected,
          ...remainingElement,
        ]
      })
    }

  }

  const floatingPosition = getFloatingPosition();
  return (
    <div style={{ height: "90vh", position: "relative" }}>
      <Excalidraw
        // @ts-ignore
        excalidrawAPI={(api) => {setExcalidrawAPI(api); onApiReady(api)}}
        onChange={handleCanvasChange}
      />

      <div className="absolute left-4 top-1/2 z-50 -translate-y-1/2 flex flex-col gap-1 rounded-2xl bg-white border p-1.5 shadow-xl">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              className={` flex h-10 w-10 items-center justify-center rounded-xl transition
            hover:bg-primary/10 hover:cursor-pointer
            ${activeTool === tool.name ? "bg-primary/10" : null}
            `}
              onClick={() => changeTool(tool.name)}
            >
              <Icon size={19} className={tool.color} />
            </button>
          );
        })}
      </div>

      <FloatingProperties selectedElement={selectedElement} position={floatingPosition}
        onPropertyChange={(property, value) => handlePropertyChange(property, value)}
        onDelete={() => handleDeleteElement()}
        onDuplicate={() => handleDuplicateElement()}
        onBringToFront={() => handleBringFrontBack('front')}
        onSendToBack={() => handleBringFrontBack('back')}

      />

      <div className="absolute right-15 bottom-3 z-50">
        <Button size={'lg'} onClick={() => setShowAiSidebar(!showAiSidebar)}>
          <Sparkles /> AI
        </Button>
      </div>

      {showAiSidebar && <AiFloatingSidebar excalidrawApi={excalidrawAPI} onClose={() => setShowAiSidebar(false)} />}
    </div>
  );
}

export default Whiteboard;
