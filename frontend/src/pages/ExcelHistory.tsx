import React, { useEffect, useState } from 'react';
import api from '../services/api';
import './ExcelHistory.css'; // Assuming we might want some styles, or inline for now

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

  // Group by Month-Year
  const groupedFiles = files.reduce((acc, file) => {
    const date = new Date(file.createdAt);
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = [];
    acc[key].push(file);
    return acc;
  }, {} as Record<string, ExcelFile[]>);

  return (
    <div className="history-container">
      <h2>Excel Reports History</h2>
      
      <div className="actions">
        <button onClick={handleGenerate} disabled={loading} className="generate-btn">
          {loading ? 'Generating...' : 'Generate New Report'}
        </button>
      </div>

      <div className="history-list">
        {Object.keys(groupedFiles).length === 0 ? (
          <p>No reports generated yet.</p>
        ) : (
          Object.entries(groupedFiles).map(([dateGroup, groupFiles]) => (
            <div key={dateGroup} className="month-group">
              <h3>{dateGroup}</h3>
              <ul>
                {groupFiles.map((file) => (
                  <li key={file._id} className="file-item">
                    <span className="file-name">{file.fileName}</span>
                    <span className="file-date">{new Date(file.createdAt).toLocaleString()}</span>
                    <button onClick={() => handleDownload(file.fileId, file.fileName)} className="download-btn">
                      Download
                    </button>
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
