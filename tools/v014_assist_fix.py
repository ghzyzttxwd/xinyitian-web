from pathlib import Path
p=Path('src/battle.js')
s=p.read_text()
old="function performOne(actor,own,enemies,log,round,forceSkill=false,forceNormal=false){"
new="function performOne(actor,own,enemies,log,round,forceSkill=false,forceNormal=false,noNormalRage=false){"
if old not in s: raise SystemExit('performOne signature marker missing')
s=s.replace(old,new,1)
old="  }else if(Number(actor.statuses?.seal||0)<=0)actor.rage=Math.min(8,actor.rage+2);"
new="  }else if(!noNormalRage&&Number(actor.statuses?.seal||0)<=0)actor.rage=Math.min(8,actor.rage+2);"
if old not in s: raise SystemExit('normal rage marker missing')
s=s.replace(old,new,1)
old="    performOne(source,own,enemies,log,round,canSkill,!canSkill);"
new="    performOne(source,own,enemies,log,round,canSkill,!canSkill,true);"
if old not in s: raise SystemExit('assist perform marker missing')
s=s.replace(old,new,1)
p.write_text(s)
