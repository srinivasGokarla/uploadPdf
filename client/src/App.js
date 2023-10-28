
import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [pdfs, setPdfs] = useState([]);
  const [selectedPages, setSelectedPages] = useState({});
  const [downloadLink, setDownloadLink] = useState('');

  const handleFileUpload = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile && uploadedFile.type === 'application/pdf') {
      setFile(uploadedFile);
    } else {
      alert('Please upload a PDF file.');
    }
  };

  const handleUpload = async () => {
    if (file) {
      const formData = new FormData();
      formData.append('pdf', file);

      try {
        const res = await axios.post('http://localhost:5000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log(res.data);
        fetchPDFs();
      } catch (error) {
        console.error('Error uploading PDF:', error);
      }
    }
  };

  const fetchPDFs = async () => {
    try {
      const response = await axios.get('http://localhost:5000/pdfs');
      setPdfs(response.data);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    }
  };

  const handlePageSelection = (pdfId, pageNumber) => {
    const updatedSelectedPages = { ...selectedPages };
    if (!updatedSelectedPages[pdfId]) {
      updatedSelectedPages[pdfId] = [];
    }

    if (updatedSelectedPages[pdfId].includes(pageNumber)) {
      updatedSelectedPages[pdfId] = updatedSelectedPages[pdfId].filter((page) => page !== pageNumber);
    } else {
      updatedSelectedPages[pdfId].push(pageNumber);
    }

    setSelectedPages(updatedSelectedPages);
  };

  const handleCreatePDF = async (pdfId) => {
    if (selectedPages[pdfId] && selectedPages[pdfId].length > 0) {
      try {
        const response = await axios.post('http://localhost:5000/create-pdf', {
          pdfId,
          selectedPages: selectedPages[pdfId],
        });
        setDownloadLink(response.data.downloadLink);
      } catch (error) {
        console.error('Error creating new PDF:', error);
      }
    }
  };

  const handleDownloadNewPDF = () => {
    window.open(downloadLink, '_blank');
  };

  return (
    <div className="App">
      <input type="file" accept=".pdf" onChange={handleFileUpload} />
      <button onClick={handleUpload}>Upload</button>

      <div>
        <h2>Uploaded PDFs:</h2>
        {pdfs.map((pdf, index) => (
          <div key={index}>
            <p>{pdf.name}</p>
            <div>
              {Array.from({ length: pdf.numPages }, (_, i) => (
                <label key={i}>
                  Page {i + 1}
                  <input
                    type="checkbox"
                    checked={selectedPages[pdf._id] && selectedPages[pdf._id].includes(i + 1)}
                    onChange={() => handlePageSelection(pdf._id, i + 1)}
                  />
                </label>
              ))}
            </div>
            <button onClick={() => handleCreatePDF(pdf._id)}>Create New PDF</button>
          </div>
        ))}
      </div>

      {downloadLink && (
        <div>
          <button onClick={handleDownloadNewPDF}>Download New PDF</button>
        </div>
      )}
    </div>
  );
}

export default App;
