import React, { useRef, useEffect, useState, useMemo } from 'react';
import { sounds } from '../audio/soundEngine';

export default function FishTankCanvas({
  students = [],
  classroom = {},
  selectedStudentId = null,
  viewMode = '7days', // 'today' or '7days'
  onFishClick = () => {},
  feedingEvent = null,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const stateRef = useRef({
    fishList: [],
    bubbles: [],
    foodPellets: [],
    particles: [],
    floatingBadges: [],
    mouseX: -1,
    mouseY: -1,
    hoveredFishId: null,
    clamOpenRatio: 0,
    clamTimer: 0,
    chestOpenRatio: 0,
    chestTimer: 0,
    time: 0,
  });

  // Calculate ranks
  const rankedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      const ptsA = viewMode === 'today' ? (a.todayPoints || 0) : (a.points || 0);
      const ptsB = viewMode === 'today' ? (b.todayPoints || 0) : (b.points || 0);
      return ptsB - ptsA;
    });
  }, [students, viewMode]);

  const studentRankMap = useMemo(() => {
    const map = {};
    rankedStudents.forEach((s, idx) => {
      map[s._id] = idx + 1; // 1-indexed rank
    });
    return map;
  }, [rankedStudents]);

  // Sync internal fish simulation objects with student props
  useEffect(() => {
    const currentFish = stateRef.current.fishList;
    const existingMap = new Map(currentFish.map((f) => [f.id, f]));

    const width = canvasRef.current ? canvasRef.current.width : 1000;
    const height = canvasRef.current ? canvasRef.current.height : 600;

    const newFishList = students.map((s, idx) => {
      if (existingMap.has(s._id)) {
        const existing = existingMap.get(s._id);
        existing.student = s;
        existing.rank = studentRankMap[s._id] || 999;
        return existing;
      }

      // Random starting position inside the aquarium
      const x = Math.random() * (width - 240) + 120;
      const y = Math.random() * (height - 240) + 120;
      const speed = 0.6 + Math.random() * 0.7;
      const dir = Math.random() > 0.5 ? 1 : -1;

      return {
        id: s._id,
        student: s,
        rank: studentRankMap[s._id] || 999,
        x,
        y,
        vx: dir * speed,
        vy: (Math.random() - 0.5) * 0.4,
        targetX: x,
        targetY: y,
        speed,
        dir,
        targetDir: dir,
        flipProgress: 1,
        wigglePhase: Math.random() * Math.PI * 2,
        scaleBounce: 1,
        mouthOpen: 0,
        highlightAnim: 0,
      };
    });

    stateRef.current.fishList = newFishList;
  }, [students, studentRankMap]);

  // React to feeding events from WebSocket / API
  useEffect(() => {
    if (!feedingEvent) return;

    const { studentId, points, isAll } = feedingEvent;
    const width = canvasRef.current ? canvasRef.current.width : 1000;

    if (isAll) {
      sounds.playFeedAll();
      // Drop food flakes across top of tank
      for (let i = 0; i < 35; i++) {
        stateRef.current.foodPellets.push({
          x: Math.random() * (width - 80) + 40,
          y: -10 - Math.random() * 80,
          vy: 1.2 + Math.random() * 1.0,
          vx: (Math.random() - 0.5) * 0.6,
          color: ['#f59e0b', '#fbbf24', '#ec4899', '#10b981', '#38bdf8'][Math.floor(Math.random() * 5)],
          size: 4 + Math.random() * 3,
          targetFishId: null,
        });
      }
      // Floating badges for all fish
      stateRef.current.fishList.forEach((fish) => {
        stateRef.current.floatingBadges.push({
          x: fish.x,
          y: fish.y - 40,
          text: `+${points || 5}`,
          alpha: 1,
          vy: -1.2,
          color: '#fbbf24',
        });
        fish.scaleBounce = 1.35;
      });
      stateRef.current.chestTimer = 180; // open chest!
    } else if (studentId) {
      sounds.playPop();
      const targetFish = stateRef.current.fishList.find((f) => f.id === studentId);
      if (targetFish) {
        // Drop 3-4 pellets targeting this fish
        for (let i = 0; i < 4; i++) {
          stateRef.current.foodPellets.push({
            x: targetFish.x + (Math.random() - 0.5) * 60,
            y: -10 - i * 15,
            vy: 1.8 + Math.random() * 0.8,
            vx: (Math.random() - 0.5) * 0.5,
            color: '#fbbf24',
            size: 5,
            targetFishId: targetFish.id,
          });
        }

        stateRef.current.floatingBadges.push({
          x: targetFish.x,
          y: targetFish.y - 45,
          text: `+${points || 5} pts!`,
          alpha: 1,
          vy: -1.4,
          color: '#fef08a',
        });
        targetFish.scaleBounce = 1.4;
      }
    }
  }, [feedingEvent]);

  // Main Canvas Render & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Responsive Canvas Resize
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Populate ambient background bubbles
    if (stateRef.current.bubbles.length === 0) {
      for (let i = 0; i < 40; i++) {
        stateRef.current.bubbles.push({
          x: Math.random() * 1200,
          y: Math.random() * 700,
          radius: 1.5 + Math.random() * 4.5,
          vy: 0.5 + Math.random() * 0.8,
          wobbleOffset: Math.random() * Math.PI * 2,
          wobbleSpeed: 0.02 + Math.random() * 0.02,
        });
      }
    }

    // Animation render loop
    const render = () => {
      stateRef.current.time += 0.016;
      const t = stateRef.current.time;
      const container = containerRef.current;
      const logicalWidth = container ? container.clientWidth : 1000;
      const logicalHeight = container ? container.clientHeight : 600;
      const dpr = window.devicePixelRatio || 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // 1. Draw Aquarium Backdrop
      drawAquariumBackground(ctx, logicalWidth, logicalHeight, classroom.theme, t);

      // 2. Draw Coral, Clam, Rocks, Treasure Chest
      drawSeabedDecorations(ctx, logicalWidth, logicalHeight, classroom, stateRef.current, t);

      // 3. Draw Ambient Bubbles
      drawBubbles(ctx, logicalWidth, logicalHeight, stateRef.current.bubbles, t);

      // 4. Update and Draw Food Pellets
      updateAndDrawFood(ctx, logicalWidth, logicalHeight, stateRef.current, t);

      // 5. Update and Draw Fish
      updateAndDrawFish(
        ctx,
        logicalWidth,
        logicalHeight,
        stateRef.current,
        classroom.nameVisibility || 'always',
        selectedStudentId,
        viewMode,
        t
      );

      // 6. Draw Particle Bursts & Floating Points Badges
      drawFloatingBadges(ctx, stateRef.current);

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [classroom, selectedStudentId, viewMode]);

  // Click handler on canvas to detect fish tap
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check treasure chest click
    const chestX = rect.width * 0.5;
    const chestY = rect.height - 50;
    if (Math.hypot(clickX - chestX, clickY - chestY) < 45) {
      stateRef.current.chestTimer = 160;
      sounds.playCelebration();
      // Drop coin particles & bubbles
      for (let i = 0; i < 15; i++) {
        stateRef.current.particles.push({
          x: chestX,
          y: chestY - 10,
          vx: (Math.random() - 0.5) * 4,
          vy: -2 - Math.random() * 4,
          color: '#fbbf24',
          alpha: 1,
          size: 4 + Math.random() * 4,
        });
      }
      return;
    }

    // Check fish clicks (hit testing with scale)
    const fishList = stateRef.current.fishList;
    for (let i = fishList.length - 1; i >= 0; i--) {
      const f = fishList[i];
      const pts = viewMode === 'today' ? (f.student?.todayPoints || 0) : (f.student?.points || 0);
      const baseR = 25 + Math.min(35, Math.sqrt(pts) * 2.8);

      const dist = Math.hypot(clickX - f.x, clickY - f.y);
      if (dist <= baseR * 1.3) {
        // Trigger fish feeding / quick modal
        f.scaleBounce = 1.35;
        sounds.playPop();
        onFishClick(f.student);
        return;
      }
    }

    // Tap on open water -> spawn ripple and single food flake
    stateRef.current.foodPellets.push({
      x: clickX,
      y: 0,
      vy: 1.6,
      vx: (Math.random() - 0.5) * 0.4,
      color: '#f59e0b',
      size: 4.5,
      targetFishId: null,
    });
    sounds.playSplash();
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    stateRef.current.mouseX = e.clientX - rect.left;
    stateRef.current.mouseY = e.clientY - rect.top;

    // Check hover
    let hovered = null;
    const fishList = stateRef.current.fishList;
    for (let i = fishList.length - 1; i >= 0; i--) {
      const f = fishList[i];
      const pts = viewMode === 'today' ? (f.student?.todayPoints || 0) : (f.student?.points || 0);
      const baseR = 25 + Math.min(35, Math.sqrt(pts) * 2.8);
      if (Math.hypot(stateRef.current.mouseX - f.x, stateRef.current.mouseY - f.y) <= baseR * 1.2) {
        hovered = f.id;
        break;
      }
    }
    stateRef.current.hoveredFishId = hovered;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full select-none overflow-hidden rounded-2xl border border-cyan-500/20 shadow-2xl backdrop-blur-md"
      style={{ minHeight: '520px' }}
    >
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        className="w-full h-full block cursor-pointer"
      />
    </div>
  );
}

// ---------------------- BACKGROUND DRAWING ----------------------
function drawAquariumBackground(ctx, w, h, theme = 'nightGlow', time) {
  const isNight = theme === 'nightGlow';
  const isSunset = theme === 'sunsetLagoon';

  // Water gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  if (isNight) {
    bgGrad.addColorStop(0, '#0a2347');
    bgGrad.addColorStop(0.35, '#0b3260');
    bgGrad.addColorStop(0.75, '#0d427d');
    bgGrad.addColorStop(1, '#061730');
  } else if (isSunset) {
    bgGrad.addColorStop(0, '#311042');
    bgGrad.addColorStop(0.4, '#581c87');
    bgGrad.addColorStop(0.8, '#831843');
    bgGrad.addColorStop(1, '#1e1b4b');
  } else {
    // Sunny Reef
    bgGrad.addColorStop(0, '#38bdf8');
    bgGrad.addColorStop(0.4, '#0ea5e9');
    bgGrad.addColorStop(0.8, '#0284c7');
    bgGrad.addColorStop(1, '#0369a1');
  }
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Sunlight / Moonlight Caustic Rays
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 5; i++) {
    const rayX = (w * 0.15) + (i * w * 0.18) + Math.sin(time * 0.7 + i) * 35;
    const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + (i % 2 === 0 ? 50 : -40), h * 0.75);
    rayGrad.addColorStop(0, isNight ? 'rgba(125, 211, 252, 0.22)' : 'rgba(255, 255, 255, 0.25)');
    rayGrad.addColorStop(0.5, isNight ? 'rgba(56, 189, 248, 0.08)' : 'rgba(254, 240, 138, 0.12)');
    rayGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = rayGrad;
    ctx.beginPath();
    ctx.moveTo(rayX - 30, 0);
    ctx.lineTo(rayX + 30, 0);
    ctx.lineTo(rayX + (i % 2 === 0 ? 110 : -70), h * 0.75);
    ctx.lineTo(rayX + (i % 2 === 0 ? 30 : -130), h * 0.75);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Gentle water surface ripple on top
  ctx.save();
  ctx.fillStyle = isNight ? 'rgba(224, 242, 254, 0.25)' : 'rgba(255, 255, 255, 0.35)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let x = 0; x <= w; x += 30) {
    const y = Math.sin(x * 0.015 + time * 2) * 5 + 6;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, 0);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Grotto Cave in center-top background (like the reference screenshot)
  ctx.save();
  const caveX = w * 0.32;
  const caveY = h * 0.28;
  const caveW = 120;
  const caveH = 75;

  // Shelf rock structure
  ctx.fillStyle = isNight ? '#163359' : '#1e3a5f';
  ctx.beginPath();
  ctx.roundRect(caveX - 40, caveY - 15, caveW + 80, 20, [8, 8, 0, 0]);
  ctx.fill();

  // Cave opening
  const caveGrad = ctx.createRadialGradient(caveX + caveW / 2, caveY + caveH / 2, 5, caveX + caveW / 2, caveY + caveH / 2, caveW / 2);
  caveGrad.addColorStop(0, '#fef08a'); // Warm internal lamp glow
  caveGrad.addColorStop(0.35, '#b45309');
  caveGrad.addColorStop(0.85, '#07162c');
  ctx.fillStyle = caveGrad;
  ctx.beginPath();
  ctx.ellipse(caveX + caveW / 2, caveY + caveH / 2, caveW / 2, caveH / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ---------------------- SEABED & DECORATIONS ----------------------
function drawSeabedDecorations(ctx, w, h, classroom, state, time) {
  const isNight = classroom.theme === 'nightGlow';

  // 1. Rocky seafloor & sand dunes
  const sandGrad = ctx.createLinearGradient(0, h - 80, 0, h);
  if (isNight) {
    sandGrad.addColorStop(0, '#0f294a');
    sandGrad.addColorStop(1, '#07172b');
  } else {
    sandGrad.addColorStop(0, '#e2b342');
    sandGrad.addColorStop(1, '#ca8a04');
  }

  ctx.fillStyle = sandGrad;
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h - 45);
  // Natural rolling sand dunes
  for (let x = 0; x <= w; x += 40) {
    const y = h - 45 + Math.sin(x * 0.01 + 0.5) * 12 + Math.cos(x * 0.02) * 6;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // 2. High Shelf Rock on Left (With Clam and Pearl)
  ctx.save();
  const shelfX = 0;
  const shelfY = h * 0.28;
  const shelfW = w * 0.22;
  const shelfH = 40;

  ctx.fillStyle = isNight ? '#1e385c' : '#2d4d75';
  ctx.beginPath();
  ctx.moveTo(shelfX, shelfY);
  ctx.lineTo(shelfX + shelfW, shelfY + 5);
  ctx.lineTo(shelfX + shelfW - 20, shelfY + shelfH);
  ctx.lineTo(shelfX, shelfY + shelfH + 15);
  ctx.closePath();
  ctx.fill();

  // Clam Shell with Pearl on Left Shelf
  drawClamShell(ctx, shelfX + shelfW * 0.45, shelfY + 4, state, time);
  ctx.restore();

  // 3. Pink Coral Reef on bottom-left
  drawCoral(ctx, w * 0.08, h - 35, '#f43f5e', '#fb7185', 0.9, time);

  // 4. Red Coral on center-left
  drawCoral(ctx, w * 0.36, h - 35, '#ef4444', '#f87171', 0.85, time + 1);

  // 5. Emerald Swaying Seaweed / Kelp on left and right borders
  drawSeaweed(ctx, w * 0.03, h - 25, 6, '#10b981', '#059669', time);
  drawSeaweed(ctx, w * 0.93, h - 30, 7, '#10b981', '#059669', time + 1.5);
  drawSeaweed(ctx, w * 0.96, h - 25, 8, '#34d399', '#059669', time + 2);

  // 6. Grotto Stone Arch on bottom-left (near x=0.2)
  drawStoneArch(ctx, w * 0.2, h - 30, isNight);

  // 7. Golden Treasure Chest in bottom-center
  drawTreasureChest(ctx, w * 0.5, h - 45, state, time);

  // 8. Clam with Pearl in center-bottom sand
  drawClamShell(ctx, w * 0.44, h - 32, state, time + 2);

  // 9. Coral on bottom-right
  drawCoral(ctx, w * 0.68, h - 35, '#fb7185', '#f43f5e', 0.9, time + 0.8);

  // 10. Starfish on sand
  drawStarfish(ctx, w * 0.62, h - 30, '#f97316', 14);
  drawStarfish(ctx, w * 0.15, h - 24, '#fb923c', 11);
}

// Clam Shell with Glowing Pearl
function drawClamShell(ctx, x, y, state, time) {
  ctx.save();
  ctx.translate(x, y);

  // Slowly opening/closing
  const openAngle = 0.25 + Math.sin(time * 0.8) * 0.18;

  // Bottom Shell
  ctx.fillStyle = '#fce7f3';
  ctx.beginPath();
  ctx.ellipse(0, 5, 26, 14, 0, 0, Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Glowing Pearl inside
  ctx.save();
  const pearlGlow = ctx.createRadialGradient(0, 0, 2, 0, 0, 14);
  pearlGlow.addColorStop(0, '#ffffff');
  pearlGlow.addColorStop(0.4, '#e0f2fe');
  pearlGlow.addColorStop(1, 'rgba(186, 230, 253, 0)');
  ctx.fillStyle = pearlGlow;
  ctx.beginPath();
  ctx.arc(0, 0, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 0, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Top Shell (hinged up)
  ctx.save();
  ctx.rotate(-openAngle);
  ctx.fillStyle = '#fdf2f8';
  ctx.beginPath();
  ctx.ellipse(0, -6, 26, 14, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f472b6';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  ctx.restore();
}

// Treasure Chest
function drawTreasureChest(ctx, x, y, state, time) {
  ctx.save();
  ctx.translate(x, y);

  const isOpen = state.chestTimer > 0;
  if (state.chestTimer > 0) state.chestTimer--;

  // Base box
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.roundRect(-28, -5, 56, 32, [4, 4, 6, 6]);
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Golden bands
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-26, -5, 8, 32);
  ctx.fillRect(18, -5, 8, 32);

  // Keyhole lock
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(0, 10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#451a03';
  ctx.fillRect(-1.5, 9, 3, 6);

  // Chest Lid
  ctx.save();
  if (isOpen) {
    ctx.translate(0, -5);
    ctx.rotate(-0.4);

    // Glowing treasure inside
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(0, -2, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.roundRect(-28, -22, 56, 18, [12, 12, 2, 2]);
  ctx.fill();
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-26, -22, 8, 18);
  ctx.fillRect(18, -22, 8, 18);
  ctx.restore();

  ctx.restore();
}

// Coral Fan
function drawCoral(ctx, x, y, color1, color2, scale = 1, time) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const branches = [
    { x1: 0, y1: 0, x2: -15, y2: -35, x3: -25, y3: -50 },
    { x1: 0, y1: 0, x2: -5, y2: -42, x3: -10, y3: -65 },
    { x1: 0, y1: 0, x2: 8, y2: -38, x3: 15, y3: -60 },
    { x1: 0, y1: 0, x2: 20, y2: -30, x3: 32, y3: -45 },
  ];

  ctx.lineCap = 'round';
  ctx.strokeStyle = color1;
  ctx.lineWidth = 9;

  branches.forEach((b, i) => {
    const sway = Math.sin(time * 1.2 + i) * 3;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.y1);
    ctx.quadraticCurveTo(b.x2 + sway * 0.5, b.y2, b.x3 + sway, b.y3);
    ctx.stroke();

    // Tips
    ctx.fillStyle = color2;
    ctx.beginPath();
    ctx.arc(b.x3 + sway, b.y3, 5.5, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// Swaying Seaweed
function drawSeaweed(ctx, x, y, bladeCount, color1, color2, time) {
  ctx.save();
  ctx.translate(x, y);

  for (let i = 0; i < bladeCount; i++) {
    const bladeH = 70 + (i * 12);
    const offsetX = (i - bladeCount / 2) * 9;
    const sway = Math.sin(time * 1.5 + i * 0.8) * 16;

    ctx.strokeStyle = i % 2 === 0 ? color1 : color2;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(offsetX, 0);
    ctx.bezierCurveTo(
      offsetX + sway * 0.4,
      -bladeH * 0.35,
      offsetX - sway * 0.3,
      -bladeH * 0.7,
      offsetX + sway,
      -bladeH
    );
    ctx.stroke();
  }
  ctx.restore();
}

// Stone Arch
function drawStoneArch(ctx, x, y, isNight) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = isNight ? '#1e293b' : '#334155';

  // Base rocks
  ctx.beginPath();
  ctx.ellipse(-24, 0, 18, 16, 0, 0, Math.PI * 2);
  ctx.ellipse(24, 0, 18, 16, 0, 0, Math.PI * 2);
  ctx.fill();

  // Top arch rock
  ctx.fillStyle = isNight ? '#334155' : '#475569';
  ctx.beginPath();
  ctx.ellipse(0, -18, 34, 14, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cavity
  ctx.fillStyle = isNight ? '#0b1626' : '#1e293b';
  ctx.beginPath();
  ctx.ellipse(0, -2, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// Starfish
function drawStarfish(ctx, x, y, color, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const angle1 = (i * 2 * Math.PI) / 5 - Math.PI / 2;
    const angle2 = angle1 + Math.PI / 5;
    const x1 = Math.cos(angle1) * r;
    const y1 = Math.sin(angle1) * r;
    const x2 = Math.cos(angle2) * (r * 0.45);
    const y2 = Math.sin(angle2) * (r * 0.45);
    if (i === 0) ctx.moveTo(x1, y1);
    else ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// ---------------------- AMBIENT BUBBLES ----------------------
function drawBubbles(ctx, w, h, bubbles, time) {
  ctx.save();
  bubbles.forEach((b) => {
    b.y -= b.vy;
    if (b.y < -10) {
      b.y = h + 10;
      b.x = Math.random() * w;
    }

    const wobbleX = b.x + Math.sin(time * 2 + b.wobbleOffset) * 8;

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.fillStyle = 'rgba(224, 242, 254, 0.2)';

    ctx.beginPath();
    ctx.arc(wobbleX, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Bubble highlight glint
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath();
    ctx.arc(wobbleX - b.radius * 0.35, b.y - b.radius * 0.35, b.radius * 0.25, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// ---------------------- FOOD PELLETS ----------------------
function updateAndDrawFood(ctx, w, h, state, time) {
  const pellets = state.foodPellets;
  const fishList = state.fishList;

  for (let i = pellets.length - 1; i >= 0; i--) {
    const p = pellets[i];
    p.y += p.vy;
    p.x += p.vx + Math.sin(time * 3 + i) * 0.3;

    // Check if any fish eats this pellet
    let eaten = false;
    for (let f of fishList) {
      const mouthX = f.x + f.dir * 28;
      const mouthY = f.y;
      const dist = Math.hypot(p.x - mouthX, p.y - mouthY);

      if (dist < 32) {
        // Nom nom!
        eaten = true;
        f.mouthOpen = 1;
        f.scaleBounce = 1.25;
        sounds.playNom();

        // Particle crunch
        for (let k = 0; k < 6; k++) {
          state.particles.push({
            x: mouthX,
            y: mouthY,
            vx: (Math.random() - 0.5) * 3,
            vy: (Math.random() - 0.5) * 3,
            color: p.color,
            alpha: 1,
            size: 2.5,
          });
        }
        break;
      }
    }

    if (eaten || p.y > h - 40) {
      pellets.splice(i, 1);
      continue;
    }

    // Draw food flake
    ctx.save();
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------- FISH RENDERING & PHYSICS ----------------------
function updateAndDrawFish(ctx, w, h, state, nameVisibility, selectedStudentId, viewMode, time) {
  const fishList = state.fishList;
  const foodPellets = state.foodPellets;
  const hoveredId = state.hoveredFishId;

  fishList.forEach((fish) => {
    const s = fish.student || {};
    const points = viewMode === 'today' ? (s.todayPoints || 0) : (s.points || 0);

    // Dynamic fish size based on points (min 38px, max 85px)
    const baseRadius = 24 + Math.min(32, Math.sqrt(points) * 2.6);
    const currentRadius = baseRadius * (fish.scaleBounce || 1);

    // Decay scale bounce
    if (fish.scaleBounce > 1) {
      fish.scaleBounce = Math.max(1, fish.scaleBounce - 0.03);
    }
    if (fish.mouthOpen > 0) {
      fish.mouthOpen = Math.max(0, fish.mouthOpen - 0.08);
    }

    // 1. Food Attraction: If food exists, swim towards nearest food!
    let target = null;
    if (foodPellets.length > 0) {
      let closestDist = Infinity;
      foodPellets.forEach((p) => {
        const d = Math.hypot(p.x - fish.x, p.y - fish.y);
        if (d < 300 && d < closestDist) {
          closestDist = d;
          target = p;
        }
      });
    }

    if (target) {
      const angle = Math.atan2(target.y - fish.y, target.x - fish.x);
      fish.vx += Math.cos(angle) * 0.08;
      fish.vy += Math.sin(angle) * 0.08;
    } else {
      // Gentle wander
      fish.vx += (Math.random() - 0.5) * 0.06;
      fish.vy += (Math.random() - 0.5) * 0.04;
    }

    // Speed limits
    const maxSpd = target ? 2.2 : 1.3;
    const spd = Math.hypot(fish.vx, fish.vy);
    if (spd > maxSpd) {
      fish.vx = (fish.vx / spd) * maxSpd;
      fish.vy = (fish.vy / spd) * maxSpd;
    }

    // Move
    fish.x += fish.vx;
    fish.y += fish.vy;

    // Boundaries with smooth bounce
    const padX = currentRadius + 30;
    const padTop = currentRadius + 50;
    const padBottom = h - 65;

    if (fish.x < padX) {
      fish.x = padX;
      fish.vx = Math.abs(fish.vx) * 0.9;
    } else if (fish.x > w - padX) {
      fish.x = w - padX;
      fish.vx = -Math.abs(fish.vx) * 0.9;
    }

    if (fish.y < padTop) {
      fish.y = padTop;
      fish.vy = Math.abs(fish.vy) * 0.8;
    } else if (fish.y > padBottom) {
      fish.y = padBottom;
      fish.vy = -Math.abs(fish.vy) * 0.8;
    }

    // Facing direction
    if (Math.abs(fish.vx) > 0.15) {
      fish.dir = fish.vx > 0 ? 1 : -1;
    }

    // Tail fin wiggle
    fish.wigglePhase += 0.18 + spd * 0.1;

    // Draw this individual fish
    drawSingleFish(
      ctx,
      fish,
      s,
      currentRadius,
      nameVisibility,
      hoveredId === fish.id,
      selectedStudentId === fish.id,
      time
    );
  });
}

function drawSingleFish(ctx, fish, student, r, nameVisibility, isHovered, isSelected, time) {
  ctx.save();
  ctx.translate(fish.x, fish.y);

  // Flip horizontally according to swimming direction
  ctx.scale(fish.dir, 1);

  const color = student.fishColor || '#0ea5e9';
  const pattern = student.fishPattern || 'floral';
  const wiggle = Math.sin(fish.wigglePhase) * 0.28;
  const isTopRank = fish.rank <= 3;

  // Highlight Spotlight Ring
  if (isSelected || isHovered) {
    ctx.save();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.45, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // 1. Caudal (Tail) Fin (Swinging with sine wave)
  ctx.save();
  ctx.translate(-r * 0.85, 0);
  ctx.rotate(wiggle);

  const tailGrad = ctx.createLinearGradient(0, -r * 0.6, -r * 0.7, r * 0.6);
  tailGrad.addColorStop(0, color);
  tailGrad.addColorStop(1, '#ffffff');

  ctx.fillStyle = tailGrad;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-r * 0.6, -r * 0.8, -r * 1.1, -r * 0.5, -r * 0.9, 0);
  ctx.bezierCurveTo(-r * 1.1, r * 0.5, -r * 0.6, r * 0.8, 0, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Tail fin rays
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.8, -r * 0.3);
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.85, 0);
  ctx.moveTo(0, 0);
  ctx.lineTo(-r * 0.8, r * 0.3);
  ctx.stroke();
  ctx.restore();

  // 2. Dorsal Fin (Top)
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, -r * 0.65);
  ctx.quadraticCurveTo(0, -r * 1.15, r * 0.35, -r * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
  ctx.stroke();
  ctx.restore();

  // 3. Ventral Fin (Bottom)
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-r * 0.2, r * 0.65);
  ctx.quadraticCurveTo(r * 0.1, r * 1.05, r * 0.4, r * 0.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 4. Main Chubby Body
  ctx.save();
  const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.25, r * 0.2, 0, 0, r * 1.1);
  bodyGrad.addColorStop(0, '#ffffff');
  bodyGrad.addColorStop(0.3, color);
  bodyGrad.addColorStop(1, shadeColor(color, -25));

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  // Chubby cute body outline
  ctx.ellipse(0, 0, r * 1.05, r * 0.78, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(15, 23, 42, 0.2)';
  ctx.lineWidth = 1.8;
  ctx.stroke();
  ctx.restore();

  // 5. Body Patterns (Floral, Dots, Scales - as seen in reference image!)
  drawFishPatterns(ctx, pattern, r, color);

  // 6. Cute Anime Eye
  ctx.save();
  const eyeX = r * 0.5;
  const eyeY = -r * 0.15;
  const eyeR = r * 0.24;

  // White eye sclera
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
  ctx.fill();

  // Black iris
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(eyeX + 1.5, eyeY, eyeR * 0.75, 0, Math.PI * 2);
  ctx.fill();

  // Primary white glossy glint
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(eyeX + 2.5, eyeY - eyeR * 0.25, eyeR * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Secondary tiny reflection
  ctx.beginPath();
  ctx.arc(eyeX, eyeY + eyeR * 0.25, eyeR * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 7. Cheerful Mouth (Opens when eating)
  ctx.save();
  const mouthOpen = fish.mouthOpen || 0;
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  if (mouthOpen > 0.1) {
    ctx.fillStyle = '#f43f5e';
    ctx.ellipse(r * 0.95, r * 0.1, r * 0.14, r * 0.18 * mouthOpen, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.arc(r * 0.88, r * 0.08, 6, 0.1, Math.PI * 0.75);
    ctx.stroke();
  }
  ctx.restore();

  // 8. Rosy Cheek Blush
  ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
  ctx.beginPath();
  ctx.ellipse(r * 0.35, r * 0.2, r * 0.2, r * 0.13, 0, 0, Math.PI * 2);
  ctx.fill();

  // 9. Pectoral Fin (Front fin gently flapping)
  ctx.save();
  const finFlap = Math.sin(fish.wigglePhase * 1.3) * 0.35;
  ctx.translate(r * 0.1, r * 0.15);
  ctx.rotate(finFlap);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 0.32, r * 0.2, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  // 10. Royal Crown for Top 3 Students (Gold, Silver, Bronze)
  if (isTopRank) {
    drawRoyalCrown(ctx, fish.rank, r);
  }

  ctx.restore(); // Restore flip scale

  // 11. Student Name Tag (Never flipped horizontally so text stays upright!)
  const showName =
    nameVisibility === 'always' ||
    (nameVisibility === 'hover' && isHovered) ||
    isSelected;

  if (showName) {
    drawStudentNameTag(ctx, fish.x, fish.y - r * 0.9 - 18, student.name, fish.rank);
  }
}

// Patterns on Fish Body (Floral / Dots / Scales)
function drawFishPatterns(ctx, pattern, r, baseColor) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';

  if (pattern === 'floral') {
    // 3 small cute flower rosettes on the flank
    const flowerCenters = [
      { x: -r * 0.3, y: -r * 0.1 },
      { x: -r * 0.05, y: -r * 0.25 },
      { x: -r * 0.15, y: r * 0.2 },
    ];
    flowerCenters.forEach((fc) => {
      // 5 petals
      for (let p = 0; p < 5; p++) {
        const a = (p * Math.PI * 2) / 5;
        ctx.beginPath();
        ctx.arc(fc.x + Math.cos(a) * (r * 0.1), fc.y + Math.sin(a) * (r * 0.1), r * 0.07, 0, Math.PI * 2);
        ctx.fill();
      }
      // Center
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(fc.x, fc.y, r * 0.05, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    });
  } else if (pattern === 'dots') {
    const dots = [
      { x: -r * 0.4, y: -r * 0.2, s: 0.08 },
      { x: -r * 0.2, y: -r * 0.1, s: 0.1 },
      { x: -r * 0.45, y: r * 0.15, s: 0.07 },
      { x: -r * 0.15, y: r * 0.2, s: 0.09 },
      { x: 0, y: -r * 0.2, s: 0.08 },
    ];
    dots.forEach((d) => {
      ctx.beginPath();
      ctx.arc(d.x, d.y, r * d.s, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (pattern === 'scales') {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1.5;
    [-r * 0.35, -r * 0.1, r * 0.1].forEach((colX) => {
      [-r * 0.2, 0, r * 0.2].forEach((rowY) => {
        ctx.beginPath();
        ctx.arc(colX, rowY, r * 0.14, Math.PI * 0.5, Math.PI * 1.5);
        ctx.stroke();
      });
    });
  }
  ctx.restore();
}

// Royal Crown for 1st, 2nd, and 3rd rank
function drawRoyalCrown(ctx, rank, r) {
  ctx.save();
  ctx.translate(r * 0.15, -r * 0.88);

  let crownColor = '#fbbf24'; // Gold
  let jewelColor = '#ef4444'; // Ruby
  if (rank === 2) {
    crownColor = '#e2e8f0'; // Silver
    jewelColor = '#0ea5e9'; // Sapphire
  } else if (rank === 3) {
    crownColor = '#f97316'; // Bronze
    jewelColor = '#10b981'; // Emerald
  }

  // 5-Point Crown
  ctx.fillStyle = crownColor;
  ctx.beginPath();
  ctx.moveTo(-16, 6);
  ctx.lineTo(-18, -10);
  ctx.lineTo(-9, -2);
  ctx.lineTo(0, -15);
  ctx.lineTo(9, -2);
  ctx.lineTo(18, -10);
  ctx.lineTo(16, 6);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Jewels
  ctx.fillStyle = jewelColor;
  [-11, 0, 11].forEach((jx) => {
    ctx.beginPath();
    ctx.arc(jx, 2, 2.5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top pearl balls
  ctx.fillStyle = '#ffffff';
  [-18, 0, 18].forEach((bx, idx) => {
    const by = idx === 1 ? -15 : -10;
    ctx.beginPath();
    ctx.arc(bx, by, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.restore();
}

// Student Name Tag Banner
function drawStudentNameTag(ctx, x, y, name = '', rank = 999) {
  ctx.save();
  ctx.font = 'bold 12px "Inter", "Fredoka", sans-serif';
  const textWidth = ctx.measureText(name).width;
  const paddingX = 14;
  const pillW = textWidth + paddingX * 2;
  const pillH = 22;

  // Dark glassy pill background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.beginPath();
  ctx.roundRect(x - pillW / 2, y - pillH / 2, pillW, pillH, 11);
  ctx.fill();

  ctx.strokeStyle = rank <= 3 ? '#fbbf24' : 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.2;
  ctx.stroke();

  // White text
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(name, x, y);
  ctx.restore();
}

// Floating score badges & sparkle particles
function drawFloatingBadges(ctx, state) {
  const badges = state.floatingBadges;
  for (let i = badges.length - 1; i >= 0; i--) {
    const b = badges[i];
    b.y += b.vy;
    b.alpha -= 0.015;

    if (b.alpha <= 0) {
      badges.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, b.alpha);
    ctx.font = 'bold 15px "Fredoka", sans-serif';

    // Glow pill
    const txtW = ctx.measureText(b.text).width;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.beginPath();
    ctx.roundRect(b.x - txtW / 2 - 8, b.y - 12, txtW + 16, 24, 12);
    ctx.fill();

    ctx.strokeStyle = b.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = b.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(b.text, b.x, b.y);
    ctx.restore();
  }

  // Particle bursts
  const particles = state.particles;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.03;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.globalAlpha = Math.max(0, p.alpha);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Color shade utility
function shadeColor(color, percent) {
  let num = parseInt(color.replace('#', ''), 16);
  let amt = Math.round(2.55 * percent);
  let R = (num >> 16) + amt;
  let B = ((num >> 8) & 0x00ff) + amt;
  let G = (num & 0x0000ff) + amt;
  return (
    '#' +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (B < 255 ? (B < 1 ? 0 : B) : 255) * 0x100 +
      (G < 255 ? (G < 1 ? 0 : G) : 255)
    )
      .toString(16)
      .slice(1)
  );
}
