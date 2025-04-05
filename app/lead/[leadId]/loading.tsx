export default function LoadingPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold mb-2">Loading lead details...</h2>
        <p className="text-gray-500">Please wait while we fetch the information.</p>
      </div>
    </div>
  )
} 