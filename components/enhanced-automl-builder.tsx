import { AlertTriangle } from "lucide-react"

const EnhancedAutoMLBuilder = () => {
  return (
    <div>
      {/* Beta Testing Disclaimer */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800 mb-1">Beta Testing Software</h3>
            <p className="text-sm text-yellow-700">
              This AutoML feature is currently in beta testing. Results may vary and should be validated before
              production use. We recommend thorough testing and validation of all generated models.
            </p>
          </div>
        </div>
      </div>
      {/* rest of code here */}
    </div>
  )
}

export default EnhancedAutoMLBuilder
