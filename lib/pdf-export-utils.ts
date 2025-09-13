import jsPDF from "jspdf"
import html2canvas from "html2canvas"

export interface ExportSection {
  id: string
  title: string
  element?: HTMLElement
  content?: string
  type: "chart" | "table" | "text" | "kpi"
  priority: "high" | "medium" | "low"
}

export const defaultExportSections: ExportSection[] = [
  {
    id: "executive-summary",
    title: "Executive Summary",
    type: "text",
    priority: "high",
  },
  {
    id: "kpis",
    title: "Key Performance Indicators",
    type: "kpi",
    priority: "high",
  },
  {
    id: "trend-charts",
    title: "Trend Analysis",
    type: "chart",
    priority: "high",
  },
  {
    id: "detail-charts",
    title: "Detailed Analysis",
    type: "chart",
    priority: "medium",
  },
  {
    id: "insights",
    title: "AI Insights",
    type: "text",
    priority: "medium",
  },
  {
    id: "summary-table",
    title: "Summary Table",
    type: "table",
    priority: "low",
  },
]

export class PDFExporter {
  private pdf: jsPDF
  private currentY = 20
  private pageHeight = 297 // A4 height in mm
  private pageWidth = 210 // A4 width in mm
  private margin = 20

  constructor() {
    this.pdf = new jsPDF("p", "mm", "a4")
  }

  async exportDashboard(sections: ExportSection[], title = "Dashboard Report"): Promise<void> {
    // Add title page
    this.addTitle(title)
    this.addNewPage()

    // Process sections by priority
    const sortedSections = sections.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 }
      return priorityOrder[a.priority] - priorityOrder[b.priority]
    })

    for (const section of sortedSections) {
      await this.addSection(section)
    }

    // Save the PDF
    this.pdf.save(`${title.toLowerCase().replace(/\s+/g, "-")}-report.pdf`)
  }

  private addTitle(title: string): void {
    this.pdf.setFontSize(24)
    this.pdf.setFont("helvetica", "bold")
    this.pdf.text(title, this.pageWidth / 2, 40, { align: "center" })

    this.pdf.setFontSize(12)
    this.pdf.setFont("helvetica", "normal")
    this.pdf.text(`Generated on ${new Date().toLocaleDateString()}`, this.pageWidth / 2, 50, { align: "center" })
  }

  private async addSection(section: ExportSection): Promise<void> {
    // Check if we need a new page
    if (this.currentY > this.pageHeight - 60) {
      this.addNewPage()
    }

    // Add section title
    this.pdf.setFontSize(16)
    this.pdf.setFont("helvetica", "bold")
    this.pdf.text(section.title, this.margin, this.currentY)
    this.currentY += 10

    // Add section content based on type
    switch (section.type) {
      case "text":
        await this.addTextContent(section)
        break
      case "chart":
        await this.addChartContent(section)
        break
      case "table":
        await this.addTableContent(section)
        break
      case "kpi":
        await this.addKPIContent(section)
        break
    }

    this.currentY += 15 // Add spacing after section
  }

  private async addTextContent(section: ExportSection): Promise<void> {
    if (section.content) {
      this.pdf.setFontSize(10)
      this.pdf.setFont("helvetica", "normal")

      const lines = this.pdf.splitTextToSize(section.content, this.pageWidth - 2 * this.margin)
      this.pdf.text(lines, this.margin, this.currentY)
      this.currentY += lines.length * 5
    } else if (section.element) {
      await this.addElementAsImage(section.element)
    }
  }

  private async addChartContent(section: ExportSection): Promise<void> {
    if (section.element) {
      await this.addElementAsImage(section.element)
    } else {
      // Fallback text if no element provided
      this.pdf.setFontSize(10)
      this.pdf.text("Chart content not available for export", this.margin, this.currentY)
      this.currentY += 10
    }
  }

  private async addTableContent(section: ExportSection): Promise<void> {
    if (section.element) {
      await this.addElementAsImage(section.element)
    } else {
      // Fallback text if no element provided
      this.pdf.setFontSize(10)
      this.pdf.text("Table content not available for export", this.margin, this.currentY)
      this.currentY += 10
    }
  }

  private async addKPIContent(section: ExportSection): Promise<void> {
    if (section.element) {
      await this.addElementAsImage(section.element)
    } else {
      // Fallback text if no element provided
      this.pdf.setFontSize(10)
      this.pdf.text("KPI content not available for export", this.margin, this.currentY)
      this.currentY += 10
    }
  }

  private async addElementAsImage(element: HTMLElement): Promise<void> {
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      })

      const imgData = canvas.toDataURL("image/png")
      const imgWidth = this.pageWidth - 2 * this.margin
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      // Check if image fits on current page
      if (this.currentY + imgHeight > this.pageHeight - this.margin) {
        this.addNewPage()
      }

      this.pdf.addImage(imgData, "PNG", this.margin, this.currentY, imgWidth, imgHeight)
      this.currentY += imgHeight + 5
    } catch (error) {
      console.error("Error adding element as image:", error)
      this.pdf.setFontSize(10)
      this.pdf.text("Error rendering content", this.margin, this.currentY)
      this.currentY += 10
    }
  }

  private addNewPage(): void {
    this.pdf.addPage()
    this.currentY = this.margin
  }

  // Static method for quick export
  static async exportElement(element: HTMLElement, filename = "export"): Promise<void> {
    const exporter = new PDFExporter()
    const section: ExportSection = {
      id: "export",
      title: "Export",
      element,
      type: "chart",
      priority: "high",
    }

    await exporter.exportDashboard([section], filename)
  }

  // Static method for quick text export
  static async exportText(content: string, title = "Text Export"): Promise<void> {
    const exporter = new PDFExporter()
    const section: ExportSection = {
      id: "text-export",
      title: "Content",
      content,
      type: "text",
      priority: "high",
    }

    await exporter.exportDashboard([section], title)
  }
}

// Utility functions
export const createExportSection = (
  id: string,
  title: string,
  type: ExportSection["type"],
  priority: ExportSection["priority"] = "medium",
  element?: HTMLElement,
  content?: string,
): ExportSection => {
  return {
    id,
    title,
    type,
    priority,
    element,
    content,
  }
}

export const getElementBySelector = (selector: string): HTMLElement | null => {
  return document.querySelector(selector) as HTMLElement
}

export const waitForElement = (selector: string, timeout = 5000): Promise<HTMLElement> => {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector) as HTMLElement
    if (element) {
      resolve(element)
      return
    }

    const observer = new MutationObserver(() => {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        observer.disconnect()
        resolve(element)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    setTimeout(() => {
      observer.disconnect()
      reject(new Error(`Element ${selector} not found within ${timeout}ms`))
    }, timeout)
  })
}
