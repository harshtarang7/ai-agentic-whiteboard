import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { convertToExcalidrawElements } from "@excalidraw/excalidraw";
import { ExcalidrawImperativeAPI } from "@excalidraw/excalidraw/types";
import axios from "axios";
import { Loader2Icon, Monitor, Network, PencilRuler, Smartphone, Sparkles, Workflow, X } from "lucide-react";
import { useState } from "react";

type Props = {
    excalidrawApi: ExcalidrawImperativeAPI | null;
    onClose: () => void
}
const AiTools = [
    {
        name: "Diagrams",
        desc: "Create visual diagrams",
        icon: <PencilRuler size={16} />,
        color: "text-blue-600",
        bgColor: "bg-blue-50",
        border: 'border-blue-100',
        prompt: `
You are an expert visual diagram generation agent.
Your task is to convert the user's idea into a clear, structured, professional diagram.
Instructions:
Understand the user's intent before generating.
Identify the main entities, concepts, steps, and relationships.
Create a clean visual hierarchy.
Use rectangles for main concepts or processes.
Use diamonds only for decisions.
Use arrows to show relationships or direction.
Keep labels short and readable.
Avoid overlapping elements.
Maintain consistent spacing between elements.
Organize the diagram from left-to-right or top-to-bottom depending on what is easiest to understand.
Add groups or sections when the diagram contains multiple categories.
Prefer simple layouts over overly complex diagrams.
Output only valid Excalidraw-compatible JSON elements.
Do not include markdown, explanations, or additional text outside the JSON.
`
    }, {
        name: "Flowchart",
        desc: "Visualize workflows",
        icon: <Workflow size={16} />,
        color: "text-violet-600",
        bgColor: "bg-violet-50",
        border: 'border-violet-100',
        prompt: `
You are an expert flowchart generation agent.
Convert the user's description into a professional flowchart.
Instructions:
Identify the starting point, actions, decisions, branches, and ending points.
Use rounded rectangles for start and end nodes.
Use rectangles for actions or processes.
Use diamonds for decisions.
Use arrows to connect nodes in the correct logical order.
Label decision arrows clearly, such as "Yes" and "No".
Keep the primary workflow flowing from top to bottom.
Branch secondary flows to the left or right.
Keep node labels concise.
Avoid crossing arrows whenever possible.
Maintain consistent node dimensions and spacing.
Make the flowchart understandable without additional explanation.
If the user's description is incomplete, infer the most logical workflow.
Output only valid Excalidraw-compatible JSON elements.
Do not return markdown or explanatory text.
`
    }, {
        name: "Architecture",
        desc: "Design system architecture",
        icon: <Network size={16} />,
        color: "text-orange-600",
        bgColor: "bg-orange-50",
        border: 'border-orange-100',
        prompt: `
You are a senior software architect and system design visualization agent.
Convert the user's application or system description into a clear system architecture diagram.
Instructions:
Identify clients, frontend applications, backend services, APIs, databases, queues, storage, authentication systems, external services, and infrastructure.
Group related components into logical sections.
Show the direction of data flow using arrows.
Clearly label important connections when useful.
Place users or client applications on the left or top.
Place application services in the center.
Place databases, storage, and infrastructure on the right or bottom.
Place third-party APIs or external services in a separate section.
Use consistent component sizes.
Keep architecture readable and avoid unnecessary implementation details.
Include technologies mentioned by the user as labels.
Infer standard architectural components only when necessary.
Do not invent unnecessary technologies.
Use containers or background sections for Frontend, Backend, Data Layer, AI Services, and External Services when appropriate.
Output only valid Excalidraw-compatible JSON elements.
Do not return markdown, commentary, or explanations.
`
    }, {
        name: "Web Mockup",
        desc: "Generate web wireframes",
        icon: <Monitor size={16} />,
        color: "text-cyan-600",
        bgColor: "bg-cyan-50",
        border: 'border-cyan-100',
        prompt: `
You are an expert product designer and web UI wireframe generation agent.
Convert the user's description into a professional desktop web application wireframe.
Instructions:
Create the interface using simple wireframe-style Excalidraw elements.
Assume a desktop viewport unless the user specifies otherwise.
Identify the main page structure and user goals.
Include relevant UI sections such as:
Navbar or header
Sidebar
Page title
Search
Filters
Cards
Tables
Forms
Buttons
Content panels
Footer
Use rectangles for containers, cards, buttons, images, and input fields.
Use text elements for labels and content.
Maintain strong spacing, alignment, and visual hierarchy.
Use realistic dashboard or SaaS layout conventions.
Keep the design low-fidelity and wireframe oriented.
Do not create decorative artwork unless specifically requested.
Keep the page within a reasonable desktop canvas size.
Group related UI sections visually.
Make important primary actions easy to identify.
Output only valid Excalidraw-compatible JSON elements.
Do not return markdown or explanations.
`
    }, {
        name: "Mobile UI",
        desc: "Generate app wireframes",
        icon: <Smartphone size={16} />,
        color: "text-pink-600",
        bgColor: "bg-pink-50",
        border: 'border-pink-100',
        prompt: `
You are an expert mobile product designer and mobile wireframe generation agent.
Convert the user's app idea into a professional mobile app wireframe.
Instructions:
Design for a standard mobile screen size.
Create a phone frame or clear screen boundary.
Focus on the primary user experience described by the user.
Include relevant mobile UI patterns such as:
App header
Search
Cards
Lists
Forms
Bottom navigation
Floating action buttons
Tabs
Profile sections
Modals or sheets when necessary
Use rectangles for UI containers and controls.
Use text elements for labels.
Maintain consistent padding and spacing.
Use a vertical layout optimized for mobile interaction.
Keep buttons large enough to represent touch-friendly controls.
Keep the design low-fidelity and wireframe focused.
If multiple screens are needed, arrange them horizontally with clear spacing.
Label each screen clearly.
Prioritize usability and simple navigation.
Output only valid Excalidraw-compatible JSON elements.
Do not return markdown, explanations, or commentary.
`
    }
]

const AI_PLACEHOLDER_IDS = {
    container: 'ai-placeholder-container',
    title: 'ai-placeholder-title',
    subtitle: 'ai-placeholder-subtitle',
    skeleton1: 'ai-placeholder-skeleton1',
    skeleton2: 'ai-placeholder-skeleton2',
    skeleton3: 'ai-placeholder-skeleton3',
}

function AiFloatingSidebar({ excalidrawApi, onClose }: Props) {

    const [selectedTool, setSelectedTool] = useState<string>('Diagrams');
    const [selectedType, setSelectedType] = useState(AiTools[0])
    const [userEnteredPrompt, setUserEnteredPrompt] = useState("")
    const [loading, setLoading] = useState(false)
    const AI_PLACEHOLDER = 'ai_generation_placeholder'

    const getEmptyCanvasPosition = () => {
        if (!excalidrawApi) {
            return { x: 100, y: 100 }
        }

        const elements = excalidrawApi.getSceneElements().filter(element => !element.isDeleted)

        if (elements.length === 0) {
            return { x: 100, y: 100 }
        }

        // fnd right most element
        const maxRight = Math.max(...elements.map((element) => element.x + element.width))
        const minTop = Math.min(...elements.map((element) => element.y))

        return {
            x: maxRight + 150,
            y: minTop
        }
    }

    const addAiPlaceholder = () => {
        if (!excalidrawApi) return;

        const position = getEmptyCanvasPosition()
        const placeHolderElements =
            convertToExcalidrawElements([
                {
                    type: 'rectangle',
                    id: AI_PLACEHOLDER_IDS.container,
                    x: position.x,
                    y: position.y,
                    width: 420,
                    height: 250,
                    backgroundColor: '#f5f3ff',
                    strokeColor: '#8b5cf6',
                    fillStyle: 'solid',
                    strokeWidth: 2,
                    roughness: 0,
                    roundness: {
                        type: 3
                    }
                },
                {
                    type: 'text',
                    id: AI_PLACEHOLDER_IDS.title,
                    x: position.x + 28,
                    y: position.y + 28,
                    text: 'Generating With AI',
                    fontSize: 22,
                    strokeColor: '#6d28d9'
                },
                {
                    type: 'text',
                    id: AI_PLACEHOLDER_IDS.subtitle,
                    x: position.x + 28,
                    y: position.y + 65,
                    text: 'Preparing your diagram',
                    fontSize: 15,
                    strokeColor: '#6b7280'
                }, {
                    type: 'rectangle',
                    id: AI_PLACEHOLDER_IDS.skeleton1,
                    x: position.x + 28,
                    y: position.y + 120,
                    width: 200,
                    height: 18,
                    backgroundColor: '#eeecfeff',
                    strokeColor: '#eeecfeff',
                    fillStyle: 'solid',
                    roughness: 0,
                    roundness: {
                        type: 3
                    }
                },

                {
                    type: 'rectangle',
                    id: AI_PLACEHOLDER_IDS.skeleton2,
                    x: position.x + 28,
                    y: position.y + 150,
                    width: 360,
                    height: 18,
                    backgroundColor: '#ede9fe',
                    strokeColor: '#ede9fe',
                    fillStyle: 'solid',
                    roughness: 0,
                    roundness: {
                        type: 3
                    }
                }, {
                    type: 'rectangle',
                    id: AI_PLACEHOLDER_IDS.skeleton3,
                    x: position.x + 28,
                    y: position.y + 185,
                    width: 190,
                    height: 18,
                    backgroundColor: '#ddd6fe',
                    strokeColor: '#ddd6fe',
                    fillStyle: 'solid',
                    roughness: 0,
                    roundness: {
                        type: 3
                    }
                }

            ])

        const currentElements = excalidrawApi.getSceneElements();

        excalidrawApi.updateScene({
            elements: [...currentElements, ...placeHolderElements],
        })
    }

    const getConnectionPoints = (
        fromNode: any,
        toNode: any,
        origin: {
            x: number;
            y: number;
        }
    ) => {
        const fromX =
            origin.x + Number(fromNode.x || 0);

        const fromY =
            origin.y + Number(fromNode.y || 0);

        const fromWidth =
            Number(fromNode.width || 200);

        const fromHeight =
            Number(fromNode.height || 80);


        const toX =
            origin.x + Number(toNode.x || 0);

        const toY =
            origin.y + Number(toNode.y || 0);

        const toWidth =
            Number(toNode.width || 200);

        const toHeight =
            Number(toNode.height || 80);


        const fromCenterX =
            fromX + fromWidth / 2;

        const fromCenterY =
            fromY + fromHeight / 2;

        const toCenterX =
            toX + toWidth / 2;

        const toCenterY =
            toY + toHeight / 2;


        const dx =
            toCenterX - fromCenterX;

        const dy =
            toCenterY - fromCenterY;


        // --------------------------------
        // Vertical connection
        // --------------------------------

        if (Math.abs(dy) >= Math.abs(dx)) {

            // Target below source
            if (dy > 0) {
                return {
                    startX: fromCenterX,
                    startY: fromY + fromHeight,

                    endX: toCenterX,
                    endY: toY
                };
            }

            // Target above source
            return {
                startX: fromCenterX,
                startY: fromY,

                endX: toCenterX,
                endY: toY + toHeight
            };
        }


        // --------------------------------
        // Horizontal connection
        // --------------------------------

        // Target right
        if (dx > 0) {
            return {
                startX: fromX + fromWidth,
                startY: fromCenterY,

                endX: toX,
                endY: toCenterY
            };
        }


        // Target left
        return {
            startX: fromX,
            startY: fromCenterY,

            endX: toX + toWidth,
            endY: toCenterY
        };
    };



    // Safely coerce a value to a trimmed string, or empty string if falsy
    const getSafeText = (value: unknown): string => {
        if (typeof value === "string") return value.trim();
        if (value === null || value === undefined) return "";
        return String(value).trim();
    };


    const renderAIDiagram = (
        diagram: any
    ) => {

        if (!excalidrawApi) {
            return;
        }


        // ----------------------------------------
        // DIAGRAM ORIGIN
        // ----------------------------------------

        const origin =
            getEmptyCanvasPosition();


        const aiElements =
            diagram?.elements || [];

        const connections =
            diagram?.connections || [];


        if (!aiElements.length) {
            return;
        }


        // ----------------------------------------
        // HELPER - FIND AI NODE
        // ----------------------------------------

        const getNode = (
            id: string
        ) => {

            return aiElements.find(
                (element: any) =>
                    element.id === id
            );
        };


        // ----------------------------------------
        // CREATE SHAPES
        // ----------------------------------------

        const shapeElements =
            aiElements.flatMap(
                (element: any) => {

                    if (
                        !element?.type ||
                        !element?.id
                    ) {
                        return [];
                    }


                    const x =
                        origin.x +
                        (Number(element.x) || 0);

                    const y =
                        origin.y +
                        (Number(element.y) || 0);


                    const width =
                        Number(element.width) || 200;

                    const height =
                        Number(element.height) || 80;


                    const baseElement = {

                        // VERY IMPORTANT
                        id: element.id,

                        type:
                            element.type,

                        x,
                        y,

                        width,
                        height,

                        strokeColor:
                            element.strokeColor ||
                            "#1e1e1e",

                        backgroundColor:
                            element.backgroundColor ||
                            "transparent",

                        strokeWidth:
                            Number(
                                element.strokeWidth
                            ) || 2,

                        strokeStyle:
                            element.strokeStyle ||
                            "solid",

                        fillStyle:
                            element.fillStyle ||
                            "solid",

                        roughness:
                            element.roughness ?? 1,

                        opacity:
                            element.opacity ?? 100
                    };


                    // --------------------------------
                    // TEXT ELEMENT
                    // --------------------------------

                    if (
                        element.type === "text"
                    ) {

                        return [
                            {
                                ...baseElement,

                                text:
                                    getSafeText(
                                        element.text ||
                                        element.label
                                    ),

                                fontSize:
                                    Number(
                                        element.fontSize
                                    ) || 18
                            }
                        ];
                    }


                    // --------------------------------
                    // SHAPE LABEL
                    // --------------------------------

                    const labelText =
                        getSafeText(

                            typeof element.label ===
                                "object" &&
                                element.label !== null

                                ? element.label.text

                                : element.label ??
                                element.text
                        );


                    return [
                        {
                            ...baseElement,

                            ...(labelText && {

                                label: {

                                    text:
                                        labelText,

                                    fontSize:
                                        Number(
                                            element.fontSize
                                        ) || 18
                                }

                            })
                        }
                    ];
                }
            );


        // ----------------------------------------
        // CREATE CONNECTIONS
        // ----------------------------------------

        const connectionElements =
            connections
                .map(
                    (
                        connection: any,
                        index: number
                    ) => {

                        const fromNode =
                            getNode(
                                connection.from
                            );

                        const toNode =
                            getNode(
                                connection.to
                            );


                        if (
                            !fromNode ||
                            !toNode
                        ) {

                            console.warn(
                                "Unable to create connection",
                                connection
                            );

                            return null;
                        }


                        const {
                            startX,
                            startY,
                            endX,
                            endY
                        } =
                            getConnectionPoints(
                                fromNode,
                                toNode,
                                origin
                            );


                        return {

                            id:
                                connection.id ||
                                `connection-${index}`,

                            type:
                                "arrow",


                            // ------------------------
                            // Physical arrow position
                            // ------------------------

                            x:
                                startX,

                            y:
                                startY,

                            width:
                                endX -
                                startX,

                            height:
                                endY -
                                startY,


                            // ------------------------
                            // Excalidraw binding
                            // ------------------------

                            start: {
                                id:
                                    connection.from
                            },

                            end: {
                                id:
                                    connection.to
                            },


                            // ------------------------
                            // Styling
                            // ------------------------

                            strokeColor:
                                connection.strokeColor ||
                                "#1e1e1e",

                            strokeWidth:
                                Number(
                                    connection.strokeWidth
                                ) || 2,

                            strokeStyle:
                                connection.strokeStyle ||
                                "solid",

                            roughness:
                                connection.roughness ?? 1,

                            opacity:
                                connection.opacity ?? 100,

                            startArrowhead:
                                null,

                            endArrowhead:
                                connection.endArrowhead ||
                                "arrow",


                            // ------------------------
                            // Connection label
                            // ------------------------

                            ...(connection.label && {

                                label: {

                                    text:
                                        getSafeText(
                                            connection.label
                                        ),

                                    fontSize:
                                        Number(
                                            connection.fontSize
                                        ) || 16
                                }

                            })
                        };
                    }
                )
                .filter(Boolean);


        // ----------------------------------------
        // IMPORTANT:
        // CONVERT SHAPES + CONNECTIONS TOGETHER
        // ----------------------------------------

        const elementsToConvert = [

            ...shapeElements,

            ...connectionElements

        ];


        const newElements =
            convertToExcalidrawElements(
                elementsToConvert as any,
                {
                    // VERY IMPORTANT
                    regenerateIds: false
                }
            );


        // ----------------------------------------
        // EXISTING ELEMENTS
        // ----------------------------------------

        const currentElements =
            excalidrawApi
                .getSceneElements();


        // ----------------------------------------
        // UPDATE SCENE
        // ----------------------------------------

        excalidrawApi.updateScene({

            elements: [

                ...currentElements,

                ...newElements

            ]

        });


        // ----------------------------------------
        // OPTIONAL
        // Scroll generated diagram into view
        // ----------------------------------------

        /*
        excalidrawApi.scrollToContent(
            newElements,
            {
                fitToViewport: true,
                viewportZoomFactor: 0.8
            }
        );
        */
    };



    const onClickGenerate = async () => {
        addAiPlaceholder()

        setLoading(true)
        const currentAiTool = AiTools.find(tool => tool.name == selectedTool);

        const result = await axios.post('/api/ai', {
            userInput: userEnteredPrompt,
            type: currentAiTool?.name,
            systemPrompt: currentAiTool?.prompt
        })

        // console.log(result?.data)
        removeAiPlaceholder();
        renderAIDiagram(result?.data?.diagramResult);
        setLoading(false);
    }

    const removeAiPlaceholder = () => {
        if (!excalidrawApi) return;

        const placeHolderIds = Object.values(AI_PLACEHOLDER_IDS)

        const currentElements = excalidrawApi.getSceneElements()

        const updatedElements = currentElements.filter(element => !placeHolderIds.includes(element.id));

        excalidrawApi.updateScene({
            elements: updatedElements
        })
    }

    return (
        <div className="absolute right-4 bottom-20 z-[500] w-[400px] flex flex-col
            overflow-hidden rounded-2xl border border-gray-200/80
            shadow-[0_20px_60px_rgba(0,0,0,0.12)] bg-white
        ">

            {/* Header with gradient */}
            <div className="relative px-4 pt-4 pb-3 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 overflow-hidden">
                {/* Decorative glow */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/10 rounded-full blur-lg pointer-events-none" />

                <div className="relative flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-0.5">
                            <div className="p-1 bg-white/20 rounded-lg">
                                <Sparkles size={14} className="text-white" />
                            </div>
                            <h2 className="font-semibold text-white text-sm tracking-wide">AI Assistant</h2>
                        </div>
                        <p className="text-white/70 text-xs">Describe your idea, get a visual instantly</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition"
                    >
                        <X size={16} />
                    </button>
                </div>
            </div>

            <div className="p-4 flex flex-col gap-4">

                {/* Quick tools */}
                <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Quick Generate</p>
                    <div className="grid grid-cols-2 gap-1.5">
                        {AiTools.map((tool, index) => (
                            <button
                                key={index}
                                onClick={() => setSelectedTool(tool.name)}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-150 text-left
                                    ${selectedTool === tool.name
                                        ? `${tool.bgColor} ${tool.border} ring-2 ring-offset-1 ${tool.color.replace('text', 'ring')} shadow-sm scale-[1.02]`
                                        : `${tool.border} ${tool.bgColor} hover:shadow-sm hover:scale-[1.02]`
                                    }`}
                            >
                                <span className={`${tool.color} shrink-0`}>{tool.icon}</span>
                                <div className="min-w-0">
                                    <p className={`text-xs font-semibold ${tool.color} truncate`}>{tool.name}</p>
                                    <p className="text-[10px] text-gray-400 truncate">{tool.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Divider */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-[10px] text-gray-400 font-medium">OR DESCRIBE</span>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Prompt area */}
                <div className="flex flex-col gap-2">
                    <Textarea
                        placeholder="e.g. Customer onboarding flow with decision points..."
                        className="resize-none text-sm min-h-[72px] rounded-xl border-gray-200 focus:border-violet-400 focus:ring-violet-100 placeholder:text-gray-300"
                        onChange={(event) => setUserEnteredPrompt(event.target.value)}
                    />

                    <Button
                        className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white
                            bg-gradient-to-r from-violet-600 to-indigo-600
                            hover:from-violet-700 hover:to-indigo-700
                            shadow-md shadow-violet-200
                            hover:shadow-lg hover:shadow-violet-300
                            transition-all duration-200"
                        disabled={loading}
                        onClick={onClickGenerate}
                    >
                        <Sparkles size={15} />
                        {loading && <Loader2Icon className='animate-spin' />} Generate {selectedTool}
                    </Button>
                </div>

            </div>
        </div>
    )
}

export default AiFloatingSidebar;

