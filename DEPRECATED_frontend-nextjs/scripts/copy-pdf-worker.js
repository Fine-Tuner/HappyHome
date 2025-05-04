const path = require('path');
const fs = require('fs');

const pdfWorkerPath = path.join(process.cwd(), 'node_modules', '.pnpm', 'pdfjs-dist@3.11.174', 'node_modules', 'pdfjs-dist', 'build', 'pdf.worker.min.js');
const publicDir = path.join(process.cwd(), 'public');
const publicPath = path.join(publicDir, 'pdf.worker.min.js');

// public 디렉토리가 없으면 생성
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// PDF 워커 파일이 존재하는지 확인
if (fs.existsSync(pdfWorkerPath)) {
  fs.copyFileSync(pdfWorkerPath, publicPath);
  console.log('PDF worker file copied successfully');
} else {
  console.error('PDF worker file not found at:', pdfWorkerPath);
} 