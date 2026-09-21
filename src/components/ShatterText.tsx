import { useEffect, useLayoutEffect, useRef } from "react";
import type { MotionValue } from "framer-motion";

interface ShatterTextProps {
  text: string;
  className?: string;
  /** Any valid CSS color (including a var(--token) or oklch()), sampled once to color the particles. */
  color?: string;
  /** Radius, in CSS px, within which the pointer blasts particles apart. */
  repelRadius?: number;
  /**
   * Optional 0+ signal (e.g. derived from scroll velocity) that blasts every
   * particle outward from the shape's centre, independent of the pointer.
   * Drop it back to 0 and particles spring back home — the same "reform" the
   * pointer-driven shatter uses.
   */
  scrollDisturbance?: MotionValue<number>;
  /**
   * Optional 0..1 signal (e.g. tied to scroll position) that reveals particles
   * left-to-right like a typewriter as it rises toward 1, and un-types them
   * right-to-left as it falls back toward 0. Omit to always show the full mark.
   */
  typeProgress?: MotionValue<number>;
}

interface Particle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  jitterX: number;
  jitterY: number;
}

const VERTEX_SHADER = `
  attribute vec2 a_position;
  attribute float a_reveal;
  uniform vec2 u_resolution;
  uniform float u_pointSize;
  varying float v_reveal;
  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 clipSpace = zeroToOne * 2.0 - 1.0;
    gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
    gl_PointSize = u_pointSize * a_reveal;
    v_reveal = a_reveal;
  }
`;

const FRAGMENT_SHADER = `
  precision mediump float;
  uniform vec4 u_color;
  varying float v_reveal;
  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;
    float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
    gl_FragColor = vec4(u_color.rgb, u_color.a * alpha * v_reveal);
  }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const program = gl.createProgram()!;
  gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER));
  gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
  gl.linkProgram(program);
  return program;
}

/** Parses any CSS color (var(), oklch(), etc.) into normalized RGBA via a 1x1 2D canvas probe. */
function resolveColor(cssColor: string): [number, number, number, number] {
  // Canvas fillStyle can't run the CSS cascade, so var(...) needs to be resolved
  // through a real (if invisible) DOM element first.
  const probeEl = document.createElement("div");
  probeEl.style.color = cssColor;
  probeEl.style.display = "none";
  document.body.appendChild(probeEl);
  const resolved = getComputedStyle(probeEl).color;
  document.body.removeChild(probeEl);

  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const ctx = probe.getContext("2d");
  if (!ctx) return [0.13, 0.2, 0.4, 1];
  ctx.fillStyle = resolved;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r / 255, g / 255, b / 255, a / 255];
}

/** Samples `text`'s glyph coverage on an offscreen 2D canvas into a field of particle origins. */
function sampleParticles(text: string, width: number, height: number, targetCount = 4200): Particle[] {
  const off = document.createElement("canvas");
  off.width = width;
  off.height = height;
  const ctx = off.getContext("2d");
  if (!ctx) return [];
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#000";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let fontPx = height * 0.78;
  ctx.font = `900 ${fontPx}px 'Inter', system-ui, sans-serif`;
  const measured = ctx.measureText(text).width;
  const maxWidth = width * 0.92;
  if (measured > maxWidth) {
    fontPx *= maxWidth / measured;
    ctx.font = `900 ${fontPx}px 'Inter', system-ui, sans-serif`;
  }
  ctx.fillText(text, width / 2, height / 2);

  const { data } = ctx.getImageData(0, 0, width, height);
  // Keep the particle count roughly constant across sizes: a bigger box gets a coarser step.
  const estimatedGlyphCoverage = 0.32;
  const step = Math.max(2, Math.round(Math.sqrt((width * height * estimatedGlyphCoverage) / targetCount)));
  const particles: Particle[] = [];
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 120) {
        particles.push({
          homeX: x,
          homeY: y,
          x,
          y,
          vx: 0,
          vy: 0,
          jitterX: (Math.random() - 0.5) * 2,
          jitterY: (Math.random() - 0.5) * 2,
        });
      }
    }
  }
  return particles;
}

/**
 * Renders `text` as a field of WebGL points sampled from its glyph shapes.
 * Points blast apart when the pointer gets close (a "shatter") and spring
 * back to their sampled position once the pointer moves away (a "reform").
 */
export default function ShatterText({
  text,
  className = "",
  color = "var(--primary)",
  repelRadius = 46,
  scrollDisturbance,
  typeProgress,
}: ShatterTextProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const dprRef = useRef(1);
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({ x: -9999, y: -9999, active: false });
  const scrollForceRef = useRef(0);
  const typeProgressRef = useRef(1);

  useEffect(() => {
    if (!scrollDisturbance) return;
    scrollForceRef.current = scrollDisturbance.get();
    return scrollDisturbance.on("change", (v) => {
      scrollForceRef.current = v;
    });
  }, [scrollDisturbance]);

  useEffect(() => {
    if (!typeProgress) {
      typeProgressRef.current = 1;
      return;
    }
    typeProgressRef.current = typeProgress.get();
    return typeProgress.on("change", (v) => {
      typeProgressRef.current = v;
    });
  }, [typeProgress]);

  const glStateRef = useRef<{
    gl: WebGLRenderingContext;
    positionBuffer: WebGLBuffer;
    positionLocation: number;
    revealBuffer: WebGLBuffer;
    revealLocation: number;
    resolutionLocation: WebGLUniformLocation;
    pointSizeLocation: WebGLUniformLocation;
  } | null>(null);

  // Create the GL program once. Recreated only if the color token changes.
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: false });
    if (!gl) return;

    const rgba = resolveColor(color);
    const program = createProgram(gl);
    gl.useProgram(program);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const positionBuffer = gl.createBuffer()!;
    const positionLocation = gl.getAttribLocation(program, "a_position");
    const revealBuffer = gl.createBuffer()!;
    const revealLocation = gl.getAttribLocation(program, "a_reveal");
    const resolutionLocation = gl.getUniformLocation(program, "u_resolution")!;
    const pointSizeLocation = gl.getUniformLocation(program, "u_pointSize")!;
    const colorLocation = gl.getUniformLocation(program, "u_color")!;
    gl.uniform4f(colorLocation, rgba[0], rgba[1], rgba[2], rgba[3]);

    glStateRef.current = { gl, positionBuffer, positionLocation, revealBuffer, revealLocation, resolutionLocation, pointSizeLocation };

    return () => {
      gl.deleteBuffer(positionBuffer);
      gl.deleteBuffer(revealBuffer);
      gl.deleteProgram(program);
      glStateRef.current = null;
    };
  }, [color]);

  // Resample the glyph field and resize the GL viewport whenever the box changes size.
  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    function handleResize(cssWidth: number, cssHeight: number) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(cssWidth * dpr));
      const height = Math.max(1, Math.round(cssHeight * dpr));
      canvas!.width = width;
      canvas!.height = height;
      dprRef.current = dpr;
      particlesRef.current = sampleParticles(text, width, height);

      const state = glStateRef.current;
      if (state) {
        state.gl.viewport(0, 0, width, height);
        state.gl.uniform2f(state.resolutionLocation, width, height);
        // Bigger boxes get chunkier dots so the mark still reads clearly at watermark scale.
        const pointSize = Math.min(6, Math.max(1.8, cssWidth / 140)) * dpr;
        state.gl.uniform1f(state.pointSizeLocation, pointSize);
      }
    }

    const rect = wrapper.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) handleResize(rect.width, rect.height);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) handleResize(width, height);
    });
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [text]);

  // Physics + render loop: blast particles from the pointer, spring them back home.
  useEffect(() => {
    let frame: number;

    function tick() {
      const state = glStateRef.current;
      const canvas = canvasRef.current;
      const particles = particlesRef.current;
      if (state && canvas && particles.length) {
        const { gl, positionBuffer, positionLocation, revealBuffer, revealLocation } = state;
        const pointer = pointerRef.current;
        const radius = repelRadius * dprRef.current;
        const scrollForce = scrollForceRef.current;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const revealEdge = Math.max(1, canvas.width * 0.05);
        // Offset so progress=0 hides even the leftmost particle and progress=1 fully
        // reveals even the rightmost one (not just "reveal up to exactly canvas.width").
        const revealX = -revealEdge / 2 + typeProgressRef.current * (canvas.width + revealEdge);
        const positions = new Float32Array(particles.length * 2);
        const reveals = new Float32Array(particles.length);

        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const dist = Math.hypot(dx, dy) || 0.001;
            if (dist < radius) {
              const force = (1 - dist / radius) ** 2;
              const angle = Math.atan2(dy, dx);
              p.vx += (Math.cos(angle) + p.jitterX * 0.6) * force * 6.5;
              p.vy += (Math.sin(angle) + p.jitterY * 0.6) * force * 6.5;
            }
          }
          if (scrollForce > 0.01) {
            // Blast outward from the shape's own centre — a "destroy" pulse from scrolling.
            const ex = p.homeX - centerX + p.jitterX * 14;
            const ey = p.homeY - centerY + p.jitterY * 14;
            const edist = Math.hypot(ex, ey) || 0.001;
            p.vx += (ex / edist) * scrollForce;
            p.vy += (ey / edist) * scrollForce;
          }
          // Spring back toward the sampled glyph position.
          p.vx += (p.homeX - p.x) * 0.06;
          p.vy += (p.homeY - p.y) * 0.06;
          // Friction.
          p.vx *= 0.82;
          p.vy *= 0.82;
          p.x += p.vx;
          p.y += p.vy;

          positions[i * 2] = p.x;
          positions[i * 2 + 1] = p.y;
          // Typewriter reveal: particles to the left of the reveal edge are shown,
          // ones to the right fade/shrink out — reversible, so scrolling back up
          // un-types it right-to-left just as naturally.
          reveals[i] = Math.max(0, Math.min(1, (revealX - p.homeX) / revealEdge + 0.5));
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, revealBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, reveals, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(revealLocation);
        gl.vertexAttribPointer(revealLocation, 1, gl.FLOAT, false, 0, 0);

        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.drawArrays(gl.POINTS, 0, particles.length);
      }
      frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [repelRadius]);

  // Track the pointer at window level, not via onPointerMove on our own wrapper: when this
  // sits behind foreground content, that content — not us — is the hit-test target, but the
  // move event still reaches a window listener regardless of what visually sits on top.
  useEffect(() => {
    function handleMove(event: PointerEvent) {
      const canvas = canvasRef.current;
      const wrapper = wrapperRef.current;
      if (!canvas || !wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      pointerRef.current = {
        x: (event.clientX - rect.left) * scaleX,
        y: (event.clientY - rect.top) * scaleY,
        active: true,
      };
    }
    function handleLeave() {
      pointerRef.current.active = false;
    }

    window.addEventListener("pointermove", handleMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", handleLeave);
    window.addEventListener("blur", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.removeEventListener("mouseleave", handleLeave);
      window.removeEventListener("blur", handleLeave);
    };
  }, []);

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
      <span className="sr-only">{text}</span>
    </div>
  );
}
