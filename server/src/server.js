
const express = require('express');
const multer = require('multer');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const { PDFDocument, rgb } = require('pdf-lib');

const app = express();
const port = process.env.PORT || 5000;

mongoose.connect('mongodb+srv://Srinivas:Srinivas@cluster0.eu5eekh.mongodb.net/uploadPdf?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const pdfSchema = new mongoose.Schema({
  name: String,
  pdfPath: String,
});

const PDF = mongoose.model('PDF', pdfSchema);

const uploadDir = path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, callback) => {
      if (file.mimetype === 'application/pdf') {
        callback(null, true);
      } else {
        callback(new Error('Only PDF files are allowed.'));
      }
    },
  });

app.use(cors());
app.use(express.json());

app.post('/upload', upload.single('pdf'), async (req, res) => {
  const { originalname, path } = req.file;
  const newPDF = new PDF({ name: originalname, pdfPath: path });
  await newPDF.save();
  res.json({ message: 'File uploaded successfully' });
});

app.get('/pdfs', async (req, res) => {
  try {
    const pdfs = await PDF.find({});
    res.json(pdfs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

app.post('/create-pdf', async (req, res) => {
  try {
    const pdfId = req.body.pdfId;
    const selectedPages = req.body.selectedPages;
    const selectedPdf = await PDF.findById(pdfId);

    if (!selectedPdf) {
      return res.status(404).json({ message: 'PDF not found' });
    }

    const pdfBuffer = fs.readFileSync(selectedPdf.pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const newPdfDoc = await PDFDocument.create();
    
    selectedPages.forEach((page) => {
      const pageIndex = page - 1;
      if (pageIndex >= 0 && pageIndex < pdfDoc.getPageCount()) {
        const [copiedPage] = newPdfDoc.copyPages(pdfDoc, [pageIndex]);
        newPdfDoc.addPage(copiedPage);
      }
    });

    const pdfBytes = await newPdfDoc.save();
    const newPdfPath = path.join(uploadDir, 'new.pdf');
    fs.writeFileSync(newPdfPath, pdfBytes);

    res.json({ downloadLink: `/download/${path.basename(newPdfPath)}` });
  } catch (error) {
    console.error('Error creating new PDF:', error);
    res.status(500).json({ message: 'Error creating new PDF' });
  }
});

app.use('/download', express.static(uploadDir));

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
