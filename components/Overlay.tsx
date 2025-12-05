import React, { useRef, useEffect, useState } from 'react';
import { ParticleData, ParticleType, TreeState } from '../types';

interface OverlayProps {
  hasPermission: boolean;
  onGrantPermission: () => void;
  treeState: TreeState;
  setTreeState: (state: TreeState) => void;
  selectedPhoto: ParticleData | null;
  onClosePhoto: () => void;
  onStartSelfie: () => void;
  isSelfieMode: boolean;
  onReward: () => void;
  isRewardMode: boolean;
}

export const Overlay: React.FC<OverlayProps> = ({
  hasPermission,
  onGrantPermission,
  treeState,
  setTreeState,
  selectedPhoto,
  onClosePhoto,
  onStartSelfie,
  isSelfieMode,
  onReward,
  isRewardMode
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  // Gesture State
  const recognizerRef = useRef<any>(null);
  const [gestureLoaded, setGestureLoaded] = useState(false);
  const [lastGesture, setLastGesture] = useState<string>('None');
  const requestRef = useRef<number | null>(null);

  // 1. Initialize Camera Stream Once
  useEffect(() => {
    let isMounted = true;

    // Check if mediaDevices exists (it might be undefined in insecure contexts)
    if (hasPermission && !streamRef.current && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
       navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: 320, height: 240 } })
         .then(stream => {
            if (!isMounted) {
                stream.getTracks().forEach(t => t.stop());
                return;
            }
            streamRef.current = stream;
            
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play().catch(e => console.warn("Autoplay blocked:", e));
            }
         })
         .catch(err => console.error("Camera access error:", err));
    }

    return () => {
        isMounted = false;
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };
  }, [hasPermission]);

  // 2. Initialize Gesture Recognizer Dynamically
  useEffect(() => {
    if (!hasPermission) return;

    const loadRecognizer = async () => {
        try {
            console.log("Loading Gesture Recognizer...");
            // Dynamic import to prevent crash if module fails to load immediately
            const { FilesetResolver, GestureRecognizer } = await import('@google/mediapipe-tasks-vision');
            
            const vision = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@google/mediapipe-tasks-vision@0.10.14/wasm"
            );
            const recognizer = await GestureRecognizer.createFromOptions(vision, {
                baseOptions: {
                    modelAssetPath:
                        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
                    delegate: "GPU"
                },
                runningMode: "VIDEO",
                numHands: 1
            });
            recognizerRef.current = recognizer;
            setGestureLoaded(true);
            console.log("Gesture Recognizer Loaded Successfully");
        } catch (error) {
            console.error("Failed to load gesture recognizer:", error);
        }
    };

    loadRecognizer();
  }, [hasPermission]);

  // 3. Gesture Detection Loop
  const detectGesture = () => {
      const video = videoRef.current;
      const recognizer = recognizerRef.current;
      
      if (video && recognizer && gestureLoaded && video.readyState === 4 && !selectedPhoto && !isSelfieMode) {
          try {
              const result = recognizer.recognizeForVideo(video, Date.now());
              
              if (result.gestures.length > 0) {
                  const category = result.gestures[0][0].categoryName;
                  const score = result.gestures[0][0].score;

                  if (score > 0.6) {
                      setLastGesture(category);

                      // Logic: Open Palm -> Scatter, Closed Fist -> Tree
                      if (category === 'Open_Palm' || category === 'Victory') {
                          if (treeState !== TreeState.SCATTERED) setTreeState(TreeState.SCATTERED);
                      } else if (category === 'Closed_Fist' || category === 'Thumb_Up') {
                          if (treeState !== TreeState.TREE_SHAPE) setTreeState(TreeState.TREE_SHAPE);
                      }
                  }
              } else {
                  setLastGesture('None');
              }
          } catch (e) {
              console.warn("Recognition error", e);
          }
      }
      requestRef.current = requestAnimationFrame(detectGesture);
  };

  useEffect(() => {
      if (gestureLoaded && hasPermission) {
          requestRef.current = requestAnimationFrame(detectGesture);
      }
      return () => {
          if (requestRef.current) cancelAnimationFrame(requestRef.current);
      }
  }, [gestureLoaded, hasPermission, treeState, isSelfieMode, selectedPhoto]);


  // 4. Re-attach stream when view changes
  useEffect(() => {
    const videoEl = videoRef.current;
    const stream = streamRef.current;

    if (videoEl && stream) {
        if (videoEl.srcObject !== stream) {
            videoEl.srcObject = stream;
            videoEl.play().catch(e => console.warn("Video play interrupted:", e));
        }
    }
  }, [isSelfieMode, treeState, hasPermission, gestureLoaded]); 

  // --- RENDERING ---

  // SCREEN 1: Privacy
  if (!hasPermission) {
    return (
      <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black text-white p-8 text-center bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">
        <div className="max-w-xl border border-[#FFD700]/30 p-8 rounded-2xl bg-black/80 backdrop-blur-xl shadow-[0_0_50px_rgba(255,215,0,0.2)]">
            <h1 className="text-4xl md:text-5xl mb-2 text-[#FFD700] luxury-font tracking-wider">MERRY CHRISTMAS</h1>
            <h2 className="text-xl mb-8 text-[#FF5500] font-light tracking-[0.2em] uppercase">Jackery Signature Experience</h2>
            
            <p className="text-gray-400 text-sm mb-8 max-w-md mx-auto">
                Enable your camera to experience the magic.<br/>
                Use <b>Open Hand</b> to scatter the tree, <b>Fist</b> to restore it.
            </p>

            <button 
                onClick={onGrantPermission}
                className="px-10 py-4 bg-[#FF5500] text-white font-bold rounded-full transition-all hover:scale-105 shadow-[0_0_30px_rgba(255,85,0,0.5)]"
            >
                ENABLE CAMERA
            </button>
        </div>
      </div>
    );
  }

  // SCREEN 4: Reward
  if (isRewardMode) {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-white p-6">
            <h1 className="text-4xl text-[#FFD700] mb-2 luxury-font">CONGRATULATIONS</h1>
            <div className="bg-[#002211] p-8 rounded-xl gold-border text-center max-w-md w-full">
                <p className="text-sm text-gray-400 mb-2">Reward Code:</p>
                <div className="bg-black/40 p-4 rounded border border-[#FF5500] mb-4">
                    <code className="text-3xl text-[#FFD700] font-mono">JACKERY-XMAS</code>
                </div>
            </div>
            <button onClick={() => window.location.reload()} className="mt-8 text-white/50 hover:text-white uppercase tracking-widest text-xs">
                Back to Tree
            </button>
        </div>
      )
  }

  // SCREEN 3: Selfie
  if (isSelfieMode) {
      return (
        <div className="absolute inset-0 z-50 flex flex-col items-center bg-black/90 p-4">
             <div className="text-[#FFD700] luxury-font text-xl mt-4 mb-2">SELFIE MODE</div>
             <div className="relative w-full max-w-md aspect-[3/4] border-8 border-[#FFD700] rounded-lg overflow-hidden bg-black">
                 <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
                 {selectedPhoto && (
                   <img src={selectedPhoto.textureUrl} className="absolute bottom-6 right-6 w-1/3 border-4 border-white rotate-6 shadow-2xl" alt="Clue" />
                 )}
                 <div className="absolute top-4 left-4 bg-[#FF5500] px-3 py-1 text-white font-bold text-sm shadow-lg rotate-[-2deg]">#JackeryChristmas</div>
             </div>
             <div className="mt-8 flex gap-6">
                 <button onClick={onReward} className="w-16 h-16 rounded-full border-4 border-white flex items-center justify-center hover:bg-white/20">
                    <div className="w-12 h-12 bg-[#FF5500] rounded-full"></div>
                 </button>
                 <button onClick={onClosePhoto} className="absolute top-6 right-6 text-white/70">CLOSE</button>
             </div>
        </div>
      );
  }

  // SCREEN 2: HUD
  return (
    <div className="absolute inset-0 z-10 pointer-events-none select-none">
      {/* Controls */}
      <div className="absolute bottom-10 right-6 pointer-events-auto flex flex-col items-center gap-4">
           {/* Camera Feedback & Gesture Status */}
           <div className={`relative w-20 h-24 rounded border border-white/20 bg-black overflow-hidden shadow-lg transition-all duration-500 ${treeState === TreeState.SCATTERED ? 'border-[#FF5500] shadow-[#FF5500]/50' : 'border-white/20'}`}>
                <video ref={videoRef} className="w-full h-full object-cover opacity-60 transform scale-x-[-1]" autoPlay playsInline muted />
                
                {/* Gesture Loading / Active Indicator */}
                <div className="absolute bottom-0 w-full bg-black/60 text-[8px] text-center text-white py-1 uppercase">
                    {!gestureLoaded ? "Loading AI..." : lastGesture === "None" ? "No Hand" : lastGesture}
                </div>
           </div>

           {/* Manual / Gesture Button */}
           <button
                className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 relative group
                    ${treeState === TreeState.SCATTERED 
                        ? 'bg-[#FF5500] shadow-[0_0_60px_#FF5500] scale-110' 
                        : 'bg-black/40 border-2 border-[#FFD700] hover:bg-[#FFD700]/20'}
                `}
                onMouseDown={() => setTreeState(TreeState.SCATTERED)}
                onMouseUp={() => setTreeState(TreeState.TREE_SHAPE)}
                onTouchStart={() => setTreeState(TreeState.SCATTERED)}
                onTouchEnd={() => setTreeState(TreeState.TREE_SHAPE)}
           >
               <span className="text-3xl filter drop-shadow-lg z-10">
                   {treeState === TreeState.SCATTERED ? '🖐️' : '✊'}
               </span>
               
               {/* Pulse Ring */}
               <div className="absolute inset-0 rounded-full border border-white/20 animate-ping opacity-20"></div>
           </button>
           <p className="text-[#FFD700] text-[10px] font-bold tracking-widest uppercase text-center w-32">
               {treeState === TreeState.SCATTERED ? 'RELEASE TO FORM' : 'HOLD OR OPEN HAND'}
           </p>
      </div>

      {/* Hints */}
      <div className="absolute bottom-10 left-8 max-w-xs transition-opacity duration-500" style={{ opacity: treeState === TreeState.SCATTERED ? 1 : 0.6 }}>
          <h3 className="text-[#FFD700] luxury-font text-xl">
            {treeState === TreeState.SCATTERED ? "Find the Clue" : "Reveal Magic"}
          </h3>
          <p className="text-gray-400 text-xs mt-1 leading-relaxed">
             {treeState === TreeState.SCATTERED 
                ? "Tap the photo with #JackeryChristmas tag." 
                : "Show OPEN PALM to camera or hold button to scatter."}
          </p>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-md pointer-events-auto p-4 z-50">
            <div className="bg-[#002211] rounded-lg border border-[#FFD700]/50 max-w-sm w-full p-6 text-center shadow-2xl">
                <img src={selectedPhoto.textureUrl} alt="Memory" className="w-full h-64 object-cover mb-4 border-2 border-[#D4AF37]" />
                
                {selectedPhoto.type === ParticleType.PHOTO_CLUE ? (
                    <>
                        <h3 className="text-2xl text-[#FFD700] luxury-font mb-2">You Found It!</h3>
                        <p className="text-gray-400 text-xs mb-4">Capture a moment with Jackery.</p>
                        <button onClick={onStartSelfie} className="w-full py-3 bg-[#FF5500] text-white font-bold rounded mt-2 hover:bg-[#E04400] transition-colors">
                            UNLOCK REWARD
                        </button>
                    </>
                ) : (
                    <button onClick={onClosePhoto} className="w-full py-3 border border-white/20 text-white rounded hover:bg-white/10 mt-2">
                        CLOSE
                    </button>
                )}
            </div>
        </div>
      )}
    </div>
  );
};