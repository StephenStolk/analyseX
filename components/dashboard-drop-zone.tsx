"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Plus, MousePointer2 } from "lucide-react"

export function DashboardDropZone() {
  return (
    <div className="absolute inset-4 pointer-events-none">
      <div className="w-full h-full border-2 border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center">
        <Card className="pointer-events-auto">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">Drop Analysis Modules Here</h3>
            <p className="text-muted-foreground mb-4">
              Drag modules from the left panel to create your custom analysis dashboard
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <MousePointer2 className="h-4 w-4" />
              <span>Drag and drop to get started</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
