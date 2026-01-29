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
    <div className="history-container">
      <h2>Excel Reports History</h2>
      
      <div className="actions">
        <button onClick={handleGenerate} disabled={loading} className="generate-btn">
          {loading ? 'Generating...' : 'Generate New Daily Report'}
        </button>
      </div>

      <div className="history-list">
        {Object.keys(groupedFiles).length === 0 ? (
          <p>No reports generated yet.</p>
        ) : (
          Object.entries(groupedFiles).map(([dateGroup, groupFiles]) => (
            <div key={dateGroup} className="month-group">
              <div className="month-header">
                  <h3>{dateGroup}</h3>
                  <button 
                    onClick={() => handleGenerateMonthly(dateGroup)} 
                    disabled={loading}
                    className="generate-monthly-btn"
                  >
                    Generate Monthly Report
                  </button>
              </div>
              <ul>
                {groupFiles.map((file) => (
                  <li key={file._id} className="file-item">
                    <span className="file-name">{file.fileName}</span>
                    <span className="file-date">{new Date(file.createdAt).toLocaleString()}</span>
                    <div className="file-actions">
                        <button onClick={() => handleDownload(file.fileId, file.fileName)} className="download-btn">
                        Download
                        </button>
                        <button onClick={() => handleDelete(file.fileId)} className="delete-btn">
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
