// src/pages/candidate/DocumentCenter.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Download,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  X,
  PenTool,
  Send,
  Eye,
} from 'lucide-react';
import CandidateDashboardSkeleton from '../../components/skeleton/CandidateDashboardSkeleton'; // adjust path

// ─── Types ────────────────────────────────────────────────
interface Document {
  id: string;
  title: string;
  company: string;
  dateReceived: string;
  deadline?: string;
  status: 'pending' | 'action_required' | 'signed' | 'completed' | 'expired';
  fileUrl: string; // secure/signed URL from backend
  type: 'offer_letter' | 'nda' | 'contract' | 'onboarding_form';
  requiresSignature: boolean;
  requiresUpload: boolean;
}

// ─── Mock Data ─────────────────────────────────────────────
const MOCK_DOCUMENTS: Document[] = [
  {
    id: 'doc-001',
    title: 'Software Engineering Intern - Offer Letter',
    company: 'TechNova Solutions',
    dateReceived: 'Feb 20, 2026',
    deadline: 'Mar 5, 2026',
    status: 'action_required',
    fileUrl: '/mock/offer-letter.pdf',
    type: 'offer_letter',
    requiresSignature: true,
    requiresUpload: false,
  },
  {
    id: 'doc-002',
    title: 'Non-Disclosure Agreement (NDA)',
    company: 'InnoSpark',
    dateReceived: 'Feb 18, 2026',
    deadline: 'Feb 28, 2026',
    status: 'pending',
    fileUrl: '/mock/nda.pdf',
    type: 'nda',
    requiresSignature: true,
    requiresUpload: false,
  },
  {
    id: 'doc-003',
    title: 'Bank Details Form – Stipend Payment',
    company: 'CreativeHub LK',
    dateReceived: 'Feb 25, 2026',
    deadline: 'Mar 10, 2026',
    status: 'action_required',
    fileUrl: null,
    type: 'onboarding_form',
    requiresSignature: false,
    requiresUpload: true,
  },
];

// ─── Component ─────────────────────────────────────────────
const DocumentCenter: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>(MOCK_DOCUMENTS);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Simple canvas drawing logic
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#000';

    const startDrawing = (e: MouseEvent | TouchEvent) => {
      setIsDrawing(true);
      draw(e);
    };

    const stopDrawing = () => {
      setIsDrawing(false);
      ctx.beginPath();
    };

    const draw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing) return;

      const rect = canvas.getBoundingClientRect();
      const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
      const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);

    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchmove', draw);
    canvas.addEventListener('touchend', stopDrawing);

    return () => {
      canvas.removeEventListener('mousedown', startDrawing);
      canvas.removeEventListener('mousemove', draw);
      canvas.removeEventListener('mouseup', stopDrawing);
      canvas.removeEventListener('mouseout', stopDrawing);
      canvas.removeEventListener('touchstart', startDrawing);
      canvas.removeEventListener('touchmove', draw);
      canvas.removeEventListener('touchend', stopDrawing);
    };
  }, [isDrawing]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setSignature(null);
    }
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      setSignature(canvas.toDataURL('image/png'));
      // In real app → send to backend to merge with PDF
      alert('Signature saved! In real app it would be merged with the document.');
    }
  };

  const getStatusBadge = (status: Document['status']) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      action_required: 'bg-red-100 text-red-800 font-medium',
      signed: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      expired: 'bg-gray-100 text-gray-600',
    };

    const labels = {
      pending: 'Pending',
      action_required: 'Action Required',
      signed: 'Signed',
      completed: 'Completed',
      expired: 'Expired',
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  return (
    <CandidateDashboardSkeleton>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Document Center</h1>
            <p className="text-gray-600 mt-1">
              Securely view, sign, and manage your internship documents
            </p>
          </div>

          {/* Document List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Document
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Received
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Deadline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText className="text-blue-600 mr-3" size={20} />
                          <div>
                            <div className="font-medium text-gray-900">{doc.title}</div>
                            <div className="text-sm text-gray-500">{doc.type.replace('_', ' ')}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {doc.company}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {doc.dateReceived}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {doc.deadline || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(doc.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedDoc(doc)}
                          className="text-blue-600 hover:text-blue-800 mr-3"
                        >
                          <Eye size={18} />
                        </button>
                        {doc.requiresUpload && (
                          <button className="text-indigo-600 hover:text-indigo-800">
                            <Upload size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {documents.length === 0 && (
              <div className="p-12 text-center text-gray-500">
                No documents received yet
              </div>
            )}
          </div>

          {/* Document Viewer Modal */}
          {selectedDoc && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                {/* Modal header */}
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedDoc.title}</h2>
                    <p className="text-sm text-gray-600">{selectedDoc.company}</p>
                  </div>
                  <button
                    onClick={() => setSelectedDoc(null)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* PDF Viewer + Signature Area */}
                <div className="flex flex-1 overflow-hidden">
                  {/* PDF Preview (placeholder) */}
                  <div className="flex-1 bg-gray-100 p-6 overflow-auto">
                    <div className="bg-white shadow-lg rounded-lg overflow-hidden h-full">
                      {/* Real app → use react-pdf or iframe */}
                      <div className="h-full flex items-center justify-center text-gray-500">
                        <div className="text-center">
                          <FileText size={64} className="mx-auto mb-4 opacity-40" />
                          <p>PDF Preview Placeholder</p>
                          <p className="text-sm mt-2">In production: embed using react-pdf or iframe</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signature Panel */}
                  {selectedDoc.requiresSignature && (
                    <div className="w-96 border-l border-gray-200 bg-gray-50 p-6 flex flex-col">
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <PenTool size={20} />
                        Digital Signature
                      </h3>

                      <div className="border border-gray-300 rounded-lg bg-white mb-4 overflow-hidden">
                        <canvas
                          ref={canvasRef}
                          width={340}
                          height={180}
                          className="w-full touch-none"
                        />
                      </div>

                      <div className="flex gap-3 mb-6">
                        <button
                          onClick={clearSignature}
                          className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                        >
                          Clear
                        </button>
                        <button
                          onClick={saveSignature}
                          disabled={!signature}
                          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          Sign Document
                        </button>
                      </div>

                      <p className="text-xs text-gray-500">
                        By signing, you agree to the terms in this document. This action is legally binding.
                      </p>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t flex justify-end gap-4">
                  <button className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <Download size={18} />
                    Download
                  </button>
                  <button className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </CandidateDashboardSkeleton>
  );
};

export default DocumentCenter;