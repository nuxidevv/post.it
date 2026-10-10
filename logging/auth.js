(function(global){
  'use strict';

  var CONFIG = {
    CLIENT_ID: '1558442996695957556',
    REDIRECT_URI: 'https://post-it-rho-bice.vercel.app',
    ADMIN_ID: '1535798111799091250'
  };

  var K_SESSION = 'postit_session';
  var K_AGE = 'postit_age_ok';

  function setCookie(name, value, days){
    var d = new Date();
    d.setTime(d.getTime() + days * 86400000);
    document.cookie = name + '=' + encodeURIComponent(value)
      + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax';
  }
  function getCookie(name){
    var parts = document.cookie ? document.cookie.split(';') : [];
    for (var i = 0; i < parts.length; i++){
      var c = parts[i].trim();
      if (c.indexOf(name + '=') === 0) return decodeURIComponent(c.substring(name.length + 1));
    }
    return null;
  }

  function saveSession(user){
    try { localStorage.setItem(K_SESSION, JSON.stringify(user)); } catch(e){}
  }
  function loadSession(){
    try {
      var raw = localStorage.getItem(K_SESSION);
      return raw ? JSON.parse(raw) : null;
    } catch(e){ return null; }
  }
  function clearSession(){
    try { localStorage.removeItem(K_SESSION); } catch(e){}
  }

  function login(){
    var url = 'https://discord.com/oauth2/authorize'
      + '?client_id=' + encodeURIComponent(CONFIG.CLIENT_ID)
      + '&redirect_uri=' + encodeURIComponent(CONFIG.REDIRECT_URI)
      + '&response_type=token'
      + '&scope=identify';
    window.location.href = url;
  }

  function hasCallback(){
    var h = window.location.hash || '';
    return h.indexOf('access_token=') !== -1 || h.indexOf('error=') !== -1;
  }

  function handleCallback(){
    return new Promise(function(resolve, reject){
      var hash = window.location.hash.replace(/^#/, '');
      if (!hash) return reject(new Error('Pas de donnees dans l\'URL'));

      var params = {};
      hash.split('&').forEach(function(p){
        var kv = p.split('=');
        if (kv[0]) params[kv[0]] = decodeURIComponent(kv[1] || '');
      });

      if (params.error){
        return reject(new Error(params.error_description || params.error));
      }
      if (!params.access_token){
        return reject(new Error('Token manquant'));
      }

      var token = params.access_token;

      fetch('https://discord.com/api/users/@me', {
        headers: { Authorization: 'Bearer ' + token }
      })
      .then(function(r){
        if (!r.ok) throw new Error('API Discord : ' + r.status);
        return r.json();
      })
      .then(function(user){
        if (!user.id) throw new Error('Utilisateur introuvable');

        var session = {
          id: user.id,
          username: user.username,
          discriminator: user.discriminator,
          avatar: user.avatar,
          isAdmin: user.id === CONFIG.ADMIN_ID,
          connectedAt: Date.now()
        };
        saveSession(session);

        try {
          window.history.replaceState({}, '',
            window.location.pathname + window.location.search);
        } catch(e){}

        resolve(session);
      })
      .catch(reject);
    });
  }

  function logout(){
    clearSession();
  }

  function getAgeOk(){ return getCookie(K_AGE) === '1'; }
  function setAgeOk(){ setCookie(K_AGE, '1', 30); }

  global.PostItAuth = {
    login: login,
    logout: logout,
    hasCallback: hasCallback,
    handleCallback: handleCallback,
    getUser: loadSession,
    getAgeOk: getAgeOk,
    setAgeOk: setAgeOk,
    CONFIG: CONFIG
  };

})(window);
