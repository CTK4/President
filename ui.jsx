/* ============================================================
   President Career Sim — UI PRIMITIVES
   Shared poster-style React components. Exported to window.
   ============================================================ */
(function(){
const { useState } = React;

/* color helpers */
function approvalColor(v){
  // diverging: low=red, 50=paper, high=blue. Steep curve so mid-range reads.
  if (v >= 50){
    const t = Math.min(1, (v - 50) / 22);
    return mix("#e7dcc4", "#2f6ea5", t);
  } else {
    const t = Math.min(1, (50 - v) / 22);
    return mix("#e7dcc4", "#c63f2a", t);
  }
}
function supportColor(v){
  if (v >= 50){ const t=(v-50)/50; return mix("#cdbf9f", "#4f7a52", t); }
  const t=(50-v)/50; return mix("#cdbf9f", "#b4452f", t);
}
function mix(a, b, t){
  const pa = hx(a), pb = hx(b);
  const r = Math.round(pa[0]+(pb[0]-pa[0])*t);
  const g = Math.round(pa[1]+(pb[1]-pa[1])*t);
  const bl= Math.round(pa[2]+(pb[2]-pa[2])*t);
  return `rgb(${r},${g},${bl})`;
}
function hx(h){ h=h.replace('#',''); return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)]; }

/* Halftone backdrop overlay */
function Halftone({ opacity=0.06, size=7, color="#1c1b18", className="" }){
  const style = {
    backgroundImage: `radial-gradient(${color} 1.1px, transparent 1.2px)`,
    backgroundSize: `${size}px ${size}px`,
    opacity,
  };
  return <div className={"halftone "+className} style={style} aria-hidden="true"></div>;
}

/* Poster button */
function PButton({ children, onClick, variant="ink", size="md", disabled, full, type }){
  const cls = ["pbtn", "pbtn-"+variant, "pbtn-"+size];
  if (full) cls.push("pbtn-full");
  if (disabled) cls.push("pbtn-disabled");
  return (
    <button type={type||"button"} className={cls.join(" ")} onClick={disabled?undefined:onClick} disabled={disabled}>
      <span className="pbtn-label">{children}</span>
    </button>
  );
}

/* Section eyebrow label */
function Eyebrow({ children, color }){
  return <div className="eyebrow" style={color?{color}:undefined}>{children}</div>;
}

/* Stat meter with track + fill */
function Meter({ label, value, max=100, suffix="", colorFn, accent, big, delta }){
  const pct = Math.max(0, Math.min(100, (value/max)*100));
  const fill = colorFn ? colorFn(value) : (accent || "#1c1b18");
  return (
    <div className={"meter"+(big?" meter-big":"")}>
      <div className="meter-head">
        <span className="meter-label">{label}</span>
        <span className="meter-val">
          {typeof value === "number" ? (Number.isInteger(value)?value:value.toFixed(1)) : value}{suffix}
          {delta!==undefined && delta!==0 && (
            <span className={"meter-delta "+(delta>0?"up":"down")}>{delta>0?"▲":"▼"}{Math.abs(delta).toFixed(1)}</span>
          )}
        </span>
      </div>
      <div className="meter-track">
        <div className="meter-fill" style={{ width: pct+"%", background: fill }}></div>
        <div className="meter-mark" style={{ left: "50%" }}></div>
      </div>
    </div>
  );
}

/* Plain stat chip */
function Stat({ label, value, suffix="", tone }){
  return (
    <div className={"stat"+(tone?" stat-"+tone:"")}>
      <div className="stat-val">{value}<span className="stat-suffix">{suffix}</span></div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

/* Seal / badge */
function Seal({ size=64, party }){
  const c = party ? party.color : "#1c1b18";
  return (
    <div className="seal" style={{ width:size, height:size, borderColor:c }}>
      <div className="seal-ring" style={{ borderColor:c }}></div>
      <div className="seal-star" style={{ color:c }}>★</div>
    </div>
  );
}

/* Card shell */
function Card({ children, className="", tone, onClick }){
  return <div className={"card"+(tone?" card-"+tone:"")+" "+className} onClick={onClick}>{children}</div>;
}

/* Persona / stakeholder avatar tile */
function Avatar({ initials, ideology=0, size=44 }){
  const c = ideology > 18 ? "#c63f2a" : ideology < -18 ? "#2f6ea5" : "#6b6457";
  return (
    <div className="avatar" style={{ width:size, height:size, background:c }}>
      <span>{initials}</span>
    </div>
  );
}

/* Delta pill */
function Delta({ v, suffix="" }){
  if (v === 0 || v === undefined) return <span className="dpill flat">±0{suffix}</span>;
  const up = v > 0;
  return <span className={"dpill "+(up?"up":"down")}>{up?"+":""}{(Number.isInteger(v)?v:v.toFixed(1))}{suffix}</span>;
}

window.UI = { approvalColor, supportColor, Halftone, PButton, Eyebrow, Meter, Stat, Seal, Card, Avatar, Delta };
})();
