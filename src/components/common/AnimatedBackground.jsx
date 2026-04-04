import { useEffect, useRef } from 'react';

const AnimatedBackground = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Gradient blob properties
    const blobs = [
      { x: 0.2, y: 0.3, vx: 0.0005, vy: 0.0003, color: 'rgba(59, 130, 246, 0.15)' }, // blue
      { x: 0.8, y: 0.7, vx: -0.0004, vy: 0.0006, color: 'rgba(6, 182, 212, 0.15)' }, // cyan
      { x: 0.5, y: 0.5, vx: 0.0003, vy: -0.0004, color: 'rgba(20, 184, 166, 0.15)' }, // teal
    ];

    const animate = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw blobs
      blobs.forEach((blob) => {
        blob.x += blob.vx;
        blob.y += blob.vy;

        // Bounce off edges
        if (blob.x <= 0 || blob.x >= 1) blob.vx *= -1;
        if (blob.y <= 0 || blob.y >= 1) blob.vy *= -1;

        // Draw gradient circle
        const gradient = ctx.createRadialGradient(
          blob.x * canvas.width,
          blob.y * canvas.height,
          0,
          blob.x * canvas.width,
          blob.y * canvas.height,
          canvas.width * 0.4
        );
        gradient.addColorStop(0, blob.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ filter: 'blur(60px)' }}
    />
  );
};

export default AnimatedBackground;
