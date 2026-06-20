import { getPublishedWriting, getCurrentStatus } from './data';

export function getChatContext(): string {
  const writing = getPublishedWriting();
  const status = getCurrentStatus();

  const writingIndex =
    writing.length > 0
      ? writing.map((w) => `- "${w.title}" (${w.date.slice(0, 10)})`).join('\n')
      : '- No articles published yet.';

  return `
# Swethank Reddy

Bio: IIT Bombay undergrad (B.Tech). Builder at the intersection of AI systems, computational biology, and financial ML. Also does motion design.
Contact: swethankreddy@iitb.ac.in · GitHub: github.com/swethankreddy · LinkedIn: linkedin.com/in/swethankreddy

Currently:
${status.map((s) => `- ${s}`).join('\n')}

## Item index (call getItemDetails before describing any item in depth)
id | category | title | tags
multi-agent | project | Multi-Agent AI Systems | PyTorch, LangGraph, RAG, ONNX, GGUF
cancer-omics | research | Cancer Omics Research | genomics, ML, bioinformatics, IIT Bombay
market-regime | project | Market Regime Detection | K-Means, PCA, order book, quant finance
aum-ventures | experience | Investment Analyst at AUM Ventures | VC, AI/deep-tech, due diligence
object-detection | project | Real-Time Object Detection & Facial Recognition | YOLOv8, Siamese Networks, OpenCV
gesture-recognition | project | Gesture-Based Text Creation & Recognition | MediaPipe, TensorFlow, OpenCV
bulldozer-price | project | Bulldozer Price Prediction | Random Forest, Kaggle, regression
swethankos | project | SwethankOS: 3D Retro Terminal Portfolio | Three.js, React Three Fiber, Blender, 3D, Vite, creative-dev

## Writing
${writingIndex}
`.trim();
}
