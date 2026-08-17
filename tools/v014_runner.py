from pathlib import Path

p=Path('tools/v014_patch.py')
s=p.read_text()
bad='''for(let round=1;round<=maxRounds;round++){
",'''
good='''for(let round=1;round<=maxRounds;round++){\\n",'''
if bad not in s:
    raise SystemExit('V0.14 runner: target newline marker not found')
s=s.replace(bad,good,1)
code=compile(s,'tools/v014_patch.py','exec')
exec(code,{'__name__':'__main__'})
