(()=>{
  const dialog=document.querySelector('#battleDialog');
  if(!dialog)return;

  // V0.23.4: stop relying on the browser's modal-dialog top layer.
  // Keep the <dialog> element for compatibility with existing code, but make
  // showModal/close behave like a normal fixed overlay. This avoids Android
  // browsers swallowing taps on controls inside a modal dialog.
  dialog.showModal=function(){
    if(dialog.hasAttribute('open'))return;
    dialog.setAttribute('open','');
    dialog.classList.add('battle-overlay-open');
    document.documentElement.classList.add('battle-overlay-active');
    document.body.classList.add('battle-overlay-active');
    dialog.dispatchEvent(new Event('battleoverlayopen'));
  };

  dialog.close=function(){
    if(!dialog.hasAttribute('open'))return;
    dialog.removeAttribute('open');
    dialog.classList.remove('battle-overlay-open');
    document.documentElement.classList.remove('battle-overlay-active');
    document.body.classList.remove('battle-overlay-active');
    dialog.dispatchEvent(new Event('close'));
  };
})();
