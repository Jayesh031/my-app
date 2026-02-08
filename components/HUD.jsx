// components/HUD.jsx
import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

export const HUD = ({ droneRef, battery }) => {
  const altRef = useRef();
  const speedRef = useRef();
  
  useFrame(() => {
    if (!droneRef.current || !altRef.current) return;
    const altitude = Math.max(0, droneRef.current.position.y).toFixed(1);
    const tiltX = Math.abs(droneRef.current.rotation.x);
    const tiltZ = Math.abs(droneRef.current.rotation.z);
    const speed = ((tiltX + tiltZ) * 60).toFixed(0); 

    altRef.current.innerText = `${altitude} m`;
    speedRef.current.innerText = `${speed} km/h`;
  });

  return (
    <Html fullscreen style={{ pointerEvents: "none" }}>
      {/* Top Bar: Mission Status */}
      <div style={topBarStyle}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
             <div style={statusDot(battery > 20 ? "#00e0ff" : "red")}></div>
             <span>CONNECTED_V2</span>
        </div>
        <div>MANUAL_OVERRIDE</div>
      </div>

      {/* Bottom Dashboard */}
      <div style={dashboardContainer}>
        
        {/* Left Card: Telemetry */}
        <div style={glassCard}>
           <div style={labelStyle}>ALTITUDE (AGL)</div>
           <div style={valueStyle} ref={altRef}>0.0 m</div>
           
           <div style={{...labelStyle, marginTop:'15px'}}>GROUND SPEED</div>
           <div style={valueStyle} ref={speedRef}>0 km/h</div>
        </div>

        {/* Center: Attitude Indicator (Visual only for now) */}
        <div style={{ ...glassCard, width:'200px', display:'flex', alignItems:'center', justifyContent:'center', opacity:0.8 }}>
             <div style={{border:'2px solid rgba(255,255,255,0.2)', width:'100%', height:'1px', position:'absolute'}}></div>
             <div style={{border:'2px solid rgba(255,255,255,0.2)', height:'40px', width:'1px', position:'absolute'}}></div>
             <span style={{fontSize:'10px', color:'rgba(255,255,255,0.5)', marginTop:'50px'}}>ATTITUDE</span>
        </div>

        {/* Right Card: Power */}
        <div style={glassCard}>
           <div style={labelStyle}>BATTERY LEVEL</div>
           <div style={{ ...valueStyle, color: battery < 20 ? "#ff4d4d" : "white" }}>
              {battery.toFixed(0)}%
           </div>
           {/* Modern Battery Bar */}
           <div style={{width:'100%', height:'6px', background:'rgba(255,255,255,0.1)', borderRadius:'3px', marginTop:'10px', overflow:'hidden'}}>
              <div style={{height:'100%', width:`${battery}%`, background: battery < 20 ? "#ff4d4d" : "linear-gradient(90deg, #00c6ff, #0072ff)"}}></div>
           </div>
        </div>

      </div>
    </Html>
  );
};

// --- MODERN STYLES ---
const font = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

const topBarStyle = {
    position: "absolute", top: 0, left: 0, width: "100%", padding: "20px 40px",
    display: "flex", justifyContent: "space-between",
    color: "rgba(255,255,255,0.7)", fontFamily: font, fontSize: "12px", letterSpacing: "1px",
    background: "linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)"
};

const statusDot = (color) => ({
    width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 10px ${color}`
});

const dashboardContainer = {
    position: "absolute", bottom: 40, left: "50%", transform: "translateX(-50%)",
    display: "flex", gap: "20px", alignItems: "flex-end"
};

const glassCard = {
    background: "rgba(20, 20, 30, 0.6)", // Dark translucent
    backdropFilter: "blur(20px)",         // The Blur Effect (Glass)
    WebkitBackdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    borderRadius: "16px",
    padding: "20px",
    width: "160px",
    fontFamily: font,
    boxShadow: "0 10px 40px rgba(0,0,0,0.3)"
};

const labelStyle = { fontSize: "10px", color: "rgba(255,255,255,0.5)", fontWeight: "600", letterSpacing: "1px" };
const valueStyle = { fontSize: "28px", color: "white", fontWeight: "500", marginTop: "5px" };