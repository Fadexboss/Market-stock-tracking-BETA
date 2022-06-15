const { ipcRenderer } = require('electron');

let loginBtn;
let username;
let password;

window.onload = function(){
  username = document.getElementById('username');
  password = document.getElementById('password');
  loginBtn = document.getElementById('loginBtn');

  loginBtn.onclick = function(){
    
    const obj = {username:username.value, password:password.value}
    
    ipcRenderer.invoke('login', obj);
  }
}

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
      const element = document.getElementById(selector)
      if (element) element.innerText = text
    }
  
    for (const type of ['chrome', 'node', 'electron']) {
      replaceText(`${type}-version`, process.versions[type])
    }
  })
  