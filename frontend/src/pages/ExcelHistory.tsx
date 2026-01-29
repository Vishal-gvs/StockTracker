import React, { useEffect, useState } from 'react';
import api from '../services/api';

interface ExcelFile {
  _id: string; // Mongo Object ID
  fileId: string; // GridFS ID
  fileName: string;
  createdAt: string;
}

const ExcelHistory: React.FC = () => {
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchHistory = async () => {
    try {
      const res = await api.get('/excel/history');
      setFiles(res.data);
    } catch (error) {
      console.error('Failed to fetch history', error);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      await api.post('/excel/generate');
      await fetchHistory(); // Refresh list
    } catch (error) {
      console.error('Failed to generate excel', error);
      alert('Failed to generate Excel file');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const response = await api.get(`/excel/download/${fileId}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      if (link.parentNode) link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Download failed', error);
      alert('Download failed');
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await api.delete(`/excel/${fileId}`);
      setFiles(files.filter(f => f.fileId !== fileId));
    } catch (error) {
      console.error('Delete failed', error);
      alert('Delete failed');
    }
  };

  const handleGenerateMonthly = async (dateGroup: string) => {
    try {
        setLoading(true);
        const [monthName, yearStr] = dateGroup.split(' ');
        const year = parseInt(yearStr);
        // Convert month name to number (1-12)
        const date = new Date(`${monthName} 1, 2000`);
        const month = date.getMonth() + 1;

        if (isNaN(month) || isNaN(year)) {
            alert('Invalid date format for report generation');
            return;
        }

        await api.post('/excel/monthly', { month, year });
        await fetchHistory();
    } catch (error) {
        console.error('Failed to generate monthly report', error);
        alert('Failed to generate monthly report');
    } finally {
        setLoading(false);
    }
  };

  // Group by Month-Year
  const groupedFiles = files.reduce((acc, file) => {
    const date = new Date(file.createdAt);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(file);
    return acc;
  }, {} as Record<string, ExcelFile[]>);

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Excel Reports History</h2>
      
      <div className="mb-6">
        <button 
          onClick={handleGenerate} 
          disabled={loading} 
          className="bg-green-600 text-white px-5 py-2.5 rounded-md hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed font-medium transition-colors w-full sm:w-auto"
        >
          {loading ? 'Generating...' : 'Generate New Daily Report'}
        </button>
      </div>

      <div className="space-y-6">
        {Object.keys(groupedFiles).length === 0 ? (
          <p className="text-gray-500 text-center py-8">No reports generated yet.</p>
        ) : (
          Object.entries(groupedFiles).map(([dateGroup, groupFiles]) => (
            <div key={dateGroup} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-700 mb-2 sm:mb-0">{dateGroup}</h3>
                  <button 
                    onClick={() => handleGenerateMonthly(dateGroup)} 
                    disabled={loading}
                    className="bg-green-600 text-white px-3 py-1.5 rounded text-sm hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    Generate Monthly Report
                  </button>
              </div>
              <ul className="divide-y divide-gray-100">
                {groupFiles.map((file) => (
                  <li key={file._id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col mb-2 sm:mb-0">
                        <span className="font-medium text-gray-900">{file.fileName}</span>
                        <span className="text-sm text-gray-500">{new Date(file.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => handleDownload(file.fileId, file.fileName)} className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 flex-1 sm:flex-none text-center">
                            Download
                        </button>
                        <button onClick={() => handleDelete(file.fileId)} className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 flex-1 sm:flex-none text-center">
                            Delete
                        </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ExcelHistory;
