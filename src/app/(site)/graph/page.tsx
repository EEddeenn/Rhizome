"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import type { Graph } from "@/lib/content/types";

interface Node {
  id: string;
  title: string;
  type: string;
  tags: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Edge {
  source: string;
  target: string;
}

const COLORS: Record<string, string> = {
  note: "#3b82f6",
  article: "#10b981",
  book: "#8b5cf6",
  paper: "#f59e0b",
};

export default function GraphPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [graph, setGraph] = useState<Graph | null>(null);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hoveredNode, setHoveredNode] = useState<Node | null>(null);
  const [loading, setLoading] = useState(true);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    fetch("/generated/graph.json")
      .then((res) => res.json())
      .then((data: Graph) => {
        setGraph(data);
        const initializedNodes = data.nodes.map((n, i) => ({
          ...n,
          x: Math.cos((i / data.nodes.length) * 2 * Math.PI) * 200 + 400,
          y: Math.sin((i / data.nodes.length) * 2 * Math.PI) * 200 + 300,
          vx: 0,
          vy: 0,
        }));
        setNodes(initializedNodes);
        setEdges(data.edges);
        setLoading(false);
      });
  }, []);

  const simulate = useCallback(() => {
    if (nodes.length === 0) return;

    const alpha = 0.1;
    const repulsion = 5000;
    const attraction = 0.01;
    const centerForce = 0.001;

    const newNodes = nodes.map((node) => ({ ...node, vx: 0, vy: 0 }));

    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const dx = newNodes[j].x - newNodes[i].x;
        const dy = newNodes[j].y - newNodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = repulsion / (dist * dist);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        newNodes[i].vx -= fx;
        newNodes[i].vy -= fy;
        newNodes[j].vx += fx;
        newNodes[j].vy += fy;
      }
    }

    for (const edge of edges) {
      const source = newNodes.find((n) => n.id === edge.source);
      const target = newNodes.find((n) => n.id === edge.target);
      if (source && target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = dist * attraction;
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        source.vx += fx;
        source.vy += fy;
        target.vx -= fx;
        target.vy -= fy;
      }
    }

    const centerX = 400;
    const centerY = 300;
    for (const node of newNodes) {
      node.vx += (centerX - node.x) * centerForce;
      node.vy += (centerY - node.y) * centerForce;
    }

    for (const node of newNodes) {
      node.x += node.vx * alpha;
      node.y += node.vy * alpha;
      node.x = Math.max(50, Math.min(750, node.x));
      node.y = Math.max(50, Math.min(550, node.y));
    }

    setNodes(newNodes);
  }, [nodes, edges]);

  useEffect(() => {
    if (!loading && nodes.length > 0) {
      let frame = 0;
      const maxFrames = 300;

      const animate = () => {
        simulate();
        frame++;
        if (frame < maxFrames) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [loading, simulate]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || nodes.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = document.documentElement.classList.contains("dark")
      ? "#1f2937"
      : "#f9fafb";
    ctx.fillRect(0, 0, 800, 600);

    ctx.strokeStyle = document.documentElement.classList.contains("dark")
      ? "#374151"
      : "#e5e7eb";
    ctx.lineWidth = 1;
    for (const edge of edges) {
      const source = nodes.find((n) => n.id === edge.source);
      const target = nodes.find((n) => n.id === edge.target);
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    }

    for (const node of nodes) {
      const isHovered = hoveredNode?.id === node.id;
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

    if (hoveredNode) {
      ctx.fillStyle = document.documentElement.classList.contains("dark")
        ? "#f9fafb"
        : "#1f2937";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(hoveredNode.title, hoveredNode.x, hoveredNode.y - 18);
    }
  }, [nodes, edges, hoveredNode]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hovered = nodes.find((node) => {
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

  const typeColors = graph
    ? [...new Set(graph.nodes.map((n) => n.type))].sort()
    : [];

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Knowledge Graph</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Interactive visualization of connections between notes and articles.
      </p>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading graph...</p>
      ) : (
        <>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden mb-4">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="w-full h-auto"
              onMouseMove={handleMouseMove}
              onClick={handleClick}
              onMouseLeave={() => setHoveredNode(null)}
            />
          </div>

          <div className="flex flex-wrap gap-4 mb-6">
            {typeColors.map((type) => (
              <div key={type} className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: COLORS[type] || "#6b7280" }}
                />
                <span className="text-sm capitalize">{type}</span>
              </div>
            ))}
          </div>

          {hoveredNode && (
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <Link
                href={`/${hoveredNode.id}`}
                className="text-lg font-semibold hover:underline"
              >
                {hoveredNode.title}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Type: {hoveredNode.type}
                {hoveredNode.tags.length > 0 && (
                  <> · Tags: {hoveredNode.tags.join(", ")}</>
                )}
              </p>
            </div>
          )}

          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-4">All Entries</h2>
            <div className="grid gap-2">
              {nodes.map((node) => (
                <Link
                  key={node.id}
                  href={`/${node.id}`}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[node.type] || "#6b7280" }}
                  />
                  <span>{node.title}</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
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
