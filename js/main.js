(function(){
  "use strict";

  /* ---- licensed media ---------------------------------------------------
     Every portrait is a photo in assets/people/ (in the repository). The
     hero band's three circles also have licensed video clips that exist only
     in the author's local build: on localhost they play, anywhere else the
     photo poster stays, so the published page never requests a file it
     doesn't have. */
  var LICENSED = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  function avatar(id){
    return "./assets/people/" + id + ".jpg";
  }
  if(LICENSED){
    document.querySelectorAll("video[data-media]").forEach(function(v){
      var k = v.getAttribute("data-media");
      v.poster = "./assets/video/" + k + ".jpg";
      v.src = "./assets/video/" + k + ".mp4";
    });
  }

  /* ---- YouTube, on request only --------------------------------------- */
  document.querySelectorAll("[data-yt-list]").forEach(function(box){
    var btn = box.querySelector(".yt-facade");
    if(!btn) return;
    btn.addEventListener("click", function(){
      var f = document.createElement("iframe");
      f.src = "https://www.youtube-nocookie.com/embed/videoseries?list="
            + box.getAttribute("data-yt-list") + "&cc_load_policy=1&autoplay=1";
      f.title = "HealthyGamerGG — latest videos";
      f.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      box.replaceChild(f, btn);
      f.focus();
    });
  });

  var STORE = "rehab.a11y";
  function prefs(){
    try{ return JSON.parse(localStorage.getItem(STORE)) || {}; }catch(e){ return {}; }
  }
  var saved = prefs();
  // the OS setting and the on-page switch both count
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || !!saved.motion;

  // components register how to stop themselves, so toggling motion off mid-visit
  // freezes everything without a reload
  var MOTION = { stoppers: [] };
  MOTION.onStop = function(fn){ MOTION.stoppers.push(fn); };
  MOTION.freeze = function(){
    MOTION.stoppers.forEach(function(f){ try{ f(); }catch(e){} });
    document.querySelectorAll("video").forEach(function(v){ v.pause(); });
    document.querySelectorAll("animate").forEach(function(a){
      var vals = (a.getAttribute("values") || "").split(";");
      var path = a.parentNode;
      if(path && vals.length > 3) path.setAttribute("d", vals[3].trim());
      a.remove();
    });
  };

  /* ---- loader ---------------------------------------------------------- */
  var loader = document.getElementById("loader");
  function hideLoader(){
    if(!loader || loader.classList.contains("done")) return;
    loader.classList.add("done");
    var h1 = document.getElementById("heroH1");
    typeIn(h1);
  }
  // Ambient entrance, not a real loading state: it always clears on its own clock.
  setTimeout(hideLoader, reduce ? 0 : 1600);
  setTimeout(hideLoader, 3000); // hard fallback so the page can never stay covered

  /* ---- scroll progress hairline ---------------------------------------- */
  var bar = document.getElementById("progress"), ticking = false;
  function progress(){
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = "scaleX(" + (h > 0 ? Math.min(window.scrollY / h, 1) : 0) + ")";
    ticking = false;
  }
  window.addEventListener("scroll", function(){
    if(!ticking){ ticking = true; requestAnimationFrame(progress); }
  }, {passive:true});
  progress();

  /* ---- scroll reveal --------------------------------------------------- */
  var revealables = document.querySelectorAll(".rv");
  if(reduce || !("IntersectionObserver" in window)){
    revealables.forEach(function(el){ el.classList.add("in"); typeIn(el.querySelector(".hero-h1")); });
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.classList.add("in");
          typeIn(e.target.querySelector(".hero-h1"));
          io.unobserve(e.target);
        }
      });
    }, {rootMargin:"0px 0px -12% 0px", threshold:0.06});
    revealables.forEach(function(el){ io.observe(el); });
    // belt and braces: content in view must never stay hidden
    window.addEventListener("load", function(){
      setTimeout(function(){
        revealables.forEach(function(el){
          var r = el.getBoundingClientRect();
          if(r.top < window.innerHeight && r.bottom > 0) el.classList.add("in");
        });
      }, 1200);
    });
  }

  /* ---- the panel, rebuilt from data ---------------------
     Why this kept "not landing": A/B/C are the squares in the left rail, and
     those were plain <i> elements inside an aria-hidden container with no
     handler at all — never clickable. The buttons that WERE wired were the
     channel names, which are hidden below 900px. So the rail is now the
     space switcher (four spaces, each with its own channels, members and
     conversations), the channel list stays switchable inside each space, and
     both survive at narrow widths. Every person is clickable too. */
  var PEOPLE = {
    "Dr. Nowak":     {av:"a12", role:"specialist", title:"Psychiatrist",
                      focus:"Compulsive play · sleep collapse",
                      bio:"Fifteen years in adult psychiatry. Plays extraction shooters badly, and says so out loud."},
    "Dr. Adeyemi":   {av:"a13", role:"specialist", title:"Psychologist",
                      focus:"Teen isolation · school refusal",
                      bio:"Works mostly with under-18s and the adults around them. Runs the check-in hours."},
    "J. Lindqvist": {av:"a3",  role:"specialist", title:"Counsellor",
                      focus:"Group dynamics · moderation",
                      bio:"Designs how the rooms behave. Keeps the no-mic server no-mic."},
    "Tomek":     {av:"a5",  role:"player", status:"In a match",   game:"Extraction shooters"},
    "lena_":     {av:"a6",  role:"player", status:"Idle",         game:"Survival craft"},
    "Mika":      {av:"a2",  role:"player", status:"Online",       game:"Co-op shooters"},
    "krzys":     {av:"a7",  role:"player", status:"Online",       game:"Racing sims"},
    "ava.mp4":   {av:"a8",  role:"player", status:"Online",       game:"Rhythm games"},
    "sam_w":     {av:"a9",  role:"player", status:"Idle",         game:"Strategy"},
    "nadia.exe": {av:"a10", role:"player", status:"Online",       game:"Roguelikes"},
    "bruno":     {av:"a11", role:"player", status:"Offline",      game:"Story games"},
    "kai_":      {av:"a14", role:"player", status:"Online",       game:"Support mains"},
    "marta":     {av:"a15", role:"player", status:"Idle",         game:"Farming sims"},
    "dex":       {av:"a16", role:"player", status:"Offline",      game:"Fighting games"},
    "yusuf":     {av:"a17", role:"player", status:"Offline",      game:"MMOs"}
  };

  function m(who, text, rx, backlog){ return {who:who, text:text, rx:rx||null, backlog:!!backlog}; }

  var SPACES = [
    { key:"R", name:"guardian · eu-west",
      members:{ specialists:["Dr. Nowak","Dr. Adeyemi"],
                players:["Tomek","lena_","Mika","krzys","ava.mp4","sam_w","nadia.exe","bruno","kai_","marta","dex","yusuf"],
                count:26 },
      channels:[
        {id:"coop", label:"#co-op-lobby", status:"in a match · 12:04", typing:"krzys", msgs:[
          m("yusuf","anyone else getting packet loss on eu-west?",null,1),
          m("dex","was fine for me 10 min ago",null,1),
          m("lena_","restarted, it's better now",null,1),
          m("nadia.exe","ranked or casual tonight?",null,1),
          m("krzys","casual. i'm fried","😴 4",1),
          m("Tomek","queue in 5, one slot open"),
          m("Mika","anyone up for a run before bed?"),
          m("kai_","im in, swapping to support","👍 3"),
          m("Tomek","GG — that last push was clean","🔥 5"),
          m("Dr. Nowak","nice one. i'm tapping out at 22:00, #check-in is open if anyone wants it")
        ]},
        {id:"lounge", label:"#lounge", status:"24 chatting", typing:"ava.mp4", msgs:[
          m("bruno","ok who else stayed up for the showcase",null,1),
          m("marta","me. worth it",null,1),
          m("sam_w","the indie one at the end looked wild",null,1),
          m("dex","wishlisted instantly","👀 6",1),
          m("kai_","did they give a date?",null,1),
          m("lena_","new trailer dropped and it looks unreal"),
          m("ava.mp4","the soundtrack alone 😮‍💨","🎧 7"),
          m("bruno","reviews are mixed tho"),
          m("nadia.exe","mixed how? spoiler-free please","😅 2"),
          m("lena_","mostly pacing. still buying it day one")
        ]},
        {id:"checkin", label:"#check-in", guardian:true, status:"open · no pressure", typing:"Dr. Adeyemi", msgs:[
          m("Dr. Nowak","reminder that #quiet-room is always open, mic optional",null,1),
          m("sam_w","appreciate that",null,1),
          m("Dr. Adeyemi","how did the sleep thing go this week?",null,1),
          m("kai_","better. two nights under 1am","💪 5",1),
          m("Dr. Adeyemi","that's real progress. keep the wins where you can see them",null,1),
          m("Dr. Adeyemi","check-in is open for the next hour. drop in, or don't — both fine."),
          m("marta","rough week honestly. been playing till 4am most nights"),
          m("Dr. Adeyemi","that's worth talking about. here, or in #quiet-room?"),
          m("marta","here's fine"),
          m("Dr. Nowak","i'll keep the lobby running so nobody's waiting on you")
        ]}
      ]},

    { key:"A", name:"after-hours · eu",
      members:{ specialists:["Dr. Nowak"],
                players:["yusuf","marta","sam_w","dex","kai_","bruno","lena_"], count:14 },
      channels:[
        {id:"night", label:"#night-shift", guardian:true, status:"6 online · 02:40", typing:"dex", msgs:[
          m("yusuf","anyone still up",null,1),
          m("marta","always",null,1),
          m("sam_w","3am club checking in","🌙 3",1),
          m("Dr. Nowak","i'm around for another hour if anyone wants company",null,1),
          m("dex","can't sleep again"),
          m("Dr. Nowak","want to talk about it, or just have someone here?"),
          m("dex","second one"),
          m("Dr. Nowak","then we sit here. no agenda.","🤝 8")
        ]},
        {id:"wind", label:"#wind-down", status:"quiet", typing:"lena_", msgs:[
          m("bruno","putting on something slow",null,1),
          m("kai_","link?",null,1),
          m("bruno","the ambient playlist in #resources",null,1),
          m("lena_","this is genuinely helping"),
          m("nadia.exe","same","💤 4"),
          m("marta","first night this week i'm logging off before 1")
        ]}
      ]},

    { key:"B", name:"the quiet server",
      members:{ specialists:["J. Lindqvist","Dr. Adeyemi"],
                players:["ava.mp4","krzys","marta","sam_w","Tomek","nadia.exe"], count:11 },
      channels:[
        {id:"nomic", label:"#no-mic", guardian:true, status:"text only", typing:"marta", msgs:[
          m("J. Lindqvist","no voice in here, ever. that's the whole point.",null,1),
          m("ava.mp4","thank you","🙏 9",1),
          m("krzys","first server where i don't feel rushed",null,1),
          m("marta","can i just lurk"),
          m("J. Lindqvist","that's a completely normal way to use this place"),
          m("nadia.exe","been lurking three weeks. still counts.","💬 6")
        ]},
        {id:"reading", label:"#reading-room", status:"3 reading", typing:"sam_w", msgs:[
          m("Tomek","dropped the Oxford paper in here",null,1),
          m("Dr. Adeyemi","good one. the choice-vs-compulsion bit is worth reading twice",null,1),
          m("sam_w","halfway through"),
          m("Dr. Adeyemi","take it slow. no quiz at the end.","📚 5"),
          m("krzys","the 40,000 sample size surprised me")
        ]}
      ]},

    { key:"C", name:"first-timers",
      members:{ specialists:["Dr. Adeyemi","Dr. Nowak"],
                players:["kai_","nadia.exe","dex","bruno","yusuf","Mika"], count:38 },
      channels:[
        {id:"welcome", label:"#welcome", status:"12 new today", typing:"kai_", msgs:[
          m("Dr. Adeyemi","you don't have to introduce yourself. joining is enough.",null,1),
          m("nadia.exe","joined yesterday, still just reading",null,1),
          m("dex","same",null,1),
          m("Mika","week two and i finally said something","🎉 11",1),
          m("kai_","hi. not sure what to say"),
          m("Dr. Adeyemi","that's a fine start","👋 7")
        ]},
        {id:"ask", label:"#ask-anything", guardian:true, status:"open", typing:"Dr. Nowak", msgs:[
          m("bruno","is this actually therapy?",null,1),
          m("Dr. Nowak","no. it's a room with a professional in it. different thing, on purpose.",null,1),
          m("bruno","ok that's clearer",null,1),
          m("yusuf","what happens if someone's in real trouble"),
          m("Dr. Nowak","we stop playing and get them to real care. that's the one rule.","❤️ 14")
        ]}
      ]}
  ];

  (function(){
    var viz = document.getElementById("viz");
    if(!viz) return;
    var rail    = document.getElementById("vizRail"),
        tabsBox = document.getElementById("vizTabs"),
        nameEl  = document.getElementById("vizSpaceName"),
        panels  = document.getElementById("vizPanels"),
        barEl   = document.getElementById("vizBar"),
        statEl  = document.getElementById("vizStatus"),
        memBox  = document.getElementById("vizMembers"),
        typing  = document.getElementById("vizTyping"),
        typeNm  = document.getElementById("vizTypingName"),
        prof    = document.getElementById("vizProfile"),
        guardEl = document.getElementById("vizGuard"),
        flagBtn = document.getElementById("vizFlag"),
        tip     = document.getElementById("vizTip");
    var SHIELD = '<svg class="viz__shield" viewBox="0 0 12 14" aria-hidden="true" focusable="false">'
               + '<path d="M6 0 12 2.3v4.5C12 10.4 9.6 12.9 6 14 2.4 12.9 0 10.4 0 6.8V2.3z"/></svg>';
    var timers = [], space = null, chan = null, onScreen = false, lastOpener = null;

    function clear(){ timers.forEach(clearTimeout); timers = []; }
    function at(ms, fn){ timers.push(setTimeout(fn, ms)); }
    function esc(t){ return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }
    function spaceByKey(k){ return SPACES.filter(function(s){ return s.key===k; })[0]; }

    /* ---- person button: avatar + name, opens the profile ---------------- */
    function who(name, withName){
      var p = PEOPLE[name] || {av:"a1", role:"player"};
      var pro = p.role === "specialist";
      return '<button type="button" class="who' + (pro ? " who--pro" : "") + '" data-who="' + esc(name) + '"'
           + ' aria-label="Open profile for ' + esc(name) + '">'
           + '<img class="av" src="' + avatar(p.av) + '" alt="">'
           + (withName ? '<span>' + esc(name) + '</span>' : '')
           + '</button>';
    }

    function msgHTML(msg){
      var p = PEOPLE[msg.who] || {};
      var pro = p.role === "specialist";
      return '<div class="msg' + (msg.backlog ? " on" : "") + '"' + (msg.backlog ? ' data-backlog="1"' : "")
           + ' data-who="' + esc(msg.who) + '">'
           + who(msg.who, false)
           + '<div class="body">'
           +   '<div class="msg__head"><button type="button" class="msg__name' + (pro ? " pro" : "") + '" data-who="' + esc(msg.who) + '">'
           +     esc(msg.who) + '</button>'
           +   (pro ? '<button type="button" class="vbadge" aria-describedby="vizTip">Verified specialist</button>' : '')
           +   '</div>'
           +   '<p>' + esc(msg.text) + '</p>'
           +   (msg.rx ? '<span class="rx">' + esc(msg.rx) + '</span>' : "")
           + '</div></div>';
    }

    function renderSpace(key){
      var sp = spaceByKey(key);
      space = key; nameEl.textContent = sp.name;

      [].slice.call(rail.querySelectorAll("[data-space]")).forEach(function(b){
        var on = b.dataset.space === key;
        b.classList.toggle("on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
      });

      tabsBox.innerHTML = sp.channels.map(function(c, i){
        return '<button type="button" role="tab" data-ch="' + c.id + '"'
             + ' id="vizTab-' + key + '-' + c.id + '" aria-controls="vizPanel-' + key + '-' + c.id + '"'
             + (i===0 ? ' class="on" aria-selected="true" tabindex="0"' : ' aria-selected="false" tabindex="-1"')
             + (c.guardian ? ' data-guardian="1"' : '')
             + '>' + (c.guardian ? SHIELD : '') + esc(c.label)
             + (c.guardian ? '<span class="sr-only"> (guardian channel, specialist present)</span>' : '')
             + '</button>';
      }).join("");

      panels.innerHTML = sp.channels.map(function(c, i){
        return '<div class="viz__panel' + (i===0 ? " on" : "") + '" data-ch="' + c.id + '"'
             + ' id="vizPanel-' + key + '-' + c.id + '" role="tabpanel" aria-labelledby="vizTab-' + key + '-' + c.id + '"'
             + ' data-name="' + esc(c.label.replace(/^#/,"")) + '" data-status="' + esc(c.status) + '"'
             + ' data-typing="' + esc(c.typing) + '"' + (c.guardian ? ' data-guardian="1"' : '')
             + (i===0 ? "" : " hidden") + '>'
             + c.msgs.map(msgHTML).join("") + '</div>';
      }).join("");

      memBox.innerHTML =
        '<b>Specialists — ' + sp.members.specialists.length + '</b>'
        + sp.members.specialists.map(function(n){
            return '<div class="mem online">' + who(n, true)
                 + '<span class="sr-only">Online</span>'
                 + '<button type="button" class="badge" aria-describedby="vizTip">Verified</button></div>';
          }).join("")
        + '<b>Players — ' + sp.members.count + '</b>'
        + sp.members.players.map(function(n){
            var st = (PEOPLE[n] || {}).status || "Offline";
            var cls = st === "Online" || st === "In a match" ? "online" : st === "Idle" ? "idle" : "";
            // the dot alone would be colour-only information (WCAG 1.4.1)
            return '<div class="mem ' + cls + '">' + who(n, true)
                 + '<span class="sr-only">' + esc(st) + '</span></div>';
          }).join("");

      selectChannel(sp.channels[0].id);
    }

    function selectChannel(id, focus){
      chan = id;
      [].slice.call(tabsBox.querySelectorAll("[role=tab]")).forEach(function(b){
        var on = b.dataset.ch === id;
        b.classList.toggle("on", on);
        b.setAttribute("aria-selected", on ? "true" : "false");
        b.tabIndex = on ? 0 : -1;
        if(on && focus) b.focus();
      });
      var panel = null;
      [].slice.call(panels.children).forEach(function(pn){
        var on = pn.dataset.ch === id;
        pn.classList.toggle("on", on);
        if(on){ pn.removeAttribute("hidden"); panel = pn; } else pn.setAttribute("hidden","");
      });
      if(!panel) return;
      barEl.textContent  = "# " + panel.dataset.name;
      statEl.textContent = panel.dataset.status;
      guardEl.hidden = !panel.dataset.guardian;
      setFlag(!!panel.querySelector(".msg--private"));
      // the feed itself is a scripted mockup; announcing the switch is the
      // useful signal, announcing every message would just be noise
      var live = document.getElementById("vizAnnounce");
      if(live) live.textContent = "Now showing the " + panel.dataset.name
        + " channel in " + nameEl.textContent + ". " + panel.dataset.status + ".";
      play(panel);
    }

    function play(panel){
      clear();
      var all  = [].slice.call(panel.querySelectorAll(".msg"));
      var live = all.filter(function(x){ return !x.dataset.backlog; });
      all.forEach(function(x){ x.classList.toggle("on", !!x.dataset.backlog); });
      typing.classList.remove("on");
      if(reduce){ all.forEach(function(x){ x.classList.add("on"); }); return; }
      if(live[0]) live[0].classList.add("on");

      var t = 900;
      live.slice(1).forEach(function(x){
        at(t,       function(){ typeNm.textContent = x.dataset.who; typing.classList.add("on"); });
        at(t + 850, function(){ typing.classList.remove("on"); x.classList.add("on"); });
        t += 2000;
      });
      at(t + 300,  function(){ typeNm.textContent = panel.dataset.typing; typing.classList.add("on"); });
      at(t + 2500, function(){ play(panel); });
    }

    /* ---- profile popup -------------------------------------------------- */
    function openProfile(name){
      var p = PEOPLE[name];
      if(!p) return;
      var pro = p.role === "specialist";
      prof.innerHTML =
        '<button type="button" class="prof__close" aria-label="Close profile">&times;</button>'
        + '<img class="prof__av" src="' + avatar(p.av) + '" alt="">'
        + '<div class="prof__head">'
        +   '<strong id="vizProfileName">' + esc(name) + '</strong>'
        +   '<span class="prof__badge' + (pro ? " prof__badge--pro" : "") + '">'
        +     (pro ? "✓ Verified specialist" : "Player") + '</span>'
        + '</div>'
        + (pro
            ? '<dl class="prof__meta"><dt>Role</dt><dd>' + esc(p.title) + '</dd>'
              + '<dt>Focus</dt><dd>' + esc(p.focus) + '</dd></dl>'
              + '<p class="prof__bio">' + esc(p.bio) + '</p>'
            : '<dl class="prof__meta"><dt>Status</dt><dd>' + esc(p.status) + '</dd>'
              + '<dt>Plays</dt><dd>' + esc(p.game) + '</dd></dl>')
        + '<p class="prof__note">Mockup profile. The portrait is stock photography — '
        + 'not this person, and not a real practitioner.</p>';
      prof.removeAttribute("hidden");
      requestAnimationFrame(function(){ prof.classList.add("on"); });
      var c = prof.querySelector(".prof__close");
      if(c) c.focus();
    }
    function closeProfile(){
      if(prof.hasAttribute("hidden")) return;
      prof.classList.remove("on");
      setTimeout(function(){
        if(!prof.classList.contains("on")) prof.setAttribute("hidden","");
      }, 260);
      if(lastOpener && document.contains(lastOpener)) lastOpener.focus();
      lastOpener = null;
    }
    // focus stays inside the dialog while it is open
    prof.addEventListener("keydown", function(e){
      if(e.key !== "Tab") return;
      var f = prof.querySelectorAll('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])');
      if(!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    });

    /* ---- the quiet flag ---------------------------------------------------
       A player asks for a specialist without leaving the channel and without
       anyone else seeing it: a private note, then a private reply, and the
       specialist's row in the roster lights up. Mockup only — nothing is sent. */
    function setFlag(on){
      flagBtn.setAttribute("aria-pressed", on ? "true" : "false");
      flagBtn.textContent = on ? "Specialist asked · only you see this" : "Ask a specialist quietly";
    }
    function flag(){
      var panel = panels.querySelector(".viz__panel.on");
      if(!panel || panel.querySelector(".msg--private")) return;
      var sp = spaceByKey(space), pro = sp.members.specialists[0], ch = panel.dataset.name;
      panel.insertAdjacentHTML("beforeend",
        '<div class="msg msg--private on" data-backlog="1">'
        + '<span class="msg__lock" aria-hidden="true">' + LOCK + '</span>'
        + '<div class="body"><p class="msg__only">Only you can see this</p>'
        + '<p>You asked for a specialist. <b>' + esc(pro) + '</b> will check in with you privately — '
        + 'nobody else in #' + esc(ch) + ' can see that you asked.</p></div></div>');
      setFlag(true);
      var live = document.getElementById("vizAnnounce");
      if(live) live.textContent = "Specialist asked. Only you can see this. " + pro + " will check in with you privately.";
      var row = memBox.querySelector('.mem [data-who="' + pro + '"]');
      row = row && row.closest(".mem");
      if(row){ row.classList.add("pulse"); setTimeout(function(){ row.classList.remove("pulse"); }, 2600); }
      // not in the feed's own timer list: a feed restart must not cancel the reply
      setTimeout(function(){
        if(!document.contains(panel)) return;
        panel.insertAdjacentHTML("beforeend",
          '<div class="msg msg--private on" data-backlog="1" data-who="' + esc(pro) + '">'
          + who(pro, false)
          + '<div class="body"><div class="msg__head"><button type="button" class="msg__name pro" data-who="' + esc(pro) + '">'
          + esc(pro) + '</button><button type="button" class="vbadge" aria-describedby="vizTip">Verified specialist</button></div>'
          + '<p class="msg__only">Only to you</p>'
          + '<p>hey — saw your flag. want to talk here, or move to #quiet-room? no rush either way.</p></div></div>');
        if(live) live.textContent = pro + " replied, privately: want to talk here, or move to quiet-room? No rush either way.";
      }, reduce ? 0 : 1600);
    }
    var LOCK = '<svg viewBox="0 0 12 14" focusable="false"><path d="M3 6V4a3 3 0 0 1 6 0v2h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm1.5 0h3V4a1.5 1.5 0 0 0-3 0z"/></svg>';

    /* ---- verified-badge tooltip (WCAG 1.4.13: hoverable, dismissible with
       Esc, stays while the pointer or focus is on it; a tap also opens it) */
    var tipFor = null, tipHide = null;
    function showTip(b){
      clearTimeout(tipHide);
      tipFor = b; tip.hidden = false;
      var vr = viz.getBoundingClientRect(), br = b.getBoundingClientRect();
      var left = Math.min(Math.max(br.left - vr.left, 8), vr.width - tip.offsetWidth - 8);
      var top = br.bottom - vr.top + 8;
      if(top + tip.offsetHeight > vr.height - 8) top = br.top - vr.top - tip.offsetHeight - 8;
      tip.style.left = left + "px"; tip.style.top = Math.max(top, 8) + "px";
    }
    function hideTip(now){
      clearTimeout(tipHide);
      if(now){ tip.hidden = true; tipFor = null; return; }
      tipHide = setTimeout(function(){ tip.hidden = true; tipFor = null; }, 220);
    }
    viz.addEventListener("mouseover", function(e){
      var b = e.target.closest(".vbadge,.badge");
      if(b) showTip(b); else if(e.target.closest("#vizTip")) clearTimeout(tipHide);
    });
    viz.addEventListener("mouseout", function(e){
      if(e.target.closest(".vbadge,.badge,#vizTip")) hideTip();
    });
    viz.addEventListener("focusin", function(e){
      var b = e.target.closest(".vbadge,.badge");
      if(b) showTip(b); else if(tipFor) hideTip(true);
    });
    viz.addEventListener("focusout", function(e){
      if(e.target.closest(".vbadge,.badge")) hideTip();
    });

    /* ---- one delegated listener for the whole panel --------------------- */
    viz.addEventListener("click", function(e){
      var sp = e.target.closest("[data-space]");
      if(sp){ if(sp.dataset.space !== space) renderSpace(sp.dataset.space); return; }
      var tab = e.target.closest("[role=tab]");
      if(tab){ if(tab.dataset.ch !== chan) selectChannel(tab.dataset.ch); return; }
      if(e.target.closest(".prof__close")){ closeProfile(); return; }
      if(e.target.closest("#vizFlag")){ flag(); return; }
      var badge = e.target.closest(".vbadge,.badge");
      if(badge){ showTip(badge); return; }
      if(tipFor && !e.target.closest("#vizTip")) hideTip(true);
      var person = e.target.closest("[data-who]");
      if(person && person.tagName === "BUTTON"){ lastOpener = person; openProfile(person.dataset.who); return; }
      if(!e.target.closest("#vizProfile")) closeProfile();
    });
    viz.addEventListener("keydown", function(e){
      if(e.key === "Escape"){ if(tipFor){ hideTip(true); return; } closeProfile(); return; }
      var d = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1
            : e.key === "ArrowUp"   || e.key === "ArrowLeft"  ? -1 : 0;
      if(!d) return;
      var inRail = e.target.closest("[data-space]");
      var list = inRail ? [].slice.call(rail.querySelectorAll("[data-space]"))
                        : e.target.closest("[role=tab]") ? [].slice.call(tabsBox.querySelectorAll("[role=tab]")) : null;
      if(!list) return;
      e.preventDefault();
      var i = list.indexOf(e.target), next = list[(i + d + list.length) % list.length];
      if(inRail){ renderSpace(next.dataset.space); rail.querySelector(".on").focus(); }
      else selectChannel(next.dataset.ch, true);
    });

    renderSpace("R");
    if(reduce) return;
    MOTION.onStop(clear);
    onVisible(viz,
      function(){ onScreen = true;  var p = panels.querySelector(".viz__panel.on"); if(p) play(p); },
      function(){ onScreen = false; clear(); });
  })();

  /* ---- avatar video: freeze on the poster frame when motion is reduced,
     and never let a blocked autoplay leave an empty circle ---------------- */
  (function(){
    var vids = document.querySelectorAll("video[autoplay]");
    vids.forEach(function(v){
      if(reduce){ v.removeAttribute("autoplay"); v.pause(); return; }
      var play = v.play();
      if(play && play.catch) play.catch(function(){ /* poster stays up */ });
    });
  })();

  /* run a canvas loop only while it is on screen */
  function onVisible(el, start, stop){
    if(!("IntersectionObserver" in window)){ start(); return; }
    var on = false;
    new IntersectionObserver(function(es){
      es.forEach(function(e){
        if(e.isIntersecting && !on){ on = true; start(); }
        else if(!e.isIntersecting && on){ on = false; stop(); }
      });
    }, {threshold:0.05}).observe(el);
  }

  /* ---- shared motion tokens ----------------------------------- */
  var ROOT = getComputedStyle(document.documentElement);
  function token(name, fallback){
    var v = ROOT.getPropertyValue(name).trim();
    return v || fallback;
  }
  function ms(name, fallback){
    var v = token(name, fallback);
    return v.slice(-2) === "ms" ? parseFloat(v) : parseFloat(v) * 1000;
  }

  /* ---- logo marquees (fixes 6, 7, 9) -----------------------------------
     Duration is derived from the measured half-width so every row drifts at
     the same pixels-per-second, whatever it contains. */
  (function(){
    var rows = document.querySelectorAll("[data-marquee]");
    if(!rows.length) return;
    var speed = parseFloat(token("--marquee-speed", "42")) || 42;
    function size(m){
      var track = m.querySelector(".marquee__track");
      if(!track) return;
      var half = track.scrollWidth / 2;
      if(half > 20) track.style.setProperty("--marquee-dur", (half / speed).toFixed(2) + "s");
    }
    function sizeAll(){ rows.forEach(size); }
    sizeAll();
    // lazy images change the width as they arrive
    document.querySelectorAll(".marquee img").forEach(function(img){
      if(!img.complete) img.addEventListener("load", sizeAll, {once:true});
    });
    window.addEventListener("load", sizeAll);
    var rt;
    window.addEventListener("resize", function(){ clearTimeout(rt); rt = setTimeout(sizeAll, 200); });
  })();

  /* ---- heart morph --------------------------------------------- */
  (function(){
    var svg = document.getElementById("careMorph");
    if(!svg) return;
    var anim = svg.querySelector("animate"), path = svg.querySelector("path");
    if(!anim || !path) return;
    if(reduce){
      var vals = anim.getAttribute("values").split(";");
      path.setAttribute("d", vals[3].trim());   // freeze on the heart
      anim.remove();
      return;
    }
    anim.setAttribute("dur", token("--duration-morph", "8s"));  // single source of truth
  })();

  /* ---- typewriter reveal on both headlines ------------- */
  function splitChars(h){
    if(!h || h.dataset.split) return;
    h.dataset.split = "1";
    var n = 0, walker = document.createTreeWalker(h, NodeFilter.SHOW_TEXT, null);
    var nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function(node){
      if(!node.nodeValue.trim()) return;                 // leave the spaces alone
      var frag = document.createDocumentFragment();
      node.nodeValue.split("").forEach(function(c){
        if(c === " "){ frag.appendChild(document.createTextNode(c)); return; }
        var i = document.createElement("i");
        i.className = "ch"; i.style.setProperty("--i", n++); i.textContent = c;
        frag.appendChild(i);
      });
      node.parentNode.replaceChild(frag, node);
    });
  }
  [].slice.call(document.querySelectorAll(".hero-h1")).forEach(splitChars);
  /* the reveal runs first and the dimming of "impact" and
     "toget" only starts once every character has faded up, so "toget" is
     visibly animating in from 0 rather than appearing and then fading down. */
  function typeIn(h){
    if(!h || h.dataset.revealed) return;
    h.dataset.revealed = "1";
    requestAnimationFrame(function(){
      h.classList.add("typed");
      var n = h.querySelectorAll(".ch").length;
      setTimeout(function(){ h.classList.add("lit"); }, reduce ? 0 : n * 26 + 320);
    });
  }

  /* ---- hero ticker -------------------------------------
     Scrolls one line per beat on the shared easing; the mask above handles
     the graduated opacity of the queued lines. */
  (function(){
    var t = document.querySelector("[data-ticker]");
    if(!t) return;
    var track = t.querySelector(".ticker__track");
    var REAL = 3;                                   // words before the duplicates
    if(reduce) return;                              // rests on "data."
    var i = 0, timer = null;
    function lineH(){ return track.children[0].getBoundingClientRect().height; }
    track.addEventListener("transitionend", function(e){
      if(e.propertyName !== "transform" || i < REAL) return;
      track.style.transition = "none";
      track.style.transform  = "translateY(0px)";
      void track.offsetHeight;
      i = 0;
    });
    function step(){
      i++;
      track.style.transition = "transform " + ms("--duration-slide","700ms") + "ms " + token("--ease-standard","ease");
      track.style.transform  = "translateY(" + (-i * lineH()) + "px)";
    }
    function start(){ if(!timer) timer = setInterval(step, ms("--duration-tick","1.4s") + ms("--duration-slide","700ms")); }
    function stop(){ clearInterval(timer); timer = null; }
    MOTION.onStop(stop);
    onVisible(t, start, stop);
  })();

  
  (function(){
    var bar   = document.querySelector(".proof-line span"),
        quote = document.getElementById("proofQuote"),
        box   = document.querySelector(".avatars");
    if(!bar || !quote || !box) return;
    var vids = [].slice.call(box.querySelectorAll("video"));
    var QUOTES = [
      "this is more helpful than you think",
      "turns out logging in helps more than logging off",
      "someone who gets it is usually online",
      "your guild might have a specialist in it",
      "it's okay to need a check-in mid-raid",
      "mental health, one server at a time",
      "built by people who get the grind",
      "same game, better support",
      "you don't have to quit to feel better",
      "isolation ends where community begins",
      "we made the safe space you needed",
      "specialists who actually understand the meta",
      "your co-op partner might save your day",
      "help doesn't have to log you off",
      "real talk, from real gamers",
      "the best builds include a support role",
      "you're not alone in this lobby",
      "care that speaks your language",
      "AFK from stigma, not from help",
      "level up your mental health too",
      "trusted adults, same servers",
      "we queue up with you",
      "burnout isn't the end of the run",
      "you don't need a cheat code for this",
      "someone's got your back in this raid",
      "healthy gaming starts with honest talking",
      "less isolation, more connection",
      "a guild that actually checks in",
      "gaming safe isn't a myth",
      "we built the support you wish you had",
      "your mental health deserves an upgrade too",
      "still playing. still supported."
    ];
    var CLIPS = ["p1","p2","p3","p4"];   // 4 clips through 3 slots, so the trio changes
    var qi = 0, ci = 0;
    vids.forEach(function(v,i){ v.dataset.clip = CLIPS[i]; });
    if(reduce) return;                    // no rotation when motion is reduced

    bar.addEventListener("animationiteration", function(){
      qi = (qi + 1) % QUOTES.length;
      ci = (ci + 1) % CLIPS.length;
      quote.classList.add("is-swapping");
      box.classList.add("is-swapping");
      setTimeout(function(){
        quote.textContent = "\u201C" + QUOTES[qi] + "\u201D";
        vids.forEach(function(v,i){
          var name = CLIPS[(ci + i) % CLIPS.length];
          if(v.dataset.clip === name) return;
          v.dataset.clip = name;
          if(!LICENSED){ v.poster = "./assets/people/" + name + ".jpg"; return; }
          v.poster = "./assets/video/" + name + ".jpg";
          v.src    = "./assets/video/" + name + ".mp4";
          var pl = v.play(); if(pl && pl.catch) pl.catch(function(){});
        });
        quote.classList.remove("is-swapping");
        box.classList.remove("is-swapping");
      }, 380);
    });
  })();

  /* ---- morphing waveform with trailing frames ------------------
     Every term is an integer harmonic of the cycle phase, so the loop closes
     on itself exactly. Five earlier phases are drawn behind the current one
     at falling opacity for the persistence-of-vision stack. */
  (function(){
    var cv = document.getElementById("waveMark");
    if(!cv) return;
    var ctx = cv.getContext("2d"), W = 0, H = 0, mid = 0, amp = 0;
    var TRAIL = 5, LAG = 0.11, stopped = false;
    var dur = (parseFloat(token("--duration-wave","5.5s"))||5.5) * 1000;
    // the shared mark family: one line weight and the token inks (read live,
    // so high contrast's brighter soft ink reaches the canvas too)
    var STROKE = parseFloat(token("--icon-stroke","2px")) || 2, PAD = STROKE;

    // draw in CSS px on a devicePixelRatio backing store, so the line is the
    // same 2px as every SVG mark at any size or screen density
    function size(){
      var r = cv.getBoundingClientRect();
      if(!r.width) return false;
      var d = window.devicePixelRatio || 1;
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
      ctx.setTransform(d, 0, 0, d, 0, 0);
      W = r.width; H = r.height; mid = H * 0.52; amp = H * 0.42;
      // trailing frames ~5px apart at desktop size; capped at .32 (~4px at the
      // 83px mobile size) so the trail span stays short
      LAG = Math.min(0.32, 2 * Math.PI * 5.5 / W);
      return true;
    }

    function y(x, p){
      var env = Math.sin(x*Math.PI);               // pinned to the baseline at both ends
      // fixed weights, phase-shifted harmonics: the shape keeps morphing but
      // the amplitude never collapses the way multiplying by sin(p) did
      return mid - env * amp * (
          0.60*Math.sin(x*Math.PI*2 + p)
        + 0.28*Math.sin(x*Math.PI*4 + 2*p + 1.1)
        + 0.18*Math.sin(x*Math.PI*6 + 3*p + 2.3)
      );
    }
    function curve(p, style){
      ctx.beginPath();
      for(var i=0;i<=120;i++){
        var x = i/120;
        var px = x*(W-2*PAD)+PAD, py = y(x,p);
        i ? ctx.lineTo(px,py) : ctx.moveTo(px,py);
      }
      ctx.strokeStyle = style;
      ctx.lineWidth = STROKE; ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.stroke();
    }
    function draw(p){
      if(!W && !size()) return;
      ctx.clearRect(0,0,W,H);
      ctx.beginPath();                              // the baseline: the soft track
      ctx.moveTo(PAD,mid); ctx.lineTo(W-PAD,mid);
      ctx.strokeStyle = token("--icon-ink-soft","rgba(255,255,255,.35)");
      ctx.lineWidth = STROKE; ctx.lineCap = "round"; ctx.stroke();
      var rgb = token("--icon-rgb","255,255,255");   // yellow in high contrast
      for(var k=TRAIL;k>=1;k--) curve(p - k*LAG, "rgba(" + rgb + "," + (0.10 + (TRAIL-k)*0.055) + ")");
      curve(p, token("--icon-ink","rgba(255,255,255,.85)"));
    }
    size();
    // moving the window to a screen with another pixel density changes no CSS
    // size, so ResizeObserver stays quiet: watch the resolution itself
    (function watchDpr(){
      var mq = window.matchMedia && matchMedia("(resolution: " + (window.devicePixelRatio || 1) + "dppx)");
      if(!mq || !mq.addEventListener) return;
      mq.addEventListener("change", function(){
        if(size() && stopped) draw(0.8);    // a running loop redraws on its next frame
        watchDpr();                          // re-arm for the new ratio
      }, {once:true});
    })();
    if("ResizeObserver" in window){
      new ResizeObserver(function(){ if(size() && stopped) draw(0.8); }).observe(cv);
    }
    // a frozen frame still follows the high-contrast switch
    new MutationObserver(function(){ if(stopped) draw(0.8); })
      .observe(document.documentElement, {attributes:true, attributeFilter:["class"]});
    if(reduce){ stopped = true; draw(0.8); return; }
    var start = null, raf;
    function frame(ts){
      if(start===null) start = ts;
      draw(((ts-start)%dur)/dur * Math.PI*2);
      raf = requestAnimationFrame(frame);
    }
    MOTION.onStop(function(){ stopped = true; cancelAnimationFrame(raf); draw(0.8); });
    onVisible(cv, function(){ if(!stopped) raf = requestAnimationFrame(frame); },
                  function(){ cancelAnimationFrame(raf); start = null; });
  })();


  /* ---- accessibility widget ---------------------------
     Three controls, persisted in localStorage. "Reduce motion" is an override
     on top of the OS setting, not a mirror of it: someone who does not know
     their OS has the setting can still find it here. */
  (function(){
    var root = document.documentElement,
        wrap = document.getElementById("a11y"),
        btn  = document.getElementById("a11yBtn"),
        panel= document.getElementById("a11yPanel"),
        mot  = document.getElementById("a11yMotion"),
        con  = document.getElementById("a11yContrast"),
        steps= panel ? [].slice.call(panel.querySelectorAll("[data-size]")) : [];
    if(!wrap || !btn) return;

    function save(p){ try{ localStorage.setItem(STORE, JSON.stringify(p)); }catch(e){} }

    function applyMotion(on){
      root.classList.toggle("a11y-reduce", on);
      mot.setAttribute("aria-checked", on ? "true" : "false");
      if(on) MOTION.freeze();
    }
    function applyContrast(on){
      root.classList.toggle("a11y-contrast", on);
      con.setAttribute("aria-checked", on ? "true" : "false");
    }
    function applySize(size){
      root.classList.remove("a11y-text-sm","a11y-text-lg");
      if(size === "sm") root.classList.add("a11y-text-sm");
      if(size === "lg") root.classList.add("a11y-text-lg");
      steps.forEach(function(b){ b.setAttribute("aria-pressed", b.dataset.size === size ? "true" : "false"); });
    }

    var p = prefs();
    applyMotion(!!p.motion);
    applyContrast(!!p.contrast);
    applySize(p.size || "md");

    function open(on){
      wrap.classList.toggle("open", on);
      btn.setAttribute("aria-expanded", on ? "true" : "false");
    }
    btn.addEventListener("click", function(){ open(!wrap.classList.contains("open")); });
    mot.addEventListener("click", function(){
      var p = prefs(); p.motion = !p.motion; save(p); applyMotion(p.motion);
    });
    con.addEventListener("click", function(){
      var p = prefs(); p.contrast = !p.contrast; save(p); applyContrast(p.contrast);
    });
    steps.forEach(function(b){
      b.addEventListener("click", function(){
        var p = prefs(); p.size = b.dataset.size; save(p); applySize(p.size);
      });
    });

    document.addEventListener("keydown", function(e){
      if(e.key === "Escape" && wrap.classList.contains("open")){ open(false); btn.focus(); }
    });
    document.addEventListener("click", function(e){
      if(!wrap.contains(e.target) && wrap.classList.contains("open")) open(false);
    });
  })();

  /* ---- Research & Sources drawer -------------------------------- */
  (function(){
    [].slice.call(document.querySelectorAll(".drawer")).forEach(function(d){
      var btn = d.querySelector(".drawer__toggle");
      if(!btn) return;
      btn.addEventListener("click", function(){
        var open = d.classList.toggle("open");
        btn.setAttribute("aria-expanded", open ? "true" : "false");
      });
    });
  })();

  /* ---- FAQ accordion, single-open -------------------------- */
  document.querySelectorAll(".faq__q").forEach(function(btn){
    var item = btn.parentElement;
    btn.addEventListener("click", function(){
      var open = item.classList.contains("open");
      document.querySelectorAll(".faq__item.open").forEach(function(o){
        o.classList.remove("open");
        o.querySelector(".faq__q").setAttribute("aria-expanded","false");
      });
      if(!open){
        item.classList.add("open");
        btn.setAttribute("aria-expanded","true");
      }
    });
  });
})();
