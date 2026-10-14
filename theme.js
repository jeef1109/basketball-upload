(() => {
  const buttons=document.querySelectorAll('[data-theme-choice]');
  function apply(theme){
    document.body.dataset.theme=theme;
    buttons.forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.themeChoice===theme)));
    document.querySelector('meta[name="theme-color"]').content=theme==='collage'?'#d2c4a8':'#e9edf0';
  }
  let saved;try{saved=localStorage.getItem('basketball-theme');}catch{}
  apply(saved==='minimal'?'minimal':'collage');
  buttons.forEach(button=>button.addEventListener('click',()=>{
    const theme=button.dataset.themeChoice;apply(theme);
    try{localStorage.setItem('basketball-theme',theme);}catch{}
  }));
})();
