"use client";

import html2canvas from "html2canvas-pro";

/**
 * Captures a DOM element as a PNG image and triggers a download.
 * Supports both light and dark modes by using the actual rendered styles.
 */
export async function exportChartAsImage(
  element: HTMLElement,
  filename: string = "colobrief-chart.png",
  options?: {
    backgroundColor?: string;
    scale?: number;
    padding?: number;
  }
): Promise<void> {
  const {
    backgroundColor = "#ffffff",
    scale = 2,
    padding = 16,
  } = options || {};

  const canvas = await html2canvas(element, {
    backgroundColor,
    scale,
    useCORS: true,
    logging: false,
    // Remove fixed-position elements like the AI chat panel
    ignoreElements: (el) => {
      if (el instanceof HTMLElement) {
        const classes = el.classList;
        return (
          classes.contains("fixed") &&
          !classes.contains("print-area")
        );
      }
      return false;
    },
  });

  // Add padding by creating a larger canvas
  const paddedWidth = canvas.width + padding * 2 * scale;
  const paddedHeight = canvas.height + padding * 2 * scale;
  const paddedCanvas = document.createElement("canvas");
  paddedCanvas.width = paddedWidth;
  paddedCanvas.height = paddedHeight;
  const ctx = paddedCanvas.getContext("2d");
  if (!ctx) return;

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, paddedWidth, paddedHeight);
  ctx.drawImage(canvas, padding * scale, padding * scale);

  // Add watermark
  ctx.save();
  ctx.font = `${11 * scale}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(0,0,0,0.12)";
  ctx.textAlign = "right";
  ctx.fillText(
    "ColoBrief AI — UC Symptom Tracker",
    paddedWidth - padding * scale,
    paddedHeight - (padding / 2) * scale
  );
  ctx.restore();

  // Trigger download
  const link = document.createElement("a");
  link.download = filename;
  link.href = paddedCanvas.toDataURL("image/png");
  link.click();
}

/**
 * Captures the full overview dashboard as a shareable image.
 * Useful for sending to doctors via messaging apps.
 */
export async function exportDashboardAsImage(
  containerId: string = "overview-content",
  filename: string = "colobrief-dashboard.png"
): Promise<void> {
  const element = document.getElementById(containerId);
  if (!element) {
    throw new Error(`Element #${containerId} not found`);
  }
  
  // Check for dark mode
  const isDark = document.documentElement.classList.contains("dark");
  await exportChartAsImage(
    element,
    filename,
    {
      backgroundColor: isDark ? "#0f172a" : "#ffffff",
      scale: 2,
      padding: 24,
    }
  );
}