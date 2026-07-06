import { useEffect, useRef, useState } from 'react';
import { Eraser, Pencil, Type, Download, Trash2, Undo, Redo, Square, Circle, Minus } from 'lucide-react';

export default function Whiteboard({ socket, sessionId, user }) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#4f46e5');
  const [lineWidth, setLineWidth] = useState(5);
  const [tool, setTool] = useState('pencil'); // pencil, eraser, square, circle

  useEffect(() => {
    const initCanvas = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      canvas.style.width = `${canvas.offsetWidth}px`;
      canvas.style.height = `${canvas.offsetHeight}px`;

      const context = canvas.getContext('2d');
      context.scale(2, 2);
      context.lineCap = 'round';
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      contextRef.current = context;
    };

    // Delay initialization slightly to ensure layout is ready
    const timeoutId = setTimeout(initCanvas, 50);

    // Socket Listeners
    socket.on('draw_event', (data) => {
       const { x, y, prevX, prevY, color, size, tool, isEnd } = data;
       drawOnCanvas(x, y, prevX, prevY, color, size, tool, isEnd);
    });

    socket.on('clear_whiteboard', () => {
       clearCanvas();
    });

    return () => {
      clearTimeout(timeoutId);
      socket.off('draw_event');
      socket.off('clear_whiteboard');
    };
  }, []);

  const drawOnCanvas = (x, y, prevX, prevY, strokeColor, size, drawTool, isEnd) => {
    if (!contextRef.current) return;
    const ctx = contextRef.current;
    ctx.strokeStyle = drawTool === 'eraser' ? '#ffffff' : strokeColor;
    ctx.lineWidth = size;

    if (isEnd) {
      ctx.beginPath();
      return;
    }

    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const startDrawing = ({ nativeEvent }) => {
    const { offsetX, offsetY } = nativeEvent;
    contextRef.current.beginPath();
    contextRef.current.moveTo(offsetX, offsetY);
    setIsDrawing(true);
  };

  const draw = ({ nativeEvent }) => {
    if (!isDrawing) return;
    const { offsetX, offsetY } = nativeEvent;
    const prevX = contextRef.current.lastX || offsetX;
    const prevY = contextRef.current.lastY || offsetY;

    contextRef.current.lineTo(offsetX, offsetY);
    contextRef.current.stroke();

    socket.emit('draw_event', {
       sessionId,
       x: offsetX,
       y: offsetY,
       prevX,
       prevY,
       color: tool === 'eraser' ? '#ffffff' : color,
       size: lineWidth,
       tool
    });

    contextRef.current.lastX = offsetX;
    contextRef.current.lastY = offsetY;
  };

  const stopDrawing = () => {
    contextRef.current.beginPath();
    contextRef.current.lastX = null;
    contextRef.current.lastY = null;
    setIsDrawing(false);
    socket.emit('draw_event', { sessionId, isEnd: true });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleClear = () => {
    if (window.confirm('Clear the entire board?')) {
      clearCanvas();
      socket.emit('clear_whiteboard', { sessionId });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200">
      <div className="flex items-center justify-between px-6 py-3 bg-slate-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <button onClick={() => setTool('pencil')} className={`p-2 rounded-lg ${tool === 'pencil' ? 'bg-primary-100 text-primary-600' : 'text-slate-500 hover:bg-slate-100'}`}><Pencil size={18} /></button>
          <button onClick={() => setTool('eraser')} className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-primary-100 text-primary-600' : 'text-slate-500 hover:bg-slate-100'}`}><Eraser size={18} /></button>
          <div className="w-px h-6 bg-slate-200 mx-1" />
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer p-0 border-none bg-transparent" />
          <select value={lineWidth} onChange={(e) => setLineWidth(e.target.value)} className="text-xs font-bold border-none bg-transparent text-slate-600 outline-none">
            <option value="2">Thin</option>
            <option value="5">Medium</option>
            <option value="10">Thick</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
           <button onClick={handleClear} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="flex-1 cursor-crosshair touch-none"
      />
    </div>
  );
}
