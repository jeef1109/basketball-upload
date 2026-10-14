// Original procedural music and basketball cues; no external audio downloads.
window.BasketballAudio = (() => {
  let context, master, music, effects, timer, enabled=false, step=0, nextTime=0, noiseBuffer;
  const beat=60/88;
  const chords=[[60,64,67,71],[57,60,64,67],[53,57,60,64],[55,59,62,65]];
  const melody=[0,2,1,3,2,1,3,2];
  const frequency=midi=>440*2**((midi-69)/12);
  function setup(){
    if(context)return;
    const Audio=window.AudioContext||window.webkitAudioContext;
    if(!Audio)throw new Error('Audio is unavailable');
    context=new Audio();master=context.createGain();master.gain.value=.65;
    const limiter=context.createDynamicsCompressor();limiter.threshold.value=-12;limiter.ratio.value=5;
    master.connect(limiter);limiter.connect(context.destination);
    music=context.createGain();music.gain.value=.32;music.connect(master);
    effects=context.createGain();effects.gain.value=.7;effects.connect(master);
    noiseBuffer=context.createBuffer(1,context.sampleRate,context.sampleRate);
    const data=noiseBuffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=Math.random()*2-1;
  }
  function note(freq,time,duration,volume,type='sine',bus=music,endFreq){
    const osc=context.createOscillator(),gain=context.createGain();osc.type=type;osc.frequency.setValueAtTime(freq,time);
    if(endFreq)osc.frequency.exponentialRampToValueAtTime(endFreq,time+duration);
    gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(volume,time+.008);
    gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    osc.connect(gain);gain.connect(bus);osc.start(time);osc.stop(time+duration+.02);
    osc.onended=()=>{osc.disconnect();gain.disconnect();};
  }
  function noise(time,duration,volume,frequency,endFrequency,bus=effects){
    const source=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();
    source.buffer=noiseBuffer;filter.type='bandpass';filter.Q.value=.7;
    filter.frequency.setValueAtTime(frequency,time);filter.frequency.exponentialRampToValueAtTime(endFrequency,time+duration);
    gain.gain.setValueAtTime(.0001,time);gain.gain.exponentialRampToValueAtTime(volume,time+.035);gain.gain.exponentialRampToValueAtTime(.0001,time+duration);
    source.connect(filter);filter.connect(gain);gain.connect(bus);source.start(time);source.stop(time+duration+.02);
    source.onended=()=>{source.disconnect();filter.disconnect();gain.disconnect();};
  }
  function schedule(){
    if(!enabled||context.state!=='running')return;
    while(nextTime<context.currentTime+.15){
      const chord=chords[Math.floor(step/8)%4],slot=step%8;
      const pitch=frequency(chord[melody[slot]]+12);
      // Plucked keys, a warm bass line, and a restrained brushed beat.
      if(slot!==7){note(pitch,nextTime,.44,.105);note(pitch*2,nextTime,.16,.018);}
      if(slot===0||slot===4)note(frequency(chord[0]-24),nextTime,.72,.18,'triangle');
      if(slot%4===0)note(105,nextTime,.14,.12,'sine',music,42);
      if(slot===2||slot===6)noise(nextTime,.09,.038,1800,850,music);
      noise(nextTime,.035,.012,6500,4800,music);
      step++;nextTime+=beat/2;
    }
  }
  function start(){clearInterval(timer);nextTime=context.currentTime+.04;schedule();timer=setInterval(schedule,45);}
  async function toggle(){
    setup();
    if(enabled){enabled=false;clearInterval(timer);await context.suspend();return false;}
    await context.resume();enabled=true;start();return true;
  }
  function cue(kind){
    if(!enabled||!context||context.state!=='running')return;
    const t=context.currentTime;
    if(kind==='throw')noise(t,.23,.16,650,2700);
    if(kind==='score'){
      noise(t,.26,.22,4200,650);
      noise(t+.08,.16,.09,2200,500);
      note(820,t,.085,.045,'sine',effects,530);
      [72,76,79].forEach((n,i)=>note(frequency(n),t+.10+i*.075,.30,.095,'sine',effects));
      music.gain.cancelScheduledValues(t);music.gain.setValueAtTime(.15,t);music.gain.linearRampToValueAtTime(.32,t+.65);
    }
  }
  document.addEventListener('visibilitychange',async()=>{
    if(!context||!enabled)return;
    clearInterval(timer);
    try{if(document.hidden)await context.suspend();else{await context.resume();if(enabled)start();}}catch{}
  });
  return {toggle,cue};
})();
