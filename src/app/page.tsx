import FileUpload from "@/components/FileUpload";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Money Manager Viewer</h1>
        <p className="mt-2 text-gray-500">
          Upload your <code className="bg-gray-100 px-1 rounded">.mmbak</code> backup to explore your spending
        </p>
      </div>
      <FileUpload />
    </main>
  );
}
