'use client';

import { motion } from 'framer-motion';

/**
 * NeuralNetwork component for "Visionary Intelligence"
 * UPDATED: Maximum brightness and intense glow.
 */
export const NeuralNetwork = () => {
  return (
    <div className="relative h-full w-full blend-dodge">
      <svg viewBox="0 0 400 400" className="h-full w-full drop-shadow-[0_0_25px_rgba(245,159,1,0.6)]">
        {/* Complex Connection Paths */}
        {[
          "M50,100 L200,50 L350,150",
          "M50,100 L150,250 L350,150",
          "M200,50 L150,250",
          "M150,250 L300,350 L350,150",
          "M50,100 L300,350",
          "M200,50 L350,150"
        ].map((path, i) => (
          <motion.path
            key={i}
            d={path}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeOpacity="0.7"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 3, delay: i * 0.3, repeat: Infinity, repeatType: "reverse" }}
            className="text-ls-compliment"
          />
        ))}

        {/* Pulsing Nodes with Maximum Glow */}
        {[
          { x: 50, y: 100 }, { x: 200, y: 50 }, { x: 350, y: 150 },
          { x: 150, y: 250 }, { x: 300, y: 350 }
        ].map((node, i) => (
          <g key={i}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="6"
              className="fill-ls-compliment"
              animate={{ 
                r: [6, 10, 6],
                fillOpacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.4 }}
              style={{ filter: 'drop-shadow(0 0 15px #F59F01)' }}
            />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="25"
              className="stroke-ls-compliment fill-none"
              strokeWidth="1.5"
              animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
            />
          </g>
        ))}

        {/* Traveling Light Pulses (Multiple) */}
        {[
          'M50,100 L200,50 L350,150',
          'M150,250 L300,350 L350,150',
          'M50,100 L150,250'
        ].map((p, i) => (
          <motion.circle
            key={i}
            r="4"
            className="fill-ls-white"
            animate={{
              offsetDistance: ["0%", "100%"],
              opacity: [0, 1, 0]
            }}
            transition={{ duration: 2.5 + i, repeat: Infinity, ease: "linear", delay: i }}
            style={{ 
              offsetPath: `path("${p}")`,
              filter: 'drop-shadow(0 0 15px #FFFFFF)',
              zIndex: 50
            }}
          />
        ))}
      </svg>
    </div>
  );
};

/**
 * GeometricEnergy component for "Leadership Activation"
 * UPDATED: High intensity core and more vibrant shards.
 */
export const GeometricEnergy = () => {
  return (
    <div className="relative h-full w-full blend-dodge">
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Layered Vibrant Shards */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute border-2 ${i % 2 === 0 ? 'border-ls-compliment' : 'border-ls-secondary'}`}
            style={{ 
              height: 220 + i * 45,
              width: 220 + i * 45,
              clipPath: 'polygon(50% 0%, 90% 20%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 10% 20%)',
              rotate: i * 45,
              opacity: 0.15
            }}
            animate={{ 
              scale: [1, 1.25, 1],
              opacity: [0.15, 0.5, 0.15],
              rotate: [i * 45, i * 45 + 20, i * 45]
            }}
            transition={{ 
              duration: 7 + i, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
          />
        ))}
        
        {/* Central Luminous Sun */}
        <motion.div 
          animate={{ 
            scale: [1, 2, 1],
            opacity: [0.4, 0.8, 0.4],
            boxShadow: [
              '0 0 50px #F59F01',
              '0 0 150px #F59F01',
              '0 0 50px #F59F01'
            ]
          }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="h-28 w-28 rounded-full bg-ls-compliment blur-2xl"
        />
      </div>

      <svg viewBox="0 0 400 400" className="h-full w-full opacity-80">
        {[...Array(16)].map((_, i) => (
          <motion.path
            key={i}
            d={`M${200},200 L${200 + 400 * Math.cos(i * 22.5 * Math.PI / 180)}, ${200 + 400 * Math.sin(i * 22.5 * Math.PI / 180)}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="0.8"
            className="text-ls-secondary"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: [0, 1, 0] }}
            transition={{ 
              duration: 3, 
              delay: i * 0.1, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        ))}
      </svg>
    </div>
  );
};

/**
 * FluidHarmony component for "Harmonious Partnerships"
 * UPDATED: "Network of Trust" with maximum brightness.
 */
export const FluidHarmony = () => {
  return (
    <div className="relative h-full w-full blend-dodge">
      <svg viewBox="0 0 400 400" className="h-full w-full drop-shadow-[0_0_25px_rgba(22,199,132,0.6)]">
        {/* High-Contrast Grid Lines */}
        {[...Array(6)].map((_, i) => (
          <motion.path
            key={i}
            d={`M0,${66 * i} Q200,${66 * i + (i % 2 === 0 ? 60 : -60)} 400,${66 * i}`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeOpacity="0.5"
            className="text-ls-up"
            animate={{
              d: [
                `M0,${66 * i} Q200,${66 * i + (i % 2 === 0 ? 60 : -60)} 400,${66 * i}`,
                `M0,${66 * i} Q200,${66 * i + (i % 2 === 0 ? -60 : 60)} 400,${66 * i}`,
                `M0,${66 * i} Q200,${66 * i + (i % 2 === 0 ? 60 : -60)} 400,${66 * i}`
              ]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }}
          />
        ))}

        {/* Glow-Intensive Partnership Nodes */}
        {[
          { x: 100, y: 150 }, { x: 300, y: 150 }, 
          { x: 200, y: 250 }, { x: 100, y: 300 }, { x: 300, y: 300 }
        ].map((node, i) => (
          <g key={i}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="8"
              className="fill-ls-up"
              animate={{ 
                r: [8, 12, 8],
                fillOpacity: [0.8, 1, 0.8]
              }}
              transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
              style={{ filter: 'drop-shadow(0 0 15px #16c784)' }}
            />
            {i > 0 && (
              <motion.line
                x1={100} y1={150} 
                x2={node.x} y2={node.y}
                stroke="#16c784"
                strokeWidth="1"
                strokeOpacity="0.4"
              />
            )}
          </g>
        ))}

        {/* Bright Organic Dust */}
        {[...Array(12)].map((_, i) => (
          <motion.circle
            key={i}
            r="3"
            className="fill-ls-white"
            style={{ filter: 'drop-shadow(0 0 10px #FFFFFF)' }}
            animate={{
              x: [-20, 420],
              y: [80 + i * 30, 130 + i * 30],
              opacity: [0, 1, 0]
            }}
            transition={{ 
              duration: 6 + i, 
              repeat: Infinity, 
              delay: i * 1,
              ease: "linear"
            }}
          />
        ))}
      </svg>
    </div>
  );
};
