import { useEffect, useRef, useState } from 'react';
import { useInView } from 'react-intersection-observer';

const AnimatedCounter = ({ end, duration = 2000, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.3 });
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (inView && !hasAnimated.current) {
      hasAnimated.current = true;
      let startTime;
      const startValue = 0;
      const endValue = typeof end === 'string' ? parseFloat(end) : end;

      const animate = (currentTime) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentCount = startValue + (endValue - startValue) * easeOutQuart;
        
        setCount(currentCount);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(endValue);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [inView, end, duration]);

  const displayValue = typeof end === 'string' && end.includes('.')
    ? count.toFixed(1)
    : Math.floor(count);

  return (
    <span ref={ref}>
      {prefix}{displayValue}{suffix}
    </span>
  );
};

export default AnimatedCounter;
