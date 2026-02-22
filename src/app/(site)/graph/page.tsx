"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { Graph, GraphNode, GraphEdge } from "@/lib/content/types";


interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

type Node = SimNode;
type Edge = GraphEdge;

const COLORS: Record<string, string> = {
  note: "#3b82f6",
  article: "#10b981",
  book: "#8b5cf6",
  paper: "#f59e0b",
};

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const nodeMapRef = useRef<Map<string, Node>>(new Map());
  const edgesRef = useRef<Edge[]>([]);
  const hoveredNodeRef = useRef<Node | null>(null);
  const isDarkRef = useRef(false);
  const workerRef = useRef<Worker | null>(null);
  const prevCanvasSizeRef = useRef({ width: 800, height: 600 });
  const simulatingRef = useRef(false);

  const [graph, setGraph] = useState<Graph | null>(null);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [isDark, setIsDark] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvasSize;
    const nodes = nodesRef.current;
    const nodeMap = nodeMapRef.current;
    const edges = edgesRef.current;
    const currentHovered = hoveredNodeRef.current;
    const currentIsDark = isDarkRef.current;

    ctx.fillStyle = currentIsDark ? "#1f2937" : "#f9fafb";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = currentIsDark ? "#374151" : "#e5e7eb";
    ctx.lineWidth = 1;
    for (const edge of edges) {
      const source = nodeMap.get(edge.source);
      const target = nodeMap.get(edge.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    }

    for (const node of nodes) {
      const isHovered = currentHovered?.id === node.id;
      const radius = isHovered ? 12 : 8;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fillStyle = COLORS[node.type] || "#6b7280";
      ctx.fill();

      if (isHovered) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    if (currentHovered) {
      ctx.fillStyle = currentIsDark ? "#f9fafb" : "#1f2937";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(currentHovered.title, currentHovered.x, currentHovered.y - 18);
    }
  }, [canvasSize]);

  useEffect(() => {
    const html = document.documentElement;
    isDarkRef.current = html.classList.contains("dark");
    setIsDark(html.classList.contains("dark"));
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);

    const observer = new MutationObserver(() => {
      isDarkRef.current = html.classList.contains("dark");
      setIsDark(html.classList.contains("dark"));
    });

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };

    observer.observe(html, {
      attributes: true,
      attributeFilter: ["class"],
    });

    motionQuery.addEventListener("change", handleMotionChange);

    return () => {
      observer.disconnect();
      motionQuery.removeEventListener("change", handleMotionChange);
    };
  }, []);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = Math.min(containerRef.current.clientWidth, 800);
        const height = Math.round(width * 0.75);
        setCanvasSize({ width, height });
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  useEffect(() => {
    fetch("/generated/graph/graph.json")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Failed to load graph: HTTP ${res.status}`);
        }
        return res.json();
      })
      .then((data: Graph) => {
        setGraph(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load graph:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!graph) return;

    const { width, height } = canvasSize;
    const centerX = width / 2;
    const centerY = height / 2;
    const radiusX = width / 4;
    const radiusY = height / 4;

    nodesRef.current = graph.nodes.map((n, i) => {
      const angle = (i / graph.nodes.length) * 2 * Math.PI;
      return {
        ...n,
        x: Math.cos(angle) * radiusX + centerX,
        y: Math.sin(angle) * radiusY + centerY,
        vx: 0,
        vy: 0,
      };
    });

    nodeMapRef.current = new Map(nodesRef.current.map((n) => [n.id, n]));
    edgesRef.current = graph.edges;
    prevCanvasSizeRef.current = { width, height };
  }, [graph, canvasSize]);

  useEffect(() => {
    if (loading || nodesRef.current.length === 0) return;
    
    const { width, height } = canvasSize;
    const prevSize = prevCanvasSizeRef.current;
    
    if (prevSize.width !== width || prevSize.height !== height) {
      const scaleX = width / prevSize.width;
      const scaleY = height / prevSize.height;
      
      nodesRef.current = nodesRef.current.map((node) => ({
        ...node,
        x: node.x * scaleX,
        y: node.y * scaleY,
      }));
      nodeMapRef.current = new Map(nodesRef.current.map((n) => [n.id, n]));
      
      prevCanvasSizeRef.current = { width, height };
      draw();
    }
  }, [canvasSize, loading, draw]);

  useEffect(() => {
    if (loading || nodesRef.current.length === 0 || simulatingRef.current) return;

    const workerCode = `
      const ALPHA = 0.1;
      const REPULSION = 5000;
      const ATTRACTION = 0.01;
      const CENTER_FORCE = 0.001;
      const PADDING = 30;
      const VELOCITY_THRESHOLD = 0.1;
      const STABILITY_FRAMES = 10;

      self.onmessage = (e) => {
        const { nodes, edges, width, height, reducedMotion } = e.data;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxFrames = reducedMotion ? 50 : 300;
        
        let stableCount = 0;

        for (let frame = 0; frame < maxFrames; frame++) {
          for (let i = 0; i < nodes.length; i++) {
            nodes[i].vx = 0;
            nodes[i].vy = 0;
          }

          for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
              const dx = nodes[j].x - nodes[i].x;
              const dy = nodes[j].y - nodes[i].y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = REPULSION / (dist * dist);
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              nodes[i].vx -= fx;
              nodes[i].vy -= fy;
              nodes[j].vx += fx;
              nodes[j].vy += fy;
            }
          }

          const nodeMap = new Map(nodes.map((n) => [n.id, n]));
          for (const edge of edges) {
            const source = nodeMap.get(edge.source);
            const target = nodeMap.get(edge.target);
            if (source && target) {
              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const force = dist * ATTRACTION;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;
              source.vx += fx;
              source.vy += fy;
              target.vx -= fx;
              target.vy -= fy;
            }
          }

          for (const node of nodes) {
            node.vx += (centerX - node.x) * CENTER_FORCE;
            node.vy += (centerY - node.y) * CENTER_FORCE;
          }

          let totalVelocity = 0;
          for (const node of nodes) {
            node.x += node.vx * ALPHA;
            node.y += node.vy * ALPHA;
            node.x = Math.max(PADDING, Math.min(width - PADDING, node.x));
            node.y = Math.max(PADDING, Math.min(height - PADDING, node.y));
            totalVelocity += Math.abs(node.vx) + Math.abs(node.vy);
          }

          const avgVelocity = totalVelocity / nodes.length;
          if (avgVelocity < VELOCITY_THRESHOLD) {
            stableCount++;
          } else {
            stableCount = 0;
          }

          if (stableCount >= STABILITY_FRAMES) {
            self.postMessage({ nodes, converged: true });
            return;
          }
        }

        self.postMessage({ nodes, converged: false });
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const worker = new Worker(URL.createObjectURL(blob));
    workerRef.current = worker;
    simulatingRef.current = true;
    setSimulating(true);

    worker.onmessage = (e: MessageEvent<{ nodes: Node[]; converged: boolean }>) => {
      nodesRef.current = e.data.nodes;
      nodeMapRef.current = new Map(nodesRef.current.map((n) => [n.id, n]));
      simulatingRef.current = false;
      setSimulating(false);
      draw();
    };

    worker.postMessage({
      nodes: nodesRef.current,
      edges: edgesRef.current,
      width: canvasSize.width,
      height: canvasSize.height,
      reducedMotion,
    });

    return () => {
      worker.terminate();
      workerRef.current = null;
      simulatingRef.current = false;
    };
  }, [loading, canvasSize, reducedMotion, draw]);

  useEffect(() => {
    hoveredNodeRef.current = hoveredNode;
    isDarkRef.current = isDark;
    draw();
  }, [hoveredNode, isDark, draw]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);

    const hovered = nodesRef.current.find((node) => {
      const dx = node.x - x;
      const dy = node.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 15;
    });

    setHoveredNode(hovered || null);
    canvas.style.cursor = hovered ? "pointer" : "default";
  };

  const handleClick = () => {
    if (hoveredNode) {
      window.location.href = `/${hoveredNode.id}`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if ((e.key === "Enter" || e.key === " ") && hoveredNode) {
      e.preventDefault();
      window.location.href = `/${hoveredNode.id}`;
    }
  };

  const handleMouseLeave = () => {
    setHoveredNode(null);
  };

  const typeColors = graph
    ? [...new Set(graph.nodes.map((n) => n.type))].sort()
    : [];

  return (
    <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl font-bold mb-2">Knowledge Graph</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-4 sm:mb-6 text-sm sm:text-base">
        Interactive visualization of connections between notes and articles.
      </p>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading graph…</p>
      ) : (
        <>
          <div
            ref={containerRef}
            className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4"
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              className="w-full h-auto touch-manipulation"
              tabIndex={0}
              role="img"
              aria-label="Interactive knowledge graph visualization. Hover or use keyboard to explore nodes."
              onMouseMove={handleMouseMove}
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              onMouseLeave={handleMouseLeave}
            />
            {simulating && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-gray-900/50">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  Calculating layout…
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 sm:gap-4 mb-6">
            {typeColors.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 sm:w-4 sm:h-4 rounded-full"
                  style={{ backgroundColor: COLORS[type] || "#6b7280" }}
                  aria-hidden="true"
                />
                <span className="text-xs sm:text-sm capitalize">{type}</span>
              </div>
            ))}
          </div>

          {hoveredNode && (
            <div className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Link
                href={`/${hoveredNode.id}`}
                className="text-base sm:text-lg font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
              >
                {hoveredNode.title}
              </Link>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                Type: {hoveredNode.type}
                {hoveredNode.tags.length > 0 && (
                  <> · Tags: {hoveredNode.tags.join(", ")}</>
                )}
              </p>
            </div>
          )}

          <div className="mt-6 sm:mt-8">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">All Entries</h2>
            <div className="grid gap-1 sm:gap-2">
              {graph?.nodes.map((node) => (
                <Link
                  key={node.id}
                  href={`/${node.id}`}
                  className="flex items-center gap-2 sm:gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div
                    className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: COLORS[node.type] || "#6b7280" }}
                    aria-hidden="true"
                  />
                  <span className="text-sm sm:text-base truncate">{node.title}</span>
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 ml-auto flex-shrink-0">
                    {node.type}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
